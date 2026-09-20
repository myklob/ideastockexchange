"""Export the workbook's content in database-ready form: schema.sql, data.sql, JSON and XML.

The shape is the one score_reference.normalize() produces, so the same two tables feed the SQL, the JSON, the XML
and the reference scorer. A web front end (PHP, Node, anything) that reads `page` and `edge` and runs the rules in
score_reference.py reproduces every number in the workbook.

Tables
  constant   name, value, meaning                          the five labelled constants (k, UNARG, DEFLINK, DEFIMP, DEFUNIQ)
             A page's starting point is computed from its etype/erq/erp, not stored: see evidence.py.
  page       id, kind, text, topic, parent_id, x_id, y_id, type, direction, rowkind, value, measured_by, where_found,
             etype, erq, erp, if_true, if_false, latest, bridge, bottom_line, positivity, logical_form
             kind: belief | claim | linkage | importance | interest | uniqueness | equivalence | driver | media
             text is NULL for the formula-built kinds: their question is rendered from x_id / y_id and the row-2 field.
  edge       id, page_id, section, side, position, claim_id, text, link_id, imp_id, uniq_id, drives_id, equiv_id,
             who_id, bearing_id, pattern, category, magnitude, deadline, attrs (JSON)
             One row per row of every table on a page. claim_id is the row's own page (its Truth); text is used only
             when the row has no page yet. The *_id columns are the multipliers: each is a page whose truth score is
             read, or NULL for the labelled constant. section values: argument, evidence, prediction, cba, short_term,
             long_term, component, assumption, interest, shared_interest, compromise, motive, obstacle, bias, media,
             law, upstream, downstream, similar, person, value, definition, used, dispute, category, impact,
             interest_listing, related.
  Scores are never stored: they are computed from these tables (score_reference.Model), so nothing typed is a score.
"""
import json, sys, os, sqlite3, re
from xml.sax.saxutils import escape
from score_reference import normalize, CONSTS as DEFAULT_CONSTS
import evidence as EV

def _write(path, text):
    with open(path, 'w', encoding='utf-8') as fh: fh.write(text)

PAGE_COLS = ['id', 'kind', 'text', 'topic', 'parent_id', 'x_id', 'y_id', 'type', 'direction', 'rowkind', 'value', 'measured_by', 'where_found',
             'etype', 'erq', 'erp', 'if_true', 'if_false', 'latest', 'bridge', 'bottom_line', 'positivity', 'logical_form']
EDGE_COLS = ['id', 'page_id', 'section', 'side', 'position', 'claim_id', 'text', 'link_id', 'imp_id', 'uniq_id', 'drives_id', 'equiv_id',
             'who_id', 'bearing_id', 'pattern', 'category', 'magnitude', 'mag_low', 'mag_high', 'deadline', 'attrs']

SCHEMA = '''-- Idea Stock Exchange belief pages: schema (PostgreSQL; MySQL 8 needs JSON instead of JSONB and no "IF NOT EXISTS" on indexes).
-- Nothing typed is a score. Scores are computed from page + edge by the rules in score_reference.py.

CREATE TABLE IF NOT EXISTS constant (
  name     VARCHAR(16) PRIMARY KEY,   -- K, UNARG, DEFLINK, DEFIMP, DEFUNIQ
  value    NUMERIC(6,3) NOT NULL,
  meaning  TEXT NOT NULL
);

-- The evidence tiers, as data rather than as a constant buried in code, so a front end in any language reads
-- the same weights the scorer uses. wiki_rank is the row's place in the wiki's own table; NULL marks the one
-- category added beyond it (see evidence.py).
CREATE TABLE IF NOT EXISTS evidence_tier (
  etype      VARCHAR(16) PRIMARY KEY,
  weight     NUMERIC(4,2) NOT NULL,
  wiki_rank  INTEGER,
  meaning    TEXT NOT NULL
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
  etype        VARCHAR(16),           -- what this claim rests on, if it is an observed finding: see evidence.py's table.
                                      -- NULL means nothing observed, and the claim starts at 0.5 and contributes nothing until argued.
  erq          INTEGER,               -- independent replications of the finding. NULL counts as one, the finding itself.
  erp          NUMERIC(5,2),          -- percent of those replications that agreed. NULL counts as 100.
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
  section     VARCHAR(20) NOT NULL,                   -- which table on the page (see export_db.py docstring)
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
  magnitude   NUMERIC(14,4),                          -- cba rows: typed central estimate in those units (the one typed number; likelihood is claim_id's truth)
  mag_low     NUMERIC(14,4),                          -- cba rows: low end of that estimate. NULL means no range was stated, which is a deficiency, not a zero.
  mag_high    NUMERIC(14,4),                          -- cba rows: high end of that estimate
  deadline    TEXT,                                   -- prediction rows: deadline and method
  attrs       JSONB,                                  -- section-specific extras: component type/stated/lb/assumes, motive actual, compromise premise/difficult, value ranks, definition term, media type, dispute what/move, used side
  UNIQUE (page_id, section, side, position)
);
CREATE INDEX IF NOT EXISTS edge_claim ON edge(claim_id);
CREATE INDEX IF NOT EXISTS edge_page_section ON edge(page_id, section);

-- Where a page is used: every edge whose claim_id is the page. (The workbook's "Where This Belief Is Used" table.)
-- A page is used wherever any column reads it, not only as a row's claim: a linkage page is read as a
-- multiplier and never appears in claim_id, so a view that looked only there would call it an orphan.
CREATE VIEW page_uses AS
      SELECT claim_id   AS page_id, page_id AS used_on, section, side, 'claim'      AS role FROM edge WHERE claim_id   IS NOT NULL
  UNION ALL SELECT link_id,    page_id, section, side, 'linkage'    FROM edge WHERE link_id    IS NOT NULL
  UNION ALL SELECT imp_id,     page_id, section, side, 'importance' FROM edge WHERE imp_id     IS NOT NULL
  UNION ALL SELECT uniq_id,    page_id, section, side, 'uniqueness' FROM edge WHERE uniq_id    IS NOT NULL
  UNION ALL SELECT drives_id,  page_id, section, side, 'driver'     FROM edge WHERE drives_id  IS NOT NULL
  UNION ALL SELECT equiv_id,   page_id, section, side, 'equivalence' FROM edge WHERE equiv_id  IS NOT NULL
  UNION ALL SELECT who_id,     page_id, section, side, 'who pays'   FROM edge WHERE who_id     IS NOT NULL
  UNION ALL SELECT bearing_id, page_id, section, side, 'bearing'    FROM edge WHERE bearing_id IS NOT NULL;

-- ---------------------------------------------------------------------------------------------------------
-- What SQL is good at here. The recursive part of the score belongs in code: truth is a non-linear function of
-- the children (a ratio, then a minimum), which a recursive CTE cannot aggregate its way to. Everything below
-- needs no recursion, and these are the questions an analyst actually opens the database to ask.

-- Where each page's truth starts, before any of its own rows count. This one IS the rule, in SQL, and it is
-- here to show the rule is small enough to reimplement anywhere: p0 = 0.5 + 0.5 x ESIW x (2 x ERP/100 - 1),
-- w = k x 2 x ERQ / (ERQ + 1).
CREATE VIEW page_start AS
  SELECT p.id,
         p.kind,
         p.etype,
         COALESCE(t.weight, 0)                                                        AS esiw,
         COALESCE(p.erq, 1)                                                           AS erq,
         COALESCE(p.erp, 100)                                                         AS erp,
         0.5 + 0.5 * COALESCE(t.weight, 0) * (2.0 * COALESCE(p.erp, 100) / 100.0 - 1) AS p0,
         (SELECT value FROM constant WHERE name = 'K')
           * 2.0 * COALESCE(p.erq, 1) / (COALESCE(p.erq, 1) + 1)                      AS weight
  FROM page p LEFT JOIN evidence_tier t ON t.etype = p.etype;

-- How much of the template each page has actually had filled in, and how much of it still rests on a presumed
-- multiplier rather than an argued one.
CREATE VIEW page_coverage AS
  SELECT p.id, p.kind, p.text,
         SUM(CASE WHEN e.section = 'argument'   AND e.side = 'agree'    THEN 1 ELSE 0 END) AS reasons_for,
         SUM(CASE WHEN e.section = 'argument'   AND e.side = 'disagree' THEN 1 ELSE 0 END) AS reasons_against,
         SUM(CASE WHEN e.section = 'evidence'                           THEN 1 ELSE 0 END) AS findings,
         SUM(CASE WHEN e.section = 'prediction'                         THEN 1 ELSE 0 END) AS predictions,
         SUM(CASE WHEN e.section IN ('argument','evidence','prediction') AND e.link_id IS NULL THEN 1 ELSE 0 END) AS rows_without_linkage,
         SUM(CASE WHEN e.section IN ('argument','evidence','prediction') AND e.imp_id  IS NULL THEN 1 ELSE 0 END) AS rows_without_importance,
         SUM(CASE WHEN e.section IN ('argument','evidence','prediction') AND e.uniq_id IS NULL THEN 1 ELSE 0 END) AS rows_without_uniqueness
  FROM page p LEFT JOIN edge e ON e.page_id = p.id
  GROUP BY p.id, p.kind, p.text;

-- Argued on one side only: the template's own definition of an incomplete page.
CREATE VIEW page_one_sided AS
  SELECT * FROM page_coverage
  WHERE kind IN ('belief','claim','linkage','interest','uniqueness','equivalence','driver','media')
    AND (reasons_for = 0) <> (reasons_against = 0);

-- Claims that can never move anything: nothing argued beneath them and nothing cited for them, so their truth
-- is 0.50 and every row that reads them contributes exactly zero. This is the work queue in its rawest form.
CREATE VIEW page_inert AS
  SELECT p.id, p.text
  FROM page p
  WHERE p.etype IS NULL
    AND NOT EXISTS (SELECT 1 FROM edge e WHERE e.page_id = p.id
                    AND e.section IN ('argument','evidence','prediction','interest_listing'));

-- Every cited finding in the corpus with what it rests on, ranked by how far its source moves it off the flip.
CREATE VIEW evidence_ledger AS
  SELECT p.id, p.text, s.etype, t.meaning, t.wiki_rank, s.erq, s.erp, s.p0,
         (SELECT COUNT(*) FROM edge e WHERE e.claim_id = p.id AND e.section = 'evidence') AS cited_on
  FROM page p JOIN page_start s ON s.id = p.id
              LEFT JOIN evidence_tier t ON t.etype = p.etype
  WHERE p.etype IS NOT NULL;

-- Pages nothing reads: written and then orphaned.
CREATE VIEW page_orphan AS
  SELECT p.id, p.kind, p.text FROM page p
  WHERE p.kind <> 'belief' AND NOT EXISTS (SELECT 1 FROM page_uses u WHERE u.page_id = p.id);
'''

def sqlval(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return '1' if v else '0'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, (dict, list)): return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'"
    return "'" + str(v).replace("'", "''") + "'"

# Postgres is the schema of record; SQLite needs three substitutions and nothing else. Keeping one schema and
# naming the differences here beats keeping two that drift.
SQLITE_SUBS = [(r'\bJSONB\b', 'TEXT'), (r'NUMERIC\(\d+,\s*\d+\)', 'REAL'), (r'\bCREATE OR REPLACE VIEW\b', 'CREATE VIEW')]


def sqlite_schema(schema=None):
    out = schema or SCHEMA
    for pat, rep in SQLITE_SUBS: out = re.sub(pat, rep, out)
    return out


def build_sqlite(path, data_sql, schema=None):
    """A loaded database beside the .sql files, so the two tables can be queried without setting anything up:
    sqlite3 ise.sqlite 'select * from page_inert'."""
    if os.path.exists(path): os.remove(path)
    con = sqlite3.connect(path)
    try:
        con.executescript(sqlite_schema(schema))
        con.executescript(data_sql)
        con.commit()
        n = con.execute('SELECT (SELECT COUNT(*) FROM page), (SELECT COUNT(*) FROM edge)').fetchone()
    finally:
        con.close()
    return n


def export(specs, consts, outdir, stem='ise_zoning', const_meanings=None, beliefs=None):
    pages, edges = normalize(specs, beliefs)
    constants = [{'name': k, 'value': v, 'meaning': (const_meanings or {}).get(k, '')} for k, v in consts.items()]
    os.makedirs(outdir, exist_ok=True)
    data = {'constants': constants, 'pages': pages, 'edges': edges}
    _write(os.path.join(outdir, stem + '.json'), json.dumps(data, indent=1, ensure_ascii=False))
    # XML
    def el(tag, d, cols):
        attrs = ''.join(f' {c}="{escape(str(d[c]), {chr(34): "&quot;"})}"' for c in cols if c in d and not isinstance(d[c], (dict, list)) and d[c] is not None)
        inner = ''.join(f'<{k}>{escape(json.dumps(v, ensure_ascii=False))}</{k}>' for k, v in d.items() if isinstance(v, (dict, list)))
        return f'  <{tag}{attrs}>{inner}</{tag}>' if inner else f'  <{tag}{attrs}/>'
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<ise>', ' <constants>'] + [el('constant', c, ['name', 'value', 'meaning']) for c in constants] + [' </constants>', ' <pages>'] \
        + [el('page', p, PAGE_COLS) for p in pages] + [' </pages>', ' <edges>'] + [el('edge', e, EDGE_COLS) for e in edges] + [' </edges>', '</ise>']
    _write(os.path.join(outdir, stem + '.xml'), '\n'.join(xml))
    # SQL
    _write(os.path.join(outdir, 'schema.sql'), SCHEMA)
    lines = ['-- Idea Stock Exchange belief pages as data. Load schema.sql first. Scores are computed, not stored.', 'BEGIN;']
    for c in constants: lines.append(f"INSERT INTO constant (name, value, meaning) VALUES ({sqlval(c['name'])}, {sqlval(c['value'])}, {sqlval(c['meaning'])});")
    for key, (w, rank, meaning) in sorted(EV.ESIW.items(), key=lambda kv: (-kv[1][0], kv[0])):
        lines.append(f"INSERT INTO evidence_tier (etype, weight, wiki_rank, meaning) VALUES ({sqlval(key)}, {sqlval(w)}, {sqlval(rank)}, {sqlval(meaning)});")
    for p in pages:
        cols = [c for c in PAGE_COLS if p.get(c) is not None]
        lines.append(f"INSERT INTO page ({', '.join(cols)}) VALUES ({', '.join(sqlval(p[c]) for c in cols)});")
    for e in edges:
        cols = [c for c in EDGE_COLS if e.get(c) is not None]
        lines.append(f"INSERT INTO edge ({', '.join(cols)}) VALUES ({', '.join(sqlval(e[c]) for c in cols)});")
    lines.append('COMMIT;')
    data_sql = '\n'.join(lines) + '\n'
    _write(os.path.join(outdir, stem + '_data.sql'), data_sql)
    build_sqlite(os.path.join(outdir, stem + '.sqlite'), data_sql)
    return pages, edges

if __name__ == '__main__':
    # python3 export_db.py [entry.xlsx] [outdir] [stem]   (without an .xlsx it falls back to example_gov.py, the Python corpus)
    HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
    from build_pages import CONSTS
    xlsx = next((a for a in sys.argv[1:] if a.endswith('.xlsx')), None); rest = [a for a in sys.argv[1:] if a != xlsx]
    if xlsx:
        from ise_tables import read_source, tables_to_specs
        specs, beliefs = tables_to_specs(*read_source(xlsx))
    else:
        import example_gov as ez
        specs, beliefs = ez.PAGES, getattr(ez, 'BELIEFS', None)
    pages, edges = export(specs, {k: v for k, _, v, _ in CONSTS}, rest[0] if rest else os.path.join(HERE, 'db'), stem=(rest[1] if len(rest) > 1 else 'ise_gov_ethics'), const_meanings={k: m for k, _, _, m in CONSTS}, beliefs=beliefs)
    print('pages', len(pages), 'edges', len(edges))
