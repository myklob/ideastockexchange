-- =================================================================
-- ISE Conclusion Score: the original spreadsheet process in SQL
-- =================================================================
--
-- The founding Excel workbook gave every conclusion its own sheet with
-- reasons to agree and reasons to disagree in separate columns, and
-- computed on each sheet:
--
--   A1 score = (# reasons to agree − # reasons to disagree)
--            + m · ( Σ agree sub-scores · LS − Σ disagree sub-scores · LS )
--
--   LS (linkage score) = (agree − disagree) / (agree + disagree)
--     over the edge's linkage sub-debate ("if the reason were true,
--     would it actually support this conclusion?"); 1 when undebated.
--   m  = the sub-argument multiplier (the workbook's Index!O1 = 0.7;
--     its per-sheet formulas predate that cell and use m = 1).
--
-- Sub-scores are the same formula on the child's sheet, so the score
-- is recursive: Excel's dependency engine played the role this file
-- gives to a recursive CTE. This schema is the SQL twin of
-- src/lib/conclusion-score.ts; the runnable demo (SQLite + PHP) is
-- examples/php-score-retrieval/. The three implementations must
-- produce identical numbers on the shared example data.
--
-- Engine: MariaDB 10.4+ / MySQL 8.0+ (recursive CTEs).
-- SQLite parity: examples/php-score-retrieval/schema.sqlite.sql.
--
-- These tables are deliberately minimal — the workbook's data model,
-- not the full linkage-pages schema (sql/linkage_pages_schema.sql).
-- The `cs_` prefix keeps them from colliding with it. The mapping to
-- the modern schema: cs_conclusions ≈ nodes, cs_reasons ≈ linkages
-- (direction collapsed to agree/disagree), cs_linkage_entries ≈
-- linkage_arguments. The modern engine generalizes the math: raw
-- counts became truth × linkage × importance × uniqueness, and the
-- multiplier became damping / depth attenuation.
-- =================================================================


-- One row per conclusion — the workbook's numbered sheets. A "reason"
-- with no sub-debate is still a conclusion row; it simply has no
-- cs_reasons rows pointing at it, so its own score is 0 and it
-- contributes only its one-point count upstream.

CREATE TABLE IF NOT EXISTS `cs_conclusions` (
  `conclusion_id`  VARCHAR(64)  NOT NULL,
  `statement`      TEXT         NOT NULL,
  `example_set`    VARCHAR(32)  DEFAULT NULL,  -- groups seed datasets
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`conclusion_id`)
);


-- One row per listed reason — the workbook's two columns. `side` is
-- which column the reason sits in on the parent's sheet.

CREATE TABLE IF NOT EXISTS `cs_reasons` (
  `reason_id`      VARCHAR(64)  NOT NULL,
  `conclusion_id`  VARCHAR(64)  NOT NULL,  -- the sheet the reason is listed on
  `child_id`       VARCHAR(64)  NOT NULL,  -- the reason's own conclusion row
  `side`           ENUM('agree', 'disagree') NOT NULL,
  `position`       INT          NOT NULL DEFAULT 0,

  PRIMARY KEY (`reason_id`),
  UNIQUE KEY `unique_edge` (`conclusion_id`, `child_id`, `side`),
  INDEX `idx_reason_parent` (`conclusion_id`),
  INDEX `idx_reason_child` (`child_id`),

  CONSTRAINT `fk_cs_reason_parent` FOREIGN KEY (`conclusion_id`) REFERENCES `cs_conclusions`(`conclusion_id`),
  CONSTRAINT `fk_cs_reason_child`  FOREIGN KEY (`child_id`)      REFERENCES `cs_conclusions`(`conclusion_id`)
);


-- The linkage sub-debate on each edge: entries agreeing or disagreeing
-- that the reason, if true, supports (or opposes, for disagree-side
-- reasons) the conclusion it is filed under. The workbook counted
-- these with COUNTA; the LS ratio below does the same with COUNT(*).

CREATE TABLE IF NOT EXISTS `cs_linkage_entries` (
  `entry_id`       VARCHAR(64)  NOT NULL,
  `reason_id`      VARCHAR(64)  NOT NULL,
  `side`           ENUM('agree', 'disagree') NOT NULL,
  `statement`      TEXT         NOT NULL,

  PRIMARY KEY (`entry_id`),
  INDEX `idx_linkage_entry_reason` (`reason_id`, `side`),

  CONSTRAINT `fk_cs_entry_reason` FOREIGN KEY (`reason_id`) REFERENCES `cs_reasons`(`reason_id`)
);


-- The workbook's Index!O1 cell.

CREATE TABLE IF NOT EXISTS `cs_settings` (
  `setting_key`    VARCHAR(64)  NOT NULL,
  `value`          DECIMAL(8,4) NOT NULL,

  PRIMARY KEY (`setting_key`)
);

INSERT INTO `cs_settings` (`setting_key`, `value`)
VALUES ('sub_argument_multiplier', 0.7)
ON DUPLICATE KEY UPDATE `value` = `value`;


-- -- Per-edge linkage score --------------------------------------
-- LS = (agree − disagree) / (agree + disagree), 1.0 when nobody has
-- debated the linkage yet.

CREATE OR REPLACE VIEW `v_cs_edge_linkage` AS
SELECT
  r.reason_id,
  r.conclusion_id,
  r.child_id,
  r.side,
  COALESCE(SUM(e.side = 'agree'), 0)    AS linkage_agree,
  COALESCE(SUM(e.side = 'disagree'), 0) AS linkage_disagree,
  CASE
    WHEN COUNT(e.entry_id) = 0 THEN 1.0
    ELSE (SUM(e.side = 'agree') - SUM(e.side = 'disagree'))
         / COUNT(e.entry_id)
  END AS linkage_score
FROM cs_reasons r
LEFT JOIN cs_linkage_entries e ON e.reason_id = r.reason_id
GROUP BY r.reason_id, r.conclusion_id, r.child_id, r.side;


-- -- The recursive score, in one query ---------------------------
-- Excel recursed through sheet references; SQL recurses by expanding
-- every path from a conclusion down through the reason graph. Unroll
-- the recurrence and a path C → X1 → … → Xk contributes
--
--   m^(k−1) · ( Π linkage over the first k−1 edges ) · ( Π sign )
--
-- to score(C): the final edge contributes its one-point count (no LS),
-- and every edge a score is lifted through contributes its LS and one
-- factor of m. Summing path weights per root reproduces the workbook's
-- recursive A1 exactly. The path column blocks cycles, so a ring of
-- claims can never amplify itself (each member keeps only structural
-- counts) — MySQL's CYCLE clause doesn't exist, hence FIND_IN_SET.

CREATE OR REPLACE VIEW `v_cs_conclusion_scores` AS
WITH RECURSIVE score_paths AS (
  -- Direct reasons: the count term.
  SELECT
    el.conclusion_id                                   AS root_id,
    el.child_id                                        AS node_id,
    CAST(CONCAT(el.conclusion_id, ',', el.child_id) AS CHAR(4000)) AS path,
    CASE el.side WHEN 'agree' THEN 1.0 ELSE -1.0 END   AS weight,
    el.linkage_score                                   AS last_linkage
  FROM v_cs_edge_linkage el

  UNION ALL

  -- Lift the child's own reasons through the edge just walked:
  -- one factor of m, the previous edge's LS, the new edge's sign.
  SELECT
    p.root_id,
    el.child_id,
    CONCAT(p.path, ',', el.child_id),
    p.weight
      * (SELECT `value` FROM cs_settings WHERE setting_key = 'sub_argument_multiplier')
      * p.last_linkage
      * CASE el.side WHEN 'agree' THEN 1.0 ELSE -1.0 END,
    el.linkage_score
  FROM score_paths p
  JOIN v_cs_edge_linkage el ON el.conclusion_id = p.node_id
  WHERE FIND_IN_SET(el.child_id, p.path) = 0
)
SELECT
  c.conclusion_id,
  c.statement,
  c.example_set,
  COALESCE(SUM(p.weight), 0) AS conclusion_score
FROM cs_conclusions c
LEFT JOIN score_paths p ON p.root_id = c.conclusion_id
GROUP BY c.conclusion_id, c.statement, c.example_set;


-- -- The scoreboard (the workbook's Index sheet) ------------------

CREATE OR REPLACE VIEW `v_cs_index` AS
SELECT
  s.conclusion_id,
  s.statement,
  s.example_set,
  s.conclusion_score,
  (SELECT COUNT(*) FROM cs_reasons r
    WHERE r.conclusion_id = s.conclusion_id AND r.side = 'agree')    AS agree_count,
  (SELECT COUNT(*) FROM cs_reasons r
    WHERE r.conclusion_id = s.conclusion_id AND r.side = 'disagree') AS disagree_count
FROM v_cs_conclusion_scores s
ORDER BY s.conclusion_score DESC;


-- =================================================================
-- SEED DATA — the two shared example sets
-- =================================================================
-- Set 'zoning': the argument tree of the worked zoning example
-- (examples/ise-zoning/), belief z1 with its four reasons a side and
-- their own sub-reasons, and the real linkage sub-debates from that
-- example's linkage pages on the eight root edges. At m = 1:
--   z1 → 0.5333, z2/z3/z8 → 1, z4/z5/z6/z9 → 0, z7 → -1.
-- At the default m = 0.7 the root scores 0.3733; the children carry no
-- sub-arguments of their own, so only the root moves with m.
--
-- The root derivation at m = 1, edge by edge:
--   counts        4 agree - 4 disagree = 0
--   agree term    z2 1x0.3333 + z3 1x0.3333 + z4 0x0 + z5 0x(-0.3333) = 0.6667
--   disagree term z6 0x0 + z7 (-1)x(-0.3333) + z8 1x(-0.2) + z9 0x0 = 0.1333
--   score         0 + 1 x (0.6667 - 0.1333) = 0.5333
-- Two of those edges have a linkage score below zero: the sides accept
-- the reason and argue that it bears on a different question.
--
-- Set 'trees': a small synthetic tree that exercises the linkage
-- ratio. With m = 0.7 the root scores 2.05; with m = 1, 2.5.

INSERT INTO `cs_conclusions` (`conclusion_id`, `statement`, `example_set`) VALUES
  ('z1', 'Ending single-family-only zoning lowers housing costs in the cities that do it.', 'zoning'),
  ('z2', 'Where cities have allowed more homes per lot, permits rose and rents grew more slowly than in comparable cities that did not.', 'zoning'),
  ('z3', 'Zoning that caps homes per lot is the binding constraint on supply in high-cost metros.', 'zoning'),
  ('z4', 'New market-rate homes lower rents in nearby existing buildings by pulling higher-income renters out of older housing.', 'zoning'),
  ('z5', 'Allowing duplexes and small apartments on single-family lots adds homes without public subsidy.', 'zoning'),
  ('z6', 'Upzoning alone produces few homes where land is expensive and construction costs are high.', 'zoning'),
  ('z7', 'Allowing more units raises land values, which can raise the price of existing homes and displace lower-income residents.', 'zoning'),
  ('z8', 'Neighborhood character, parking, school crowding and infrastructure capacity are real costs that fall on existing residents.', 'zoning'),
  ('z9', 'Rents in Minneapolis and Austin also fell because of a building boom financed by cheap money in 2021-2022.', 'zoning'),
  ('z21', 'Auckland''s 2016 upzoning was followed by a permit surge concentrated in the upzoned areas.', 'zoning'),
  ('z22', 'Minneapolis diverged from the rest of Minnesota on both permits and rents after 2019.', 'zoning'),
  ('z23', 'The pattern repeats across cities with different demand conditions.', 'zoning'),
  ('z24', 'The comparison cities differ in demand growth and land availability.', 'zoning'),
  ('z25', 'Minneapolis also loosened rules on large apartment buildings along corridors.', 'zoning'),
  ('z31', 'In the most regulated metros the price of a home exceeds its construction cost by a large regulatory premium.', 'zoning'),
  ('z32', 'Metros that allow building absorbed large demand booms with prices near construction cost.', 'zoning'),
  ('z33', 'Where lots allow only one home, the land price per home is the whole lot.', 'zoning'),
  ('z34', 'Construction costs and financing, not zoning, are the binding constraint in many cities.', 'zoning'),
  ('z35', 'In cities with weak demand, upzoning changes nothing because nobody wants to build.', 'zoning'),
  ('z41', 'Studies of new buildings in several cities find rents in nearby existing buildings fall relative to controls.', 'zoning'),
  ('z42', 'Each new unit starts a chain of moves that reaches lower-income neighborhoods within a few steps.', 'zoning'),
  ('z43', 'New buildings can raise nearby rents through amenity effects.', 'zoning'),
  ('z44', 'The effects are local and small; they do not add up to citywide affordability.', 'zoning'),
  ('z51', 'Subsidized affordable units cost several hundred thousand dollars each in high-cost states.', 'zoning'),
  ('z52', 'Private capital builds the homes, so the tool scales with demand rather than with the budget.', 'zoning'),
  ('z53', 'Cheap for the city is not cheap for tenants displaced by redevelopment.', 'zoning'),
  ('z54', 'Without subsidy, new units reach low-income households only slowly through filtering.', 'zoning'),
  ('z61', 'SB 9 produced a few hundred applications statewide in its first year.', 'zoning'),
  ('z62', 'Small projects on single lots cannot spread fixed costs, so most did not pencil out at 2022-2024 rates.', 'zoning'),
  ('z63', 'Where land is expensive, the existing house is worth more than the redevelopment margin.', 'zoning'),
  ('z64', 'Slow uptake in the first years is typical of zoning changes.', 'zoning'),
  ('z65', 'SB 9 carried restrictions that other reforms avoid, so it tests a weak version of the reform.', 'zoning'),
  ('z66', 'Oregon''s and Minneapolis''s reforms produced steady middle-housing permits within two years.', 'zoning'),
  ('z71', 'Upzoning raises the value of land because the land can now hold more homes.', 'zoning'),
  ('z72', 'Redevelopment of older rental buildings evicts the tenants in them.', 'zoning'),
  ('z73', 'Studies of new construction find it lowers displacement risk for nearby low-income renters.', 'zoning'),
  ('z74', 'A higher land value is a gain to the existing owner, not a cost to them.', 'zoning'),
  ('z75', 'Displacement is worst where nothing gets built and rents rise across the board.', 'zoning'),
  ('z81', 'Street parking gets scarcer when parking minimums are dropped.', 'zoning'),
  ('z82', 'Fast-growing districts see school crowding before new schools are funded.', 'zoning'),
  ('z83', 'Residents chose a neighborhood with a particular form and did not consent to its change.', 'zoning'),
  ('z84', 'Most older neighborhoods have lost population since 1970, so their schools and pipes have spare capacity.', 'zoning'),
  ('z85', 'New residents pay taxes that fund the infrastructure they use; infill is cheaper to serve than sprawl.', 'zoning'),
  ('z91', 'Austin''s record permits were financed at 3 percent rates; permits fell by about half in 2024.', 'zoning'),
  ('z92', 'Rents fell across many Sun Belt metros in 2023-2025, including ones that did not reform zoning.', 'zoning'),
  ('z93', 'Minneapolis''s rent divergence from the state began before the boom and before the reform took effect.', 'zoning'),
  ('z94', 'Cheap money was national; only the cities that allowed building turned it into supply.', 'zoning')
ON DUPLICATE KEY UPDATE `statement` = VALUES(`statement`);
  ('t1', 'Our city should plant more street trees.', 'trees'),
  ('t2', 'Street trees measurably cool neighborhoods in summer.', 'trees'),
  ('t3', 'Street trees increase nearby property values.', 'trees'),
  ('t4', 'Tree roots damage sidewalks and raise repair costs.', 'trees'),
  ('t5', 'Shaded pavement stays 10-15 degrees cooler in heat waves.', 'trees'),
  ('t6', 'Tree canopy lowers home cooling bills.', 'trees'),
  ('t7', 'Studies show a price premium for tree-lined streets.', 'trees'),
  ('t8', 'The premium disappears after controlling for neighborhood wealth.', 'trees'),
  ('t9', 'Root barriers and proper species choice prevent most damage.', 'trees')
ON DUPLICATE KEY UPDATE `statement` = VALUES(`statement`);

INSERT INTO `cs_reasons` (`reason_id`, `conclusion_id`, `child_id`, `side`, `position`) VALUES
  ('ez1-z2', 'z1', 'z2', 'agree', 1),
  ('ez1-z3', 'z1', 'z3', 'agree', 2),
  ('ez1-z4', 'z1', 'z4', 'agree', 3),
  ('ez1-z5', 'z1', 'z5', 'agree', 4),
  ('ez1-z6', 'z1', 'z6', 'disagree', 1),
  ('ez1-z7', 'z1', 'z7', 'disagree', 2),
  ('ez1-z8', 'z1', 'z8', 'disagree', 3),
  ('ez1-z9', 'z1', 'z9', 'disagree', 4),
  ('ez2-z21', 'z2', 'z21', 'agree', 1),
  ('ez2-z22', 'z2', 'z22', 'agree', 2),
  ('ez2-z23', 'z2', 'z23', 'agree', 3),
  ('ez2-z24', 'z2', 'z24', 'disagree', 1),
  ('ez2-z25', 'z2', 'z25', 'disagree', 2),
  ('ez3-z31', 'z3', 'z31', 'agree', 1),
  ('ez3-z32', 'z3', 'z32', 'agree', 2),
  ('ez3-z33', 'z3', 'z33', 'agree', 3),
  ('ez3-z34', 'z3', 'z34', 'disagree', 1),
  ('ez3-z35', 'z3', 'z35', 'disagree', 2),
  ('ez4-z41', 'z4', 'z41', 'agree', 1),
  ('ez4-z42', 'z4', 'z42', 'agree', 2),
  ('ez4-z43', 'z4', 'z43', 'disagree', 1),
  ('ez4-z44', 'z4', 'z44', 'disagree', 2),
  ('ez5-z51', 'z5', 'z51', 'agree', 1),
  ('ez5-z52', 'z5', 'z52', 'agree', 2),
  ('ez5-z53', 'z5', 'z53', 'disagree', 1),
  ('ez5-z54', 'z5', 'z54', 'disagree', 2),
  ('ez6-z61', 'z6', 'z61', 'agree', 1),
  ('ez6-z62', 'z6', 'z62', 'agree', 2),
  ('ez6-z63', 'z6', 'z63', 'agree', 3),
  ('ez6-z64', 'z6', 'z64', 'disagree', 1),
  ('ez6-z65', 'z6', 'z65', 'disagree', 2),
  ('ez6-z66', 'z6', 'z66', 'disagree', 3),
  ('ez7-z71', 'z7', 'z71', 'agree', 1),
  ('ez7-z72', 'z7', 'z72', 'agree', 2),
  ('ez7-z73', 'z7', 'z73', 'disagree', 1),
  ('ez7-z74', 'z7', 'z74', 'disagree', 2),
  ('ez7-z75', 'z7', 'z75', 'disagree', 3),
  ('ez8-z81', 'z8', 'z81', 'agree', 1),
  ('ez8-z82', 'z8', 'z82', 'agree', 2),
  ('ez8-z83', 'z8', 'z83', 'agree', 3),
  ('ez8-z84', 'z8', 'z84', 'disagree', 1),
  ('ez8-z85', 'z8', 'z85', 'disagree', 2),
  ('ez9-z91', 'z9', 'z91', 'agree', 1),
  ('ez9-z92', 'z9', 'z92', 'agree', 2),
  ('ez9-z93', 'z9', 'z93', 'disagree', 1),
  ('ez9-z94', 'z9', 'z94', 'disagree', 2)
ON DUPLICATE KEY UPDATE `side` = VALUES(`side`);
  ('et1-t2',  't1',  't2',  'agree', 1),
  ('et1-t3',  't1',  't3',  'agree', 2),
  ('et1-t4',  't1',  't4',  'disagree', 1),
  ('et2-t5',  't2',  't5',  'agree', 1),
  ('et2-t6',  't2',  't6',  'agree', 2),
  ('et3-t7',  't3',  't7',  'agree', 1),
  ('et3-t8',  't3',  't8',  'disagree', 1),
  ('et4-t9',  't4',  't9',  'agree', 1)
ON DUPLICATE KEY UPDATE `side` = VALUES(`side`);

-- Linkage sub-debates: the eight root edges of the zoning set carry the
-- reasons from that example's linkage pages, and the trees set has its
-- own. Every other edge has no linkage debate yet, so it defaults to 1.0
-- (a reason is presumed relevant until someone argues otherwise).
INSERT INTO `cs_linkage_entries` (`entry_id`, `reason_id`, `side`, `statement`) VALUES
  ('zl1', 'ez1-z2', 'agree', 'Slower rent growth in reform cities than in comparable cities is the belief''s own claim measured directly.'),
  ('zl2', 'ez1-z2', 'agree', 'The reason and the belief are about the same cities, the same period and the same quantity.'),
  ('zl3', 'ez1-z2', 'disagree', 'Comparable cities are chosen after the fact, so the linkage is only as good as the matching.'),
  ('zl4', 'ez1-z3', 'agree', 'If zoning is the binding constraint, relaxing it is what changes supply, and supply is what moves prices.'),
  ('zl5', 'ez1-z3', 'agree', 'High-cost metros are exactly where the belief''s cities are.'),
  ('zl6', 'ez1-z3', 'disagree', 'A constraint can bind without one reform relaxing it enough to matter.'),
  ('zl7', 'ez1-z4', 'agree', 'Spillover is how new market-rate homes reach renters in older buildings.'),
  ('zl8', 'ez1-z4', 'disagree', 'The result concerns individual buildings, not whether a citywide change produces enough of them.'),
  ('zl9', 'ez1-z5', 'agree', 'Adding homes without subsidy is a route to lower costs that does not depend on budgets.'),
  ('zl10', 'ez1-z5', 'disagree', 'Cheapness is about what the reform costs the public, not about whether it lowers housing costs.'),
  ('zl11', 'ez1-z5', 'disagree', 'A tool can be cheap and still fail to lower costs.'),
  ('zl12', 'ez1-z6', 'agree', 'If reform produces few homes, it cannot lower costs through supply.'),
  ('zl13', 'ez1-z6', 'disagree', 'SB 9 is one narrow reform in one state; a low count there weakens the belief for that design only.'),
  ('zl14', 'ez1-z7', 'agree', 'Higher prices for existing homes are a housing cost.'),
  ('zl15', 'ez1-z7', 'disagree', 'A rise in land value under existing homes can coexist with lower rents for new tenants.'),
  ('zl16', 'ez1-z7', 'disagree', 'Displacement and asset effects belong in the cost-benefit table, not in the tree about whether costs fall.'),
  ('zl17', 'ez1-z8', 'agree', 'If neighborhood costs get reforms repealed, the policy never lowers anything.'),
  ('zl18', 'ez1-z8', 'agree', 'Infrastructure charges get passed into the price of new homes, so capacity costs are housing costs.'),
  ('zl19', 'ez1-z8', 'disagree', 'Whether existing residents bear costs does not bear on whether housing costs fall.'),
  ('zl20', 'ez1-z8', 'disagree', 'The argument answers a different question than the parent asks.'),
  ('zl21', 'ez1-z8', 'disagree', 'The costs listed fall on particular blocks; the belief is about housing costs across a city.'),
  ('zl22', 'ez1-z9', 'agree', 'If the rent declines have another sufficient cause, the reform cities stop being evidence for the belief.'),
  ('zl23', 'ez1-z9', 'disagree', 'Cheap money explains the timing of the building, not why building happened in the reform cities.')
ON DUPLICATE KEY UPDATE `statement` = VALUES(`statement`);
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
  ('l12','et1-t4', 'disagree', 'Species selection makes root damage largely avoidable.')
ON DUPLICATE KEY UPDATE `statement` = VALUES(`statement`);


-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================
--
-- The scoreboard:
--   SELECT * FROM v_cs_index;
--
-- Parity with the live workbook sheets (temporarily set m = 1):
--   UPDATE cs_settings SET `value` = 1.0 WHERE setting_key = 'sub_argument_multiplier';
--   SELECT conclusion_id, conclusion_score FROM v_cs_conclusion_scores
--    WHERE example_set = 'zoning' ORDER BY conclusion_score DESC;
--   -- expect: z2/z3/z8 → 1, z1 → 0.5333, z7 → -1
--   UPDATE cs_settings SET `value` = 0.7 WHERE setting_key = 'sub_argument_multiplier';
--
-- One edge's linkage derivation:
--   SELECT * FROM v_cs_edge_linkage WHERE reason_id = 'et1-t3';
--   -- expect: 3 agree, 1 disagree → linkage_score 0.5
