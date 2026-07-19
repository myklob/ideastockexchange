-- =================================================================
-- ISE Conclusion Score: the original spreadsheet process in SQL
-- =================================================================
--
-- The founding Excel workbook ("Conclusions about the Church with
-- arguments in separate columns"; an early copy lives at
-- docs/Example Argument, using excel, LDS Church.xlsx) gave every
-- conclusion its own sheet with reasons to agree and reasons to
-- disagree in separate columns, and computed on each sheet:
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
-- Set 'church': the belief-46 subtree from the founding workbook,
-- text-only reasons normalized to leaf conclusions (301+). With
-- m = 1 the scores must equal the workbook's cached values:
--   46 → 16, 47 → 8, 45 → 6, 48 → 2, 30/296/297 → 1.
-- With the default m = 0.7: 46 → 10.699, 47 → 5.57, 45 → 5.1.
--
-- Set 'trees': a small synthetic tree that exercises the linkage
-- ratio. With m = 0.7 the root scores 2.05; with m = 1, 2.5.

INSERT INTO `cs_conclusions` (`conclusion_id`, `statement`, `example_set`) VALUES
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
  ('t9', 'Root barriers and proper species choice prevent most damage.', 'trees')
ON DUPLICATE KEY UPDATE `statement` = VALUES(`statement`);

INSERT INTO `cs_reasons` (`reason_id`, `conclusion_id`, `child_id`, `side`, `position`) VALUES
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
  ('et4-t9',  't4',  't9',  'agree', 1)
ON DUPLICATE KEY UPDATE `side` = VALUES(`side`);

-- Linkage sub-debates exist only in the trees set (the church subtree's
-- linkage block was never wired into A1, so its edges default to 1.0).
INSERT INTO `cs_linkage_entries` (`entry_id`, `reason_id`, `side`, `statement`) VALUES
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
-- Legacy parity (temporarily set m = 1, as the live workbook sheets did):
--   UPDATE cs_settings SET `value` = 1.0 WHERE setting_key = 'sub_argument_multiplier';
--   SELECT conclusion_id, conclusion_score FROM v_cs_conclusion_scores
--    WHERE example_set = 'church' ORDER BY conclusion_score DESC;
--   -- expect: 46 → 16, 47 → 8, 45 → 6, 48 → 2, 30/296/297 → 1
--   UPDATE cs_settings SET `value` = 0.7 WHERE setting_key = 'sub_argument_multiplier';
--
-- One edge's linkage derivation:
--   SELECT * FROM v_cs_edge_linkage WHERE reason_id = 'et1-t3';
--   -- expect: 3 agree, 1 disagree → linkage_score 0.5
