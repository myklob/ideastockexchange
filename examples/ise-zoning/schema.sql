-- Idea Stock Exchange belief pages: schema (PostgreSQL; MySQL 8 needs JSON instead of JSONB and no "IF NOT EXISTS" on indexes).
-- Nothing typed is a score. Scores are computed from page + edge by the rules in score_reference.py
-- and, in the app, by src/lib/ise-pages/score.ts.

CREATE TABLE IF NOT EXISTS constant (
  name     VARCHAR(16) PRIMARY KEY,   -- K, UNARG, DEFLINK, DEFIMP, DEFUNIQ
  value    NUMERIC(6,3) NOT NULL,
  meaning  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS page (
  id           INTEGER PRIMARY KEY,   -- the workbook tab number; hidden on the web page, it is the link
  kind         VARCHAR(12) NOT NULL CHECK (kind IN ('belief','claim','linkage','importance','interest','uniqueness','equivalence','driver','media')),
  text         TEXT,                  -- the claim (belief, claim, interest, media); NULL for formula-built kinds
  topic        VARCHAR(80),
  parent_id    INTEGER REFERENCES page(id),   -- "Used on": the page this one is a row of (first use; the edge table has every use)
  x_id         INTEGER REFERENCES page(id),   -- linkage / importance / uniqueness / equivalence / driver: the row (X)
  y_id         INTEGER REFERENCES page(id),   -- the conclusion, belief, interest or other reason (Y or Z)
  type         VARCHAR(12),           -- linkage: Argument | Evidence | Prediction | Interest | Media;  media: Book | Study | Article | Report | Film | Podcast | Video | Other
  direction    VARCHAR(12),           -- linkage: Supports | Weakens;  driver: Support | Opposition
  rowkind      VARCHAR(40),           -- importance: reason to agree | reason to disagree | supporting finding | weakening finding | prediction if the belief is true | prediction if the belief is false | work
  value        VARCHAR(40),           -- interest: the value it appeals to (Opportunity, Security, ...)
  measured_by  TEXT,                  -- interest: what a reading of this interest looks like
  where_found  TEXT,                  -- media: citation or link
  if_true      TEXT,                  -- interest: what the measure should show if the belief is true
  if_false     TEXT,                  -- interest: ... if the belief is false
  latest       TEXT,                  -- interest: latest reading, with source
  bridge       TEXT,                  -- the one-sentence check-table answer (how X bears on Y, who is affected, ...)
  bottom_line  TEXT,                  -- the only typed line in a scorecard
  positivity   INTEGER,               -- belief: -100..+100 on the topic page's valence axis
  logical_form TEXT                   -- belief: the anatomy's logical form
);

-- The question of a formula-built page is rendered, never stored:
--   linkage   (Argument/Evidence): If it were true that: "{x.text}",  it would significantly {strengthen|weaken} the conclusion that: "{y.text}"
--   linkage   (Prediction):        If it were observed that: "{x.text}", ...
--   linkage   (Interest):          If it were true that: "{x.text}",  it would matter to the interest: "{y.text}"
--   linkage   (Media):             The work: "{x.text}"  {supports|weakens} the conclusion that: "{y.text}"
--   importance:                    This {rowkind}: "{x.text}"  addresses the most important interest at stake in the belief: "{y.text}"
--   uniqueness:                    The reason: "{x.text}"  makes a different point from: "{y.text}"
--   equivalence:                   The belief: "{x.text}"  makes the same claim as: "{y.text}"
--   driver:                        The interest: "{x.text}"  is what actually drives {support for|opposition to} the belief that: "{y.text}"

CREATE TABLE IF NOT EXISTS edge (
  id          INTEGER PRIMARY KEY,
  page_id     INTEGER NOT NULL REFERENCES page(id),   -- the page this row sits on
  section     VARCHAR(20) NOT NULL,                   -- which table on the page (argument, evidence, prediction, cba, component, interest, media, ...)
  side        VARCHAR(10),                            -- agree | disagree for two-sided tables; extreme | moderate; x | y; NULL for single lists
  position    INTEGER NOT NULL,                       -- entry order; display order is by computed score, never by position
  claim_id    INTEGER REFERENCES page(id),            -- the row's own page: its Truth (UNARG when NULL)
  text        TEXT,                                   -- typed text, only while the row has no page
  link_id     INTEGER REFERENCES page(id),            -- linkage page (DEFLINK when NULL)
  imp_id      INTEGER REFERENCES page(id),            -- importance page (DEFIMP when NULL)
  uniq_id     INTEGER REFERENCES page(id),            -- uniqueness page (DEFUNIQ when NULL)
  drives_id   INTEGER REFERENCES page(id),            -- interest rows: driver page (UNARG when NULL)
  equiv_id    INTEGER REFERENCES page(id),            -- similar rows: equivalence page
  who_id      INTEGER REFERENCES page(id),            -- cba rows: the interest that gains or pays
  bearing_id  INTEGER REFERENCES page(id),            -- interest_listing rows: bearing page (DEFLINK when NULL)
  pattern     VARCHAR(60),                            -- specialized pages: the shape of the reason (Mechanism, Missing step, ...)
  category    VARCHAR(120),                           -- cba rows: the units
  magnitude   NUMERIC(14,4),                          -- cba rows: typed estimate in those units (the one typed number; likelihood is claim_id's truth)
  deadline    TEXT,                                   -- prediction rows: deadline and method
  attrs       JSONB,                                  -- section-specific extras: component type/stated/lb/assumes, motive actual, compromise premise/difficult, value ranks, definition term, media type, dispute what/move, used side
  UNIQUE (page_id, section, side, position)
);
CREATE INDEX IF NOT EXISTS edge_claim ON edge(claim_id);
CREATE INDEX IF NOT EXISTS edge_page_section ON edge(page_id, section);

-- Where a page is used: every edge whose claim_id is the page. (The workbook's "Where This Belief Is Used" table.)
CREATE OR REPLACE VIEW page_uses AS
  SELECT e.claim_id AS page_id, e.page_id AS used_on, e.section, e.side FROM edge e WHERE e.claim_id IS NOT NULL;
