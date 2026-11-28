-- Forum → belief-page integration demo: schema + seed.
--
-- The demo implements the "one permanent page per belief" architecture in
-- plain PHP + SQL: chatrooms and web forums reset discussion to zero, so
-- every conversation here plugs into a permanent belief page. Transcripts
-- are stored verbatim, candidate pro/con claims are mined from them, and a
-- candidate becomes an argument only through an explicit integration move.
-- Scores are never stored: every score is a VIEW over the argument graph,
-- recomputed on read — the SQL twin of the audit lock ("ingestion never
-- writes scores").
--
-- Seeded content: the "Protecting the Constitution" topic and two of its
-- belief pages — election acceptance and court compliance — plus one
-- imported Reddit-style thread showing every candidate outcome (integrated,
-- pending, folded duplicate, dismissed).

PRAGMA foreign_keys = ON;

-- ─── The permanent pages ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fi_beliefs (
  belief_id   TEXT PRIMARY KEY,          -- slug: one page per claim
  statement   TEXT NOT NULL,             -- complete proposition, positive form
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- One pro/con edge: the child belief argues for/against the parent belief.
-- No score columns anywhere — scores are views.
CREATE TABLE IF NOT EXISTS fi_arguments (
  argument_id      TEXT PRIMARY KEY,
  parent_belief_id TEXT NOT NULL REFERENCES fi_beliefs(belief_id),
  child_belief_id  TEXT NOT NULL REFERENCES fi_beliefs(belief_id),
  side             TEXT NOT NULL CHECK (side IN ('agree', 'disagree')),
  UNIQUE (parent_belief_id, child_belief_id, side)
);
CREATE INDEX IF NOT EXISTS idx_fi_arg_parent ON fi_arguments(parent_belief_id);
CREATE INDEX IF NOT EXISTS idx_fi_arg_child  ON fi_arguments(child_belief_id);

-- Linkage sub-debate per edge: does the child really bear on the parent?
CREATE TABLE IF NOT EXISTS fi_linkage_entries (
  entry_id    TEXT PRIMARY KEY,
  argument_id TEXT NOT NULL REFERENCES fi_arguments(argument_id),
  side        TEXT NOT NULL CHECK (side IN ('agree', 'disagree')),
  statement   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fi_link_arg ON fi_linkage_entries(argument_id, side);

-- Importance sub-debate per edge: granting the child true, how much should
-- it move the parent?
CREATE TABLE IF NOT EXISTS fi_importance_entries (
  entry_id    TEXT PRIMARY KEY,
  argument_id TEXT NOT NULL REFERENCES fi_arguments(argument_id),
  side        TEXT NOT NULL CHECK (side IN ('agree', 'disagree')),
  statement   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fi_imp_arg ON fi_importance_entries(argument_id, side);

-- Evidence ledger: fails empirically, so it lives apart from the argument
-- tree (which fails logically). Every item names what it bears on.
CREATE TABLE IF NOT EXISTS fi_evidence (
  evidence_id  TEXT PRIMARY KEY,
  belief_id    TEXT NOT NULL REFERENCES fi_beliefs(belief_id),
  side         TEXT NOT NULL CHECK (side IN ('supporting', 'weakening')),
  description  TEXT NOT NULL,
  producer     TEXT,
  tier         INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
  bears_on     TEXT REFERENCES fi_arguments(argument_id)  -- NULL = the belief directly
);
CREATE INDEX IF NOT EXISTS idx_fi_ev_belief ON fi_evidence(belief_id, side);

-- ─── The topic layer: one fixed address per belief ───────────────────────

CREATE TABLE IF NOT EXISTS fi_topics (
  topic_id   TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  definition TEXT NOT NULL,
  scope      TEXT NOT NULL
);

-- The three-part address: Direction (-100..+100), Magnitude band, and the
-- general-to-specific tree node (rung + branch). Same address = duplicate,
-- merge; nearly the same = redundancy discount at scoring time.
CREATE TABLE IF NOT EXISTS fi_topic_beliefs (
  topic_id    TEXT NOT NULL REFERENCES fi_topics(topic_id),
  belief_id   TEXT NOT NULL REFERENCES fi_beliefs(belief_id),
  direction   INTEGER NOT NULL CHECK (direction BETWEEN -100 AND 100),
  magnitude   TEXT NOT NULL CHECK (magnitude IN ('Modest', 'Moderate', 'Strong', 'Total')),
  rung_type   TEXT NOT NULL CHECK (rung_type IN ('general', 'subcategory', 'specific')),
  branch_name TEXT,                      -- NULL only on the general rung
  PRIMARY KEY (topic_id, belief_id)
);

-- ─── The conversation lane: find → track → integrate ─────────────────────

CREATE TABLE IF NOT EXISTS fi_threads (
  thread_id  TEXT PRIMARY KEY,
  platform   TEXT NOT NULL CHECK (platform IN ('discord', 'reddit', 'twitter', 'forum', 'chat', 'other')),
  title      TEXT NOT NULL,
  source_url TEXT,
  belief_id  TEXT REFERENCES fi_beliefs(belief_id),  -- the page it plugs into
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fi_thread_belief ON fi_threads(belief_id);

CREATE TABLE IF NOT EXISTS fi_messages (
  message_id TEXT PRIMARY KEY,
  thread_id  TEXT NOT NULL REFERENCES fi_threads(thread_id),
  idx        INTEGER NOT NULL,
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  UNIQUE (thread_id, idx)
);

-- A mined candidate claim, waiting on review. The band routes it:
--   distinct       → integrate extends the page's outline
--   related-link   → integrate, with the cluster recorded
--   probable-group / same-claim → fold into the existing argument (combine)
CREATE TABLE IF NOT EXISTS fi_candidates (
  candidate_id        TEXT PRIMARY KEY,
  thread_id           TEXT NOT NULL REFERENCES fi_threads(thread_id),
  message_id          TEXT NOT NULL REFERENCES fi_messages(message_id),
  statement           TEXT NOT NULL,
  direction           TEXT NOT NULL CHECK (direction IN ('pro', 'con')),
  context_quote       TEXT,
  nearest_argument_id TEXT REFERENCES fi_arguments(argument_id),
  similarity          REAL,
  band                TEXT CHECK (band IN ('same-claim', 'probable-group', 'related-link', 'distinct')),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'integrated', 'duplicate', 'dismissed')),
  integrated_argument_id TEXT REFERENCES fi_arguments(argument_id),
  created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_fi_cand_thread ON fi_candidates(thread_id, status);

-- Every mutation carries its "why".
CREATE TABLE IF NOT EXISTS fi_audit_log (
  audit_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  rationale   TEXT NOT NULL,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fi_settings (
  setting_key TEXT PRIMARY KEY,
  value       REAL NOT NULL
);
INSERT OR IGNORE INTO fi_settings (setting_key, value) VALUES ('sub_argument_multiplier', 0.7);

-- ─── Score views (the engine; never stored) ──────────────────────────────

-- Per-edge linkage score: (agree − disagree) / total, 1.0 when undebated.
CREATE VIEW IF NOT EXISTS v_fi_edge_linkage AS
SELECT
  a.argument_id,
  a.parent_belief_id,
  a.child_belief_id,
  a.side,
  COALESCE(SUM(l.side = 'agree'), 0)    AS linkage_agree,
  COALESCE(SUM(l.side = 'disagree'), 0) AS linkage_disagree,
  CASE
    WHEN COUNT(l.entry_id) = 0 THEN 1.0
    ELSE (SUM(l.side = 'agree') - SUM(l.side = 'disagree')) * 1.0 / COUNT(l.entry_id)
  END AS linkage_score
FROM fi_arguments a
LEFT JOIN fi_linkage_entries l ON l.argument_id = a.argument_id
GROUP BY a.argument_id, a.parent_belief_id, a.child_belief_id, a.side;

-- Per-edge importance score, same shape.
CREATE VIEW IF NOT EXISTS v_fi_edge_importance AS
SELECT
  a.argument_id,
  CASE
    WHEN COUNT(i.entry_id) = 0 THEN 1.0
    ELSE (SUM(i.side = 'agree') - SUM(i.side = 'disagree')) * 1.0 / COUNT(i.entry_id)
  END AS importance_score
FROM fi_arguments a
LEFT JOIN fi_importance_entries i ON i.argument_id = a.argument_id
GROUP BY a.argument_id;

-- Combined per-edge factor used by the recursive score.
CREATE VIEW IF NOT EXISTS v_fi_edge_factor AS
SELECT
  el.argument_id,
  el.parent_belief_id,
  el.child_belief_id,
  el.side,
  el.linkage_score,
  ei.importance_score,
  el.linkage_score * ei.importance_score AS edge_factor
FROM v_fi_edge_linkage el
JOIN v_fi_edge_importance ei ON ei.argument_id = el.argument_id;

-- Recursive belief score, the founding-workbook formula extended with the
-- importance factor:
--   score(B) = (nAgree − nDisagree)
--            + m · ( Σ agree score(child)·LS·IMP − Σ disagree score(child)·LS·IMP )
-- Every path B → X1 → … → Xk contributes m^(k−1) · Π(factor over the first
-- k−1 edges) · Π(sign); the path column blocks cycles. scoring.php runs the
-- same CTE with a bound :multiplier.
CREATE VIEW IF NOT EXISTS v_fi_belief_scores AS
WITH RECURSIVE score_paths AS (
  SELECT
    ef.parent_belief_id                                AS root_id,
    ef.child_belief_id                                 AS node_id,
    ef.parent_belief_id || ',' || ef.child_belief_id   AS path,
    CASE ef.side WHEN 'agree' THEN 1.0 ELSE -1.0 END   AS weight,
    ef.edge_factor                                     AS last_factor
  FROM v_fi_edge_factor ef

  UNION ALL

  SELECT
    p.root_id,
    ef.child_belief_id,
    p.path || ',' || ef.child_belief_id,
    p.weight * (SELECT value FROM fi_settings WHERE setting_key = 'sub_argument_multiplier')
             * p.last_factor
             * CASE ef.side WHEN 'agree' THEN 1.0 ELSE -1.0 END,
    ef.edge_factor
  FROM score_paths p
  JOIN v_fi_edge_factor ef ON ef.parent_belief_id = p.node_id
  WHERE instr(',' || p.path || ',', ',' || ef.child_belief_id || ',') = 0
)
SELECT b.belief_id, b.statement, COALESCE(SUM(p.weight), 0) AS score
FROM fi_beliefs b
LEFT JOIN score_paths p ON p.root_id = b.belief_id
GROUP BY b.belief_id, b.statement;

-- Per-edge display row: Argument Score × Linkage × Importance = Impact.
CREATE VIEW IF NOT EXISTS v_fi_edge_impact AS
SELECT
  ef.argument_id,
  ef.parent_belief_id,
  ef.child_belief_id,
  ef.side,
  s.score                                    AS argument_score,
  ef.linkage_score,
  ef.importance_score,
  s.score * ef.edge_factor                   AS impact
FROM v_fi_edge_factor ef
JOIN v_fi_belief_scores s ON s.belief_id = ef.child_belief_id;

-- ─── Seed: beliefs ───────────────────────────────────────────────────────

INSERT OR IGNORE INTO fi_beliefs (belief_id, statement) VALUES
-- Root pages (the two seeded sub-pages of the topic)
('accept-certified-results', 'We should accept certified election results even when our side loses.'),
('comply-with-final-rulings', 'Officials should comply with final court rulings while appealing the ones they believe are wrong.'),

-- Election acceptance: pro arguments (each is a belief with its own page)
('reciprocal-insurance', 'Election acceptance is a reciprocal insurance contract: each side''s concession today purchases the other side''s concession tomorrow.'),
('dispute-channel-exists', 'Election challenges belong in court under rules fixed before the outcome was known.'),
('one-way-ratchet', 'Refusing certified defeat is a one-way ratchet that collapses the concession equilibrium.'),
('feedback-sensor', 'Elections are the feedback sensor of the constitutional control loop: the only instrument that measures the consent of the governed.'),
('survivable-losing', 'Constitutional government made losing power survivable, converting wars of succession into election campaigns.'),
-- Election acceptance: con arguments
('consent-ratifies-unfairness', 'Demands to respect the outcome can launder a degraded process into legitimacy.'),
('stolen-elections-exist', 'History contains stolen elections, so an unconditional acceptance rule would sometimes command surrender to fraud.'),
('partisan-referees', 'Certification and adjudication are run by partisans, so deference to their verdicts is not neutral.'),
('asymmetric-scruple', 'Acceptance norms bind asymmetrically in practice: the side with more institutional scruple keeps conceding while the other side pockets the wins.'),

-- Election acceptance: sub-arguments (grandchildren)
('everyone-eventually-loses', 'Every faction eventually loses an election it expected to win.'),
('sixty-challenges-rejected', 'More than sixty post-2020 election challenges were adjudicated and rejected for lack of proof.'),
('own-judges-rejected', 'Judges appointed by the challenging side rejected the post-2020 election claims.'),
('contested-successions-violent', 'Comparative cases where losers stopped conceding show contested successions turning violent or extra-constitutional.'),
('hayes-tilden-bargain', 'The disputed 1876 Hayes-Tilden election was settled by a partisan commission and a political bargain, not clean adjudication.'),
('machine-era-fraud', 'Machine-era ballot fraud is documented in American cities.'),
('cross-party-rulings', 'Election rulings regularly cut against the appointing party of the judges issuing them.'),

-- Court compliance: pro arguments
('orders-bind-or-decorative', 'Court orders bind the government or judicial review is decorative: the judiciary has neither force nor will, but merely judgment.'),
('appeal-channel-remedies', 'A wrong ruling has lawful remedies, so defiance does not create a remedy: it skips them all.'),
('defiance-ratchet', 'A precedent of ignoring rulings transfers whole to the next administration, including the ones that will rule against you.'),
('preserve-the-forum', 'Compliance preserves the forum where winning means anything: obey now, argue on, and a later victory restores the position.'),
-- Court compliance: con arguments
('departmentalism', 'The departmentalist tradition from Jefferson through Lincoln holds that each branch interprets the Constitution for itself.'),
('lawless-rulings', 'Some rulings are themselves lawless, and compliance entrenched grave abuses until politics undid the damage.'),
('slow-appeals-harm', 'Slow appeals let irreversible harm complete before the remedy arrives, so compliance can moot the case that would have vindicated the objector.'),
('partisan-rulings-laundered', 'When rulings track the appointing party, compliance norms launder partisan outcomes as neutral law.'),

-- Court compliance: sub-arguments
('youngstown-steel', 'Truman returned the steel mills within hours of the Youngstown ruling in 1952.'),
('cooper-v-aaron', 'Cooper v. Aaron unanimously held states bound by federal court constitutional interpretation.'),
('nixon-tapes-compliance', 'Nixon complied with the unanimous tapes ruling and resigned sixteen days later: compliance at maximum personal cost.'),
('worcester-unenforced', 'Georgia''s defiance of Worcester v. Georgia went unenforced without immediate institutional collapse.'),
('merryman-defiance', 'Lincoln''s administration declined to obey Taney''s habeas ruling in Ex parte Merryman.'),

-- Topic-address rows without argument trees yet (blank scores by rule)
('constitution-worldview-pro', 'Systems that distribute power and correct their own errors outperform systems that concentrate power.'),
('constitution-worldview-anti', 'Rules written by past majorities cannot legitimately bind present ones; process worship entrenches inherited injustice.'),
('oversight-any-party', 'Congressional oversight deserves support regardless of which party wields it.'),
('oversight-is-harassment', 'Oversight run by the other party is harassment and deserves stonewalling.'),
('amendment-channel', 'Constitutional change should run through Article V and state experimentation, not around them.'),
('article-v-frozen', 'Article V is frozen, so working around constitutional constraints is justified.'),
('speech-protects-critics', 'Speech and press protections cover your critics, or they protect no one.'),
('dangerous-speech-forfeits', 'Speech that undermines institutions or spreads dangerous falsehoods forfeits protection.'),
('equal-application', 'The same laws bind officials of every party.'),
('law-serves-leadership', 'Law enforcement legitimately serves the elected leadership''s priorities.'),
('election-binds-both', 'Certified election outcomes bind winners and losers alike, regardless of party.'),
('binds-only-if-fair', 'Election outcomes bind only when the loser judges the process fair.'),
('rulings-bind-officials', 'Officials must comply with final court rulings while appealing the ones they believe wrong.'),
('branches-may-defy', 'Branches may defy rulings that exceed the judiciary''s legitimate authority.'),
('ministerial-duty', 'Certification of election results is a ministerial duty, not a discretionary veto.'),
('certifier-discretion', 'Certifying officials should have discretion to block results they suspect.'),
('pre-commitment-pledges', 'Candidates should state before the election what evidence would justify a challenge and which adjudication is final.'),
('keep-options-open', 'Candidates should keep every post-election option open, including pressure on the officials who count.');

-- ─── Seed: argument edges ────────────────────────────────────────────────

INSERT OR IGNORE INTO fi_arguments (argument_id, parent_belief_id, child_belief_id, side) VALUES
-- Election acceptance tree
('e-pro-insurance',  'accept-certified-results', 'reciprocal-insurance',        'agree'),
('e-pro-channel',    'accept-certified-results', 'dispute-channel-exists',      'agree'),
('e-pro-ratchet',    'accept-certified-results', 'one-way-ratchet',             'agree'),
('e-pro-sensor',     'accept-certified-results', 'feedback-sensor',             'agree'),
('e-pro-survivable', 'accept-certified-results', 'survivable-losing',           'agree'),
('e-con-consent',    'accept-certified-results', 'consent-ratifies-unfairness', 'disagree'),
('e-con-stolen',     'accept-certified-results', 'stolen-elections-exist',      'disagree'),
('e-con-referees',   'accept-certified-results', 'partisan-referees',           'disagree'),
('e-con-asymmetric', 'accept-certified-results', 'asymmetric-scruple',          'disagree'),
-- Cross-link: the court-compliance page supports election acceptance
('e-pro-courts',     'accept-certified-results', 'comply-with-final-rulings',   'agree'),

-- Election sub-trees
('e-sub-losses',     'reciprocal-insurance',   'everyone-eventually-loses',      'agree'),
('e-sub-sixty',      'dispute-channel-exists', 'sixty-challenges-rejected',      'agree'),
('e-sub-ownjudges',  'dispute-channel-exists', 'own-judges-rejected',            'agree'),
('e-sub-violent',    'one-way-ratchet',        'contested-successions-violent',  'agree'),
('e-sub-hayes',      'stolen-elections-exist', 'hayes-tilden-bargain',           'agree'),
('e-sub-machine',    'stolen-elections-exist', 'machine-era-fraud',              'agree'),
('e-sub-crossparty', 'partisan-referees',      'cross-party-rulings',            'disagree'),

-- Court compliance tree
('c-pro-bind',       'comply-with-final-rulings', 'orders-bind-or-decorative',    'agree'),
('c-pro-appeal',     'comply-with-final-rulings', 'appeal-channel-remedies',      'agree'),
('c-pro-ratchet',    'comply-with-final-rulings', 'defiance-ratchet',             'agree'),
('c-pro-forum',      'comply-with-final-rulings', 'preserve-the-forum',           'agree'),
('c-con-department', 'comply-with-final-rulings', 'departmentalism',              'disagree'),
('c-con-lawless',    'comply-with-final-rulings', 'lawless-rulings',              'disagree'),
('c-con-slow',       'comply-with-final-rulings', 'slow-appeals-harm',            'disagree'),
('c-con-laundered',  'comply-with-final-rulings', 'partisan-rulings-laundered',   'disagree'),

-- Court sub-trees
('c-sub-steel',      'orders-bind-or-decorative', 'youngstown-steel',       'agree'),
('c-sub-cooper',     'orders-bind-or-decorative', 'cooper-v-aaron',         'agree'),
('c-sub-nixon',      'preserve-the-forum',        'nixon-tapes-compliance', 'agree'),
('c-sub-worcester',  'departmentalism',           'worcester-unenforced',   'agree'),
('c-sub-merryman',   'lawless-rulings',           'merryman-defiance',      'agree');

-- ─── Seed: linkage + importance sub-debates ──────────────────────────────

INSERT OR IGNORE INTO fi_linkage_entries (entry_id, argument_id, side, statement) VALUES
('l1', 'e-pro-sensor',     'agree',    'If elections are the consent sensor, then refusing their output blinds the loop, which is exactly what non-acceptance does.'),
('l2', 'e-pro-sensor',     'agree',    'The metaphor cashes out: certified outcomes are the sensor reading.'),
('l3', 'e-pro-sensor',     'agree',    'Control-loop framing maps one-to-one onto the acceptance question.'),
('l4', 'e-pro-sensor',     'disagree', 'The sensor argument supports honest counting, not acceptance of any certified result.'),
('l5', 'e-con-asymmetric', 'agree',    'If the norm binds only one side, it stops functioning as the mutual insurance the pro case describes.'),
('l6', 'e-con-asymmetric', 'agree',    'Asymmetric compliance is a direct attack on the reciprocity premise.'),
('l7', 'e-con-asymmetric', 'disagree', 'Asymmetry, if real, argues for enforcing the norm on both sides, not abandoning it.'),
('l8', 'e-con-referees',   'agree',    'If the referees are players, the adjudication premise of acceptance weakens directly.'),
('l9', 'e-con-referees',   'disagree', 'Partisan administration is an argument about election mechanics, not about the bindingness of adjudicated outcomes.'),
('l10','c-sub-worcester',  'agree',    'An unenforced ruling with no consequence is direct evidence that supremacy rests on politics, not text.'),
('l11','c-sub-worcester',  'disagree', 'One antebellum episode says little about the post-Cooper legal order.');

INSERT OR IGNORE INTO fi_importance_entries (entry_id, argument_id, side, statement) VALUES
('i1', 'e-pro-insurance', 'agree',    'Reciprocity is the load-bearing mechanism: if this argument holds, it explains why the norm exists at all.'),
('i2', 'e-pro-insurance', 'agree',    'Every other pro argument leans on the equilibrium this one states.'),
('i3', 'e-con-stolen',    'agree',    'If true, it defeats the unconditional version of the belief outright.'),
('i4', 'e-con-stolen',    'disagree', 'The belief as stated covers certified-and-adjudicated results, so historical fraud settled outside adjudication moves it less than it seems.'),
('i5', 'c-pro-bind',      'agree',    'Everything else on the page assumes review has force; this argument is that assumption.'),
('i6', 'c-con-slow',      'disagree', 'Stays and expedited review already price this in for most cases.'),
('i7', 'c-con-slow',      'agree',    'Irreversible harms are the hard cases the belief must survive.');

-- ─── Seed: evidence ledger ───────────────────────────────────────────────

INSERT OR IGNORE INTO fi_evidence (evidence_id, belief_id, side, description, producer, tier, bears_on) VALUES
('ev1', 'accept-certified-results', 'supporting', 'More than sixty post-2020 election challenges adjudicated and rejected for lack of proof, including by judges the challenging side appointed', 'court records, 2020-2021', 1, 'e-pro-channel'),
('ev2', 'accept-certified-results', 'supporting', 'The 1800 Adams-to-Jefferson transfer, Nixon''s decision not to contest 1960, and Gore''s 2000 concession after a 5-4 ruling against him', 'historical record', 2, 'e-pro-insurance'),
('ev3', 'accept-certified-results', 'supporting', 'Comparative cases where losers stopped conceding show contested successions turning violent or extra-constitutional', 'comparative politics literature', 2, 'e-pro-ratchet'),
('ev4', 'accept-certified-results', 'supporting', 'Surveys of election officials reporting threats, harassment, and early exits', 'Brennan Center, 2020s', 3, NULL),
('ev5', 'accept-certified-results', 'weakening', 'The disputed 1876 Hayes-Tilden election was settled by a partisan commission and a political bargain, not clean adjudication', 'historical record', 2, 'e-con-stolen'),
('ev6', 'accept-certified-results', 'weakening', 'Documented machine-era ballot fraud in American cities', 'Campbell, Deliver the Vote, 2005', 2, 'e-con-stolen'),
('ev7', 'accept-certified-results', 'weakening', 'Rising shares of each party''s losers describing recent elections as illegitimate across consecutive cycles', 'Pew Research Center surveys, 2020s', 3, 'e-pro-insurance'),
('ev8', 'accept-certified-results', 'weakening', 'Documented cases of county officials refusing or delaying certification of results their side lost', 'court and news records, 2020s', 3, 'e-con-referees'),

('cv1', 'comply-with-final-rulings', 'supporting', 'Nixon complied with the unanimous tapes ruling in United States v. Nixon (1974) and resigned sixteen days later: compliance at maximum personal cost', 'court and historical record', 1, 'c-pro-forum'),
('cv2', 'comply-with-final-rulings', 'supporting', 'Truman returned the steel mills within hours of Youngstown (1952); Cooper v. Aaron (1958) unanimously held states bound by federal court interpretation', 'court records', 1, 'c-pro-bind'),
('cv3', 'comply-with-final-rulings', 'supporting', 'Bush v. Gore (2000): the losing side complied, conceded, and the transfer completed on schedule', 'historical record', 2, 'c-pro-ratchet'),
('cv4', 'comply-with-final-rulings', 'weakening', 'Georgia''s defiance of Worcester v. Georgia (1832) went unenforced, and the republic carried on: defiance without institutional consequence', 'historical record', 2, 'c-con-department'),
('cv5', 'comply-with-final-rulings', 'weakening', 'Lincoln''s administration declined to obey Taney''s habeas ruling in Ex parte Merryman (1861)', 'historical record', 2, 'c-con-lawless'),
('cv6', 'comply-with-final-rulings', 'weakening', 'Political-science work finding high-profile constitutional rulings increasingly align with the appointing party', 'empirical judicial-politics literature', 2, 'c-con-laundered');

-- ─── Seed: the topic and its addresses ───────────────────────────────────

INSERT OR IGNORE INTO fi_topics (topic_id, title, definition, scope) VALUES
('protecting-the-constitution', 'Protecting the Constitution',
 'The practices and commitments that keep the Constitution''s error-correcting mechanisms operating: compliance with final court rulings, acceptance of certified election outcomes, equal application of law to officials of every party, protected dissent, and change pursued through the channels the document itself provides.',
 'Beliefs about whether and how the constitutional order deserves protection. Interpretation methods, specific amendment proposals, and election administration mechanics are related topics with their own pages.');

INSERT OR IGNORE INTO fi_topic_beliefs (topic_id, belief_id, direction, magnitude, rung_type, branch_name) VALUES
('protecting-the-constitution', 'constitution-worldview-pro',  100, 'Strong',   'general', NULL),
('protecting-the-constitution', 'constitution-worldview-anti', -100, 'Strong',  'general', NULL),

('protecting-the-constitution', 'election-binds-both',      75, 'Strong',   'subcategory', 'Election acceptance'),
('protecting-the-constitution', 'binds-only-if-fair',      -75, 'Strong',   'subcategory', 'Election acceptance'),
('protecting-the-constitution', 'accept-certified-results', 75, 'Strong',   'specific',    'Election acceptance'),
('protecting-the-constitution', 'ministerial-duty',         60, 'Moderate', 'specific',    'Election acceptance'),
('protecting-the-constitution', 'certifier-discretion',    -60, 'Moderate', 'specific',    'Election acceptance'),
('protecting-the-constitution', 'pre-commitment-pledges',   50, 'Moderate', 'specific',    'Election acceptance'),
('protecting-the-constitution', 'keep-options-open',       -50, 'Moderate', 'specific',    'Election acceptance'),

('protecting-the-constitution', 'rulings-bind-officials',    75, 'Strong',   'subcategory', 'Court compliance and judicial independence'),
('protecting-the-constitution', 'branches-may-defy',        -75, 'Strong',   'subcategory', 'Court compliance and judicial independence'),
('protecting-the-constitution', 'comply-with-final-rulings', 70, 'Strong',   'specific',    'Court compliance and judicial independence'),

('protecting-the-constitution', 'oversight-any-party',       60, 'Moderate', 'subcategory', 'Oversight and emergency powers'),
('protecting-the-constitution', 'oversight-is-harassment',  -60, 'Moderate', 'subcategory', 'Oversight and emergency powers'),
('protecting-the-constitution', 'amendment-channel',         65, 'Moderate', 'subcategory', 'The amendment channel'),
('protecting-the-constitution', 'article-v-frozen',         -65, 'Moderate', 'subcategory', 'The amendment channel'),
('protecting-the-constitution', 'speech-protects-critics',   70, 'Strong',   'subcategory', 'Speech and dissent protection'),
('protecting-the-constitution', 'dangerous-speech-forfeits',-70, 'Strong',   'subcategory', 'Speech and dissent protection'),
('protecting-the-constitution', 'equal-application',         80, 'Strong',   'subcategory', 'Equal application of the law'),
('protecting-the-constitution', 'law-serves-leadership',    -80, 'Strong',   'subcategory', 'Equal application of the law');

-- ─── Seed: one imported conversation, every candidate outcome ────────────

INSERT OR IGNORE INTO fi_threads (thread_id, platform, title, source_url, belief_id) VALUES
('th-election', 'reddit', 'Do you actually have to accept election results if you think it was rigged?',
 'https://reddit.example/r/politics/comments/demo', 'accept-certified-results');

INSERT OR IGNORE INTO fi_messages (message_id, thread_id, idx, author, body) VALUES
('m0', 'th-election', 0, 'u/ballot_curious', 'Serious question: do you actually have to accept election results if you think it was rigged?'),
('m1', 'th-election', 1, 'u/norms_matter', 'Yes, because the acceptance norm only works if it binds both sides. The side with more institutional scruple keeps conceding while the other side pockets the wins, and then the whole equilibrium is gone.'),
('m2', 'th-election', 2, 'u/audit_hawk', 'The real problem nobody talks about: certification deadlines are so tight that meaningful audits are impossible before results become official. https://example.org/audit-timelines'),
('m3', 'th-election', 3, 'u/history_nerd', 'Elections have literally been stolen before, look at 1876. The Hayes-Tilden mess was settled by a backroom bargain, not by courts.'),
('m4', 'th-election', 4, 'u/norms_matter', 'Courts threw out more than sixty challenges after 2020 for lack of proof. The dispute channel exists and it was used.'),
('m5', 'th-election', 5, 'u/vibes_only', 'lol this thread again'),
('m6', 'th-election', 6, 'u/cynic_prime', 'Everyone knows politicians lie about everything anyway.');

-- Candidate outcomes: one integrated (it created the asymmetric-scruple
-- argument), one folded duplicate, one pending distinct, one pending
-- related-link, one dismissed at review.
INSERT OR IGNORE INTO fi_candidates
  (candidate_id, thread_id, message_id, statement, direction, context_quote,
   nearest_argument_id, similarity, band, status, integrated_argument_id, resolved_at) VALUES
('cand-asymmetric', 'th-election', 'm1',
 'The side with more institutional scruple keeps conceding while the other side pockets the wins.',
 'con', 'Yes, because the acceptance norm only works if it binds both sides…',
 NULL, NULL, 'distinct', 'integrated', 'e-con-asymmetric', '2026-08-20 17:04:00'),
('cand-deadlines', 'th-election', 'm2',
 'Certification deadlines are so tight that meaningful audits are impossible before results become official.',
 'con', 'The real problem nobody talks about: certification deadlines are so tight…',
 NULL, NULL, 'distinct', 'pending', NULL, NULL),
('cand-hayes', 'th-election', 'm3',
 'The Hayes-Tilden dispute was settled by a backroom bargain, not by courts.',
 'con', 'Elections have literally been stolen before, look at 1876…',
 'e-con-stolen', 0.82, 'probable-group', 'duplicate', NULL, '2026-08-20 17:05:00'),
('cand-sixty', 'th-election', 'm4',
 'Courts threw out more than sixty challenges after 2020 for lack of proof.',
 'pro', 'Courts threw out more than sixty challenges after 2020 for lack of proof…',
 'e-pro-channel', 0.61, 'related-link', 'pending', NULL, NULL),
('cand-liars', 'th-election', 'm6',
 'Everyone knows politicians lie about everything anyway.',
 'con', 'Everyone knows politicians lie about everything anyway.',
 NULL, NULL, 'distinct', 'dismissed', NULL, '2026-08-20 17:06:00');

INSERT OR IGNORE INTO fi_audit_log (action, target_type, target_id, rationale) VALUES
('import_conversation', 'Thread', 'th-election',
 'Imported 7-message reddit conversation plugged into belief "accept-certified-results".'),
('integrate_candidate', 'Candidate', 'cand-asymmetric',
 'Distinct con point not yet on the page; integrated as argument e-con-asymmetric with a completed linkage sub-debate.'),
('fold_candidate', 'Candidate', 'cand-hayes',
 'Restates existing argument e-con-stolen (similarity 0.82, probable-group). The point is already on the page; folding prevents double-counting.'),
('dismiss_candidate', 'Candidate', 'cand-liars',
 'Universal cynicism with no bearing on the parent claim: not a usable standalone argument.');
