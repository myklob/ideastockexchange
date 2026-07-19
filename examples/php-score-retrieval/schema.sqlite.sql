-- SQLite twin of sql/conclusion_score_process.sql — same tables, same
-- seed data, same math. setup.php runs this file to create demo.sqlite.
-- Differences from the MySQL file are dialect-only: TEXT + CHECK
-- instead of ENUM, instr() instead of FIND_IN_SET.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cs_conclusions (
  conclusion_id  TEXT PRIMARY KEY,
  statement      TEXT NOT NULL,
  example_set    TEXT,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cs_reasons (
  reason_id      TEXT PRIMARY KEY,
  conclusion_id  TEXT NOT NULL REFERENCES cs_conclusions(conclusion_id),
  child_id       TEXT NOT NULL REFERENCES cs_conclusions(conclusion_id),
  side           TEXT NOT NULL CHECK (side IN ('agree', 'disagree')),
  position       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (conclusion_id, child_id, side)
);

CREATE INDEX IF NOT EXISTS idx_cs_reason_parent ON cs_reasons(conclusion_id);
CREATE INDEX IF NOT EXISTS idx_cs_reason_child  ON cs_reasons(child_id);

CREATE TABLE IF NOT EXISTS cs_linkage_entries (
  entry_id       TEXT PRIMARY KEY,
  reason_id      TEXT NOT NULL REFERENCES cs_reasons(reason_id),
  side           TEXT NOT NULL CHECK (side IN ('agree', 'disagree')),
  statement      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cs_entry_reason ON cs_linkage_entries(reason_id, side);

CREATE TABLE IF NOT EXISTS cs_settings (
  setting_key    TEXT PRIMARY KEY,
  value          REAL NOT NULL
);

INSERT OR IGNORE INTO cs_settings (setting_key, value)
VALUES ('sub_argument_multiplier', 0.7);


-- Per-edge linkage score: (agree − disagree) / (agree + disagree),
-- 1.0 when the linkage is undebated.
CREATE VIEW IF NOT EXISTS v_cs_edge_linkage AS
SELECT
  r.reason_id,
  r.conclusion_id,
  r.child_id,
  r.side,
  r.position,
  COALESCE(SUM(e.side = 'agree'), 0)    AS linkage_agree,
  COALESCE(SUM(e.side = 'disagree'), 0) AS linkage_disagree,
  CASE
    WHEN COUNT(e.entry_id) = 0 THEN 1.0
    ELSE (SUM(e.side = 'agree') - SUM(e.side = 'disagree')) * 1.0
         / COUNT(e.entry_id)
  END AS linkage_score
FROM cs_reasons r
LEFT JOIN cs_linkage_entries e ON e.reason_id = r.reason_id
GROUP BY r.reason_id, r.conclusion_id, r.child_id, r.side, r.position;


-- The recursive score with the multiplier taken from cs_settings.
-- scoring.php runs the same CTE with a bound :multiplier instead, so
-- the demo pages can show different multipliers side by side.
CREATE VIEW IF NOT EXISTS v_cs_conclusion_scores AS
WITH RECURSIVE score_paths AS (
  SELECT
    el.conclusion_id                                   AS root_id,
    el.child_id                                        AS node_id,
    el.conclusion_id || ',' || el.child_id             AS path,
    CASE el.side WHEN 'agree' THEN 1.0 ELSE -1.0 END   AS weight,
    el.linkage_score                                   AS last_linkage
  FROM v_cs_edge_linkage el

  UNION ALL

  SELECT
    p.root_id,
    el.child_id,
    p.path || ',' || el.child_id,
    p.weight
      * (SELECT value FROM cs_settings WHERE setting_key = 'sub_argument_multiplier')
      * p.last_linkage
      * CASE el.side WHEN 'agree' THEN 1.0 ELSE -1.0 END,
    el.linkage_score
  FROM score_paths p
  JOIN v_cs_edge_linkage el ON el.conclusion_id = p.node_id
  WHERE instr(',' || p.path || ',', ',' || el.child_id || ',') = 0
)
SELECT
  c.conclusion_id,
  c.statement,
  c.example_set,
  COALESCE(SUM(p.weight), 0) AS conclusion_score
FROM cs_conclusions c
LEFT JOIN score_paths p ON p.root_id = c.conclusion_id
GROUP BY c.conclusion_id, c.statement, c.example_set;


-- Seed: the belief-46 subtree from the founding workbook plus the
-- synthetic street-trees set. See sql/conclusion_score_process.sql for
-- the expected scores.

INSERT OR REPLACE INTO cs_conclusions (conclusion_id, statement, example_set) VALUES
  ('46',  'Mormons should not be afraid of investigating the truth about their religion.', 'church'),
  ('47',  'Many LDS church leaders have encouraged complete loyalty to the truth.', 'church'),
  ('48',  'LDS doctrine teaches that you cannot be saved in ignorance.', 'church'),
  ('296', 'If you cannot be saved in ignorance, you will eventually learn about all the Church''s warts.', 'church'),
  ('297', 'Even if the Mormon Church is true, its leaders should not use half truths to keep people in it.', 'church'),
  ('45',  'President J. Reuben Clark was right: if we have the truth, it cannot be harmed by investigation.', 'church'),
  ('30',  'God is truth and knowledge; hiding truth to keep people in a religion is the opposite of God.', 'church'),
  ('301', 'The narrative of Joseph Smith starting the Church is that he asked of God (James 1:5).', 'church'),
  ('302', 'D&C 131:6: It is impossible for a man to be saved in ignorance.', 'church'),
  ('303', 'D&C 137:7: All who have died without a knowledge of this gospel shall be heirs.', 'church'),
  ('304', 'What information you expose yourself to determines what you eventually learn.', 'church'),
  ('305', 'Telling half truths or hiding the whole truth serves an agenda other than truth.', 'church'),
  ('306', 'Truth is always helped by honest, logical, transparent investigation.', 'church'),
  ('307', 'Even if the Mormon Church is true, they shouldn''t lie to keep people in it.', 'church'),
  ('308', 'If God wants everyone to be Mormon, it is more important to tell faith-promoting stories.', 'church'),
  ('309', 'The 10 commandments tell us not to bear false witness.', 'church'),
  ('310', 'Mormons are told not to lie, or do anything like unto it.', 'church'),
  ('311', 'Jesus said people should be given milk before meat.', 'church'),
  ('t1', 'Our city should plant more street trees.', 'trees'),
  ('t2', 'Street trees measurably cool neighborhoods in summer.', 'trees'),
  ('t3', 'Street trees increase nearby property values.', 'trees'),
  ('t4', 'Tree roots damage sidewalks and raise repair costs.', 'trees'),
  ('t5', 'Shaded pavement stays 10-15 degrees cooler in heat waves.', 'trees'),
  ('t6', 'Tree canopy lowers home cooling bills.', 'trees'),
  ('t7', 'Studies show a price premium for tree-lined streets.', 'trees'),
  ('t8', 'The premium disappears after controlling for neighborhood wealth.', 'trees'),
  ('t9', 'Root barriers and proper species choice prevent most damage.', 'trees');

INSERT OR REPLACE INTO cs_reasons (reason_id, conclusion_id, child_id, side, position) VALUES
  ('e46-47',  '46',  '47',  'agree', 1),
  ('e46-48',  '46',  '48',  'agree', 2),
  ('e46-296', '46',  '296', 'agree', 3),
  ('e46-297', '46',  '297', 'agree', 4),
  ('e47-45',  '47',  '45',  'agree', 1),
  ('e47-301', '47',  '301', 'agree', 2),
  ('e48-302', '48',  '302', 'agree', 1),
  ('e48-303', '48',  '303', 'agree', 2),
  ('e296-304','296', '304', 'agree', 1),
  ('e297-305','297', '305', 'agree', 1),
  ('e45-30',  '45',  '30',  'agree', 1),
  ('e45-48',  '45',  '48',  'agree', 2),
  ('e45-306', '45',  '306', 'agree', 3),
  ('e45-307', '45',  '307', 'agree', 4),
  ('e45-308', '45',  '308', 'disagree', 1),
  ('e30-309', '30',  '309', 'agree', 1),
  ('e30-310', '30',  '310', 'agree', 2),
  ('e30-311', '30',  '311', 'disagree', 1),
  ('et1-t2',  't1',  't2',  'agree', 1),
  ('et1-t3',  't1',  't3',  'agree', 2),
  ('et1-t4',  't1',  't4',  'disagree', 1),
  ('et2-t5',  't2',  't5',  'agree', 1),
  ('et2-t6',  't2',  't6',  'agree', 2),
  ('et3-t7',  't3',  't7',  'agree', 1),
  ('et3-t8',  't3',  't8',  'disagree', 1),
  ('et4-t9',  't4',  't9',  'agree', 1);

INSERT OR REPLACE INTO cs_linkage_entries (entry_id, reason_id, side, statement) VALUES
  ('l1', 'et1-t2', 'agree',    'Cooling is a direct, well-measured benefit of street trees.'),
  ('l2', 'et1-t2', 'agree',    'Heat mitigation is a stated goal of the city plan.'),
  ('l3', 'et1-t2', 'agree',    'The effect size is large enough to matter for public health.'),
  ('l4', 'et1-t2', 'agree',    'The cooling studies were run in comparable climates.'),
  ('l5', 'et1-t3', 'agree',    'Property values reflect real neighborhood improvements.'),
  ('l6', 'et1-t3', 'agree',    'Higher values grow the tax base that funds the program.'),
  ('l7', 'et1-t3', 'agree',    'The premium persists across several study designs.'),
  ('l8', 'et1-t3', 'disagree', 'Property values are about homeowners, not the public interest.'),
  ('l9', 'et1-t4', 'agree',    'Sidewalk repair costs land on the same public-works budget.'),
  ('l10','et1-t4', 'agree',    'Root damage is the most common resident complaint.'),
  ('l11','et1-t4', 'agree',    'Repair liability is a real, recurring cost.'),
  ('l12','et1-t4', 'disagree', 'Species selection makes root damage largely avoidable.');
