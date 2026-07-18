-- =================================================================
-- ISE Linkage Pages: SQL Schema
-- =================================================================
--
-- Defines the database tables that back every linkage evaluation page.
-- The HTML template (templates/linkage-evaluation-template.html) is a
-- RENDER of the data in these tables. The JSON-LD block embedded in
-- each page is the on-the-wire serialization of these rows.
--
-- Schema version: 1.1.0 (adds fallacy claims, claim votes, grouping votes)
-- Engine: MariaDB 10.4+ / MySQL 8.0+ (uses CHECK constraints, JSON type)
-- Companion: src/core/scoring/scoring-engine.ts in the GitHub repo
--   https://github.com/myklob/ideastockexchange
--
-- DESIGN PRINCIPLES
-- -----------------
-- 1. Audit-lock: scores are never updated by direct UPDATE on the
--    score columns. They are recomputed by the ReasonRank engine and
--    written via the recompute_scores() stored procedure (defined
--    elsewhere). The columns exist for fast read access; the source
--    of truth is the argument tree, not these columns.
--
-- 2. Soft delete: nodes are never deleted, only marked deleted_at.
--    This preserves linkage history and prevents orphaned references.
--
-- 3. Field names match the JSON-LD paths in the template. If you add
--    a column here, add the matching JSON path. If you rename, rename
--    in both places at once.
--
-- 4. Every score column has a corresponding _computed_at timestamp
--    so a reader can tell how stale the cached score is.
--
-- 5. Provenance columns track who created / last edited each row,
--    including AI assistant sessions. Required for the audit trail.
-- =================================================================


-- -- Belief / argument / evidence nodes (referenced by linkages) --
-- Linkage pages connect TWO nodes. Both nodes must already exist in
-- this table before a linkage page can reference them. This table is
-- shared with the belief page system; it's reproduced here for clarity
-- but should be defined in a single canonical place.

CREATE TABLE IF NOT EXISTS `nodes` (
  `node_id`             VARCHAR(64)   NOT NULL,
  `node_type`           ENUM('belief', 'argument', 'evidence') NOT NULL,
  `canonical_statement` TEXT          NOT NULL,
  `canonical_url`       VARCHAR(500)  DEFAULT NULL,

  -- Cached scores. Source of truth is the recursive engine, not these.
  `argument_score`      DECIMAL(5,4)  DEFAULT NULL,
  `truth_score`         DECIMAL(5,4)  DEFAULT NULL,
  `score_computed_at`   TIMESTAMP     NULL DEFAULT NULL,

  -- Lifecycle
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,
  `last_edited_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_edited_by`      VARCHAR(128)  DEFAULT NULL,
  `deleted_at`          TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (`node_id`),
  INDEX `idx_node_type` (`node_type`),
  INDEX `idx_node_score` (`argument_score` DESC)
);


-- -- Linkage pages (the main table) -----------------------------
-- One row per linkage page. The page's content is split across
-- this table and the supporting tables below.

CREATE TABLE IF NOT EXISTS `linkages` (
  `linkage_id`          VARCHAR(64)   NOT NULL,

  -- The two endpoints
  `x_node_id`           VARCHAR(64)   NOT NULL,
  `y_node_id`           VARCHAR(64)   NOT NULL,

  -- Linkage metadata
  `linkage_type`        ENUM('ECLS', 'ACLS') NOT NULL,
  `direction`           ENUM('supports', 'weakens', 'refutes') NOT NULL,

  -- Cached aggregate score. AUDIT-LOCKED: do not UPDATE directly.
  -- Recomputed by the engine from the linkage_arguments table.
  -- Range is [-1, 1]: negative = X refutes Y, 0 = irrelevant, +1 = X proves Y.
  `linkage_score`                    DECIMAL(5,4) DEFAULT NULL,
  `linkage_score_confidence_interval` DECIMAL(5,4) DEFAULT NULL,
  `linkage_score_n_evaluations`      INT          DEFAULT 0,
  `score_computed_at`                TIMESTAMP    NULL DEFAULT NULL,
  `last_validated_at`                TIMESTAMP    NULL DEFAULT NULL,
  `stale_after_days`                 INT          DEFAULT 365,

  -- Derivation breakdown (matches FormulaBreakdown in the React route)
  `derivation_supporting_weight_a`   DECIMAL(8,4) DEFAULT NULL,
  `derivation_opposing_weight_d`     DECIMAL(8,4) DEFAULT NULL,
  `derivation_depth_attenuation`     DECIMAL(5,4) DEFAULT NULL,

  -- Provenance
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,
  `last_edited_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_edited_by`      VARCHAR(128)  DEFAULT NULL,
  `template_version`    VARCHAR(16)   DEFAULT '1.0.0',
  `deleted_at`          TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (`linkage_id`),
  UNIQUE KEY `unique_pair` (`x_node_id`, `y_node_id`, `direction`),
  INDEX `idx_x_node` (`x_node_id`),
  INDEX `idx_y_node` (`y_node_id`),
  INDEX `idx_linkage_score` (`linkage_score` DESC),

  CONSTRAINT `fk_linkage_x` FOREIGN KEY (`x_node_id`) REFERENCES `nodes`(`node_id`),
  CONSTRAINT `fk_linkage_y` FOREIGN KEY (`y_node_id`) REFERENCES `nodes`(`node_id`),
  CONSTRAINT `chk_linkage_score_range` CHECK (`linkage_score` IS NULL OR (`linkage_score` >= -1 AND `linkage_score` <= 1))
);


-- -- Linkage arguments (the two-column debate on each page) -----
-- Each row is one argument FOR or AGAINST the linkage. The page's
-- linkage_score is the recursive aggregate of these rows.

CREATE TABLE IF NOT EXISTS `linkage_arguments` (
  `arg_id`              VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,
  `side`                ENUM('agree', 'disagree') NOT NULL,
  `position`            INT           NOT NULL,  -- ordering within side

  -- Content
  `claim`               VARCHAR(500)  NOT NULL,  -- short claim, 4-12 words
  `description`         TEXT          NOT NULL,  -- 1-3 sentences

  -- Pattern classification (matches data-ise-pattern in HTML)
  `pattern`             ENUM(
    'mechanism', 'necessity', 'scope-fit', 'monotonicity',
    'missing-step', 'true-but-irrelevant', 'scope-mismatch',
    'parent-mechanism-mismatch', 'reversal-at-scale', 'other'
  ) DEFAULT 'other',

  -- Cached scores. AUDIT-LOCKED.
  `argument_score`      DECIMAL(5,4)  DEFAULT NULL,
  `linkage_score_to_this_page` DECIMAL(5,4) DEFAULT NULL,
  `score_computed_at`   TIMESTAMP     NULL DEFAULT NULL,

  -- Provenance
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,
  `deleted_at`          TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (`arg_id`),
  INDEX `idx_linkage_side_position` (`linkage_id`, `side`, `position`),
  INDEX `idx_pattern` (`pattern`),

  CONSTRAINT `fk_arg_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`)
);


-- -- Rephrasings (the equivalency table on each page) -----------
-- Variants of X and Y, with their equivalency scores and resulting
-- linkage scores. Drift is computed: drift = abs(L_canonical - L_variant).

CREATE TABLE IF NOT EXISTS `linkage_rephrasings` (
  `variant_id`          VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,
  `target`              ENUM('x', 'y') NOT NULL,
  `position`            INT           NOT NULL,  -- 0 = canonical

  -- Rephrasing
  `rephrasing_type`     ENUM(
    'canonical', 'filler-stripped', 'active-voice',
    'mechanism-explicit', 'quantified', 'scope-narrowed', 'other'
  ) NOT NULL,
  `text`                TEXT          NOT NULL,

  -- Scores. AUDIT-LOCKED.
  `equivalency_to_canonical`     DECIMAL(5,4) DEFAULT NULL,
  `linkage_under_this_phrasing`  DECIMAL(5,4) DEFAULT NULL,
  `drift`                        DECIMAL(5,4) DEFAULT NULL,
  `score_computed_at`            TIMESTAMP    NULL DEFAULT NULL,

  -- Provenance
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,

  PRIMARY KEY (`variant_id`),
  INDEX `idx_linkage_target_pos` (`linkage_id`, `target`, `position`),

  CONSTRAINT `fk_rephrasing_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`)
);


-- -- Five-step linkage check records ----------------------------
-- One row per check performed on this linkage placement. Multiple
-- checks may exist over time (re-run after edits, by different users).
-- The most recent non-deleted row is shown on the rendered page.

CREATE TABLE IF NOT EXISTS `linkage_checks` (
  `check_id`                       VARCHAR(64)  NOT NULL,
  `linkage_id`                     VARCHAR(64)  NOT NULL,

  -- The five steps
  `step_1_parent_claim_verbatim`   TEXT         NOT NULL,
  `step_2_evidence_or_argument_verbatim` TEXT   NOT NULL,
  `step_3_mechanism_one_sentence`  TEXT         NOT NULL,
  `step_4_self_assessed_score`     DECIMAL(5,4) NOT NULL,
  `step_4_dominant_factor`         ENUM(
    'relevance', 'network-strength', 'contextual-fit', 'uniqueness'
  ) NOT NULL,
  `step_5_flagged_below_threshold` BOOLEAN      NOT NULL,
  `step_5_action_taken`            TEXT         DEFAULT NULL,

  -- Provenance (required for audit trail)
  `performed_by`                   VARCHAR(128) NOT NULL,
  `performed_at`                   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `is_ai_assistant_check`          BOOLEAN      DEFAULT FALSE,
  `ai_session_id`                  VARCHAR(128) DEFAULT NULL,

  PRIMARY KEY (`check_id`),
  INDEX `idx_linkage_performed` (`linkage_id`, `performed_at` DESC),

  CONSTRAINT `fk_check_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`),
  CONSTRAINT `chk_step_4_range` CHECK (`step_4_self_assessed_score` >= 0 AND `step_4_self_assessed_score` <= 1)
);


-- -- Failure mode catalog ---------------------------------------
-- Shared across all linkage pages. The Schiltz case is row 1 and is
-- marked is_canonical_origin = TRUE. New failure modes are added as
-- they're caught in the wild.

CREATE TABLE IF NOT EXISTS `failure_modes` (
  `failure_mode_id`     VARCHAR(64)   NOT NULL,
  `failure_mode`        VARCHAR(64)   NOT NULL,  -- e.g., 'parent-mechanism-mismatch'
  `name`                VARCHAR(128)  NOT NULL,  -- e.g., 'Schiltz case'
  `is_canonical_origin` BOOLEAN       DEFAULT FALSE,

  `x_text`              TEXT          NOT NULL,
  `y_text`              TEXT          NOT NULL,
  `why_it_fails`        TEXT          NOT NULL,  -- one sentence

  -- Optional links to actual nodes if the example uses real ones
  `x_node_id`           VARCHAR(64)   DEFAULT NULL,
  `y_node_id`           VARCHAR(64)   DEFAULT NULL,

  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,

  PRIMARY KEY (`failure_mode_id`),
  INDEX `idx_failure_mode` (`failure_mode`),

  CONSTRAINT `fk_fm_x` FOREIGN KEY (`x_node_id`) REFERENCES `nodes`(`node_id`),
  CONSTRAINT `fk_fm_y` FOREIGN KEY (`y_node_id`) REFERENCES `nodes`(`node_id`)
);


-- -- Diagnostic questions (Necessity / Sufficiency / Directness) -
-- Canonical from docs/wiki/LinkageScores.md. One row per question
-- per linkage. The three rows are inputs to step 4 of the five-step
-- check; they are NOT scored by the recursive engine, they are
-- editor-supplied judgments.

CREATE TABLE IF NOT EXISTS `linkage_diagnostics` (
  `diagnostic_id`       VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,
  `question`            ENUM('necessity', 'sufficiency', 'directness') NOT NULL,
  `score`               DECIMAL(5,4)  DEFAULT NULL,  -- necessity/sufficiency: 0-1
  `step_count`          INT           DEFAULT NULL,  -- directness: number of steps
  `explanation`         TEXT          DEFAULT NULL,

  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,
  `last_edited_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`diagnostic_id`),
  UNIQUE KEY `unique_question_per_linkage` (`linkage_id`, `question`),

  CONSTRAINT `fk_diagnostic_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`),
  CONSTRAINT `chk_diagnostic_score` CHECK (`score` IS NULL OR (`score` >= 0 AND `score` <= 1))
);


-- -- Sibling candidates considered (Schiltz protection) -----------
-- Forces the contributor to record which candidate parents Y' were
-- considered before settling on Y. The Schiltz failure mode was a
-- parent-mechanism mismatch: a sibling was the better fit. Naming
-- the rejected siblings makes the placement decision auditable.

CREATE TABLE IF NOT EXISTS `linkage_sibling_candidates` (
  `candidate_id`        VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,
  `position`            INT           NOT NULL,
  `candidate_node_id`   VARCHAR(64)   DEFAULT NULL,    -- nullable: may be a hypothetical parent
  `candidate_text`      VARCHAR(500)  NOT NULL,        -- always present
  `estimated_linkage`   DECIMAL(5,4)  DEFAULT NULL,
  `reason_rejected`     TEXT          NOT NULL,

  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,

  PRIMARY KEY (`candidate_id`),
  INDEX `idx_linkage_position` (`linkage_id`, `position`),

  CONSTRAINT `fk_sibling_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`),
  CONSTRAINT `fk_sibling_node` FOREIGN KEY (`candidate_node_id`) REFERENCES `nodes`(`node_id`),
  CONSTRAINT `chk_sibling_linkage_range` CHECK (`estimated_linkage` IS NULL OR (`estimated_linkage` >= -1 AND `estimated_linkage` <= 1))
);


-- -- Hidden assumptions -----------------------------------------

CREATE TABLE IF NOT EXISTS `linkage_assumptions` (
  `assumption_id`       VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,
  `direction`           ENUM('required-to-hold', 'required-to-fail') NOT NULL,
  `position`            INT           NOT NULL,
  `text`                TEXT          NOT NULL,

  -- Optional link to a belief node if the assumption has its own page
  `belief_node_id`      VARCHAR(64)   DEFAULT NULL,

  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,

  PRIMARY KEY (`assumption_id`),
  INDEX `idx_linkage_dir_pos` (`linkage_id`, `direction`, `position`),

  CONSTRAINT `fk_assumption_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`),
  CONSTRAINT `fk_assumption_belief` FOREIGN KEY (`belief_node_id`) REFERENCES `nodes`(`node_id`)
);


-- -- Bias risks -------------------------------------------------

CREATE TABLE IF NOT EXISTS `linkage_bias_risks` (
  `risk_id`             VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,
  `direction`           ENUM('inflates', 'deflates') NOT NULL,
  `position`            INT           NOT NULL,
  `bias_name`           VARCHAR(128)  NOT NULL,
  `description`         TEXT          NOT NULL,

  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,

  PRIMARY KEY (`risk_id`),
  INDEX `idx_linkage_direction_pos` (`linkage_id`, `direction`, `position`),

  CONSTRAINT `fk_bias_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`)
);


-- -- Structured fallacy claims ----------------------------------
-- An accusation is an argument. Filing requires every template field
-- (the application rejects anything less) and changes NO score: the
-- claim's counter-argument enters linkage_arguments as a draft. Only
-- weighted community consensus (>= 60%, quorum 3) confirms the claim,
-- publishes the counter-argument, and triggers the engine recompute.
-- Mirrors the Prisma models FallacyClaim / FallacyClaimVote.

CREATE TABLE IF NOT EXISTS `fallacy_claims` (
  `claim_id`            VARCHAR(64)   NOT NULL,
  `linkage_id`          VARCHAR(64)   NOT NULL,  -- the accused edge

  -- Catalog classification (denormalized at filing time)
  `fallacy_type`        VARCHAR(64)   NOT NULL,  -- e.g., 'false-dilemma'
  `target_factor`       ENUM('relevance', 'logical-validity', 'evidence-quality') NOT NULL,
  `severity`            ENUM('minor', 'major') NOT NULL,

  -- The six-field accusation template (all NOT NULL: no bare "FALLACY!")
  `quoted_text`         TEXT          NOT NULL,
  `explanation`         TEXT          NOT NULL,
  `missing_elements`    TEXT          NOT NULL,
  `evidence_links`      JSON          NOT NULL,  -- [{label, url?, belief_slug?}]
  `consequences`        TEXT          NOT NULL,

  -- Resolution state. AUDIT-LOCKED: moved only by the consensus query
  -- below, never by the accuser.
  `status`              ENUM('open', 'confirmed', 'rejected') NOT NULL DEFAULT 'open',
  `consensus`           DECIMAL(5,4)  DEFAULT NULL,  -- weighted agree share
  `resolved_at`         TIMESTAMP     NULL DEFAULT NULL,

  -- The draft counter-argument this claim placed in the sub-debate.
  -- Published on confirmation; retired on rejection.
  `counter_arg_id`      VARCHAR(64)   DEFAULT NULL,

  -- Provenance
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(128)  DEFAULT NULL,

  PRIMARY KEY (`claim_id`),
  INDEX `idx_claim_linkage` (`linkage_id`),
  INDEX `idx_claim_status` (`status`),
  INDEX `idx_claim_creator` (`created_by`),

  CONSTRAINT `fk_claim_linkage` FOREIGN KEY (`linkage_id`) REFERENCES `linkages`(`linkage_id`),
  CONSTRAINT `fk_claim_counter` FOREIGN KEY (`counter_arg_id`) REFERENCES `linkage_arguments`(`arg_id`),
  CONSTRAINT `chk_claim_consensus` CHECK (`consensus` IS NULL OR (`consensus` >= 0 AND `consensus` <= 1))
);


-- -- Fallacy claim votes ----------------------------------------
-- One row per user per claim. `weight` is the voter's caller-credibility
-- multiplier (accuracy x cross-partisan balance, clamped to [0.3, 1.4]),
-- computed by the application from fallacy_claims history at vote time —
-- NEVER submitted by the voter.

CREATE TABLE IF NOT EXISTS `fallacy_claim_votes` (
  `vote_id`             VARCHAR(64)   NOT NULL,
  `claim_id`            VARCHAR(64)   NOT NULL,
  `user_id`             VARCHAR(128)  NOT NULL,
  `agree`               BOOLEAN       NOT NULL,
  `reasoning`           TEXT          DEFAULT NULL,
  `weight`              DECIMAL(5,4)  NOT NULL DEFAULT 1.0,
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`vote_id`),
  UNIQUE KEY `unique_vote_per_user` (`claim_id`, `user_id`),
  INDEX `idx_vote_claim` (`claim_id`),
  INDEX `idx_vote_user` (`user_id`),

  CONSTRAINT `fk_vote_claim` FOREIGN KEY (`claim_id`) REFERENCES `fallacy_claims`(`claim_id`),
  CONSTRAINT `chk_vote_weight` CHECK (`weight` >= 0.3 AND `weight` <= 1.4)
);


-- -- Grouping votes (same claim, different words) ----------------
-- The redundancy scan proposes candidate pairs; the community settles
-- them at the same 60% weighted bar. Mirrors EquivalenceCandidate /
-- GroupingVote in the Prisma schema. Candidate pairs reference nodes
-- because the pair is about the claims, not one particular edge.

CREATE TABLE IF NOT EXISTS `grouping_candidates` (
  `candidate_id`        VARCHAR(64)   NOT NULL,
  `new_node_id`         VARCHAR(64)   NOT NULL,
  `existing_node_id`    VARCHAR(64)   NOT NULL,
  `similarity`          DECIMAL(5,4)  NOT NULL,
  -- same-claim (>= 0.95) | probable-group (>= 0.8) | related-link (>= 0.5)
  `band`                VARCHAR(32)   DEFAULT NULL,
  `status`              ENUM('open', 'grouped', 'kept-separate') NOT NULL DEFAULT 'open',
  `consensus`           DECIMAL(5,4)  DEFAULT NULL,
  `resolved_at`         TIMESTAMP     NULL DEFAULT NULL,
  `detected_at`         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`candidate_id`),
  INDEX `idx_candidate_new` (`new_node_id`),
  INDEX `idx_candidate_existing` (`existing_node_id`),
  INDEX `idx_candidate_status` (`status`),

  CONSTRAINT `fk_candidate_new` FOREIGN KEY (`new_node_id`) REFERENCES `nodes`(`node_id`),
  CONSTRAINT `fk_candidate_existing` FOREIGN KEY (`existing_node_id`) REFERENCES `nodes`(`node_id`)
);

CREATE TABLE IF NOT EXISTS `grouping_votes` (
  `vote_id`             VARCHAR(64)   NOT NULL,
  `candidate_id`        VARCHAR(64)   NOT NULL,
  `user_id`             VARCHAR(128)  NOT NULL,
  `agree`               BOOLEAN       NOT NULL,  -- true = same claim, group
  `reasoning`           TEXT          DEFAULT NULL,
  `weight`              DECIMAL(5,4)  NOT NULL DEFAULT 1.0,
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`vote_id`),
  UNIQUE KEY `unique_grouping_vote_per_user` (`candidate_id`, `user_id`),
  INDEX `idx_grouping_vote_candidate` (`candidate_id`),

  CONSTRAINT `fk_grouping_vote_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `grouping_candidates`(`candidate_id`)
);


-- -- Consensus tally view ---------------------------------------
-- How the application resolves a claim: weighted agree share across the
-- votes, settled at >= 0.6 either way once at least 3 votes exist. The
-- same query shape runs for grouping_votes. This is the SQL twin of
-- resolveConsensus() in src/lib/consensus.ts.

CREATE OR REPLACE VIEW `v_fallacy_claim_tally` AS
SELECT
  c.claim_id,
  c.fallacy_type,
  c.status,
  COUNT(v.vote_id)                                    AS vote_count,
  COALESCE(SUM(v.weight), 0)                          AS total_weight,
  COALESCE(SUM(CASE WHEN v.agree THEN v.weight END), 0)
    / NULLIF(SUM(v.weight), 0)                        AS agree_share,
  CASE
    WHEN COUNT(v.vote_id) < 3 THEN 'open'
    WHEN COALESCE(SUM(CASE WHEN v.agree THEN v.weight END), 0)
      / NULLIF(SUM(v.weight), 0) >= 0.6 THEN 'confirmed'
    WHEN COALESCE(SUM(CASE WHEN NOT v.agree THEN v.weight END), 0)
      / NULLIF(SUM(v.weight), 0) >= 0.6 THEN 'rejected'
    ELSE 'open'
  END                                                 AS computed_outcome
FROM fallacy_claims c
LEFT JOIN fallacy_claim_votes v ON v.claim_id = c.claim_id
GROUP BY c.claim_id, c.fallacy_type, c.status;


-- =================================================================
-- READ VIEW: full linkage page in a single query
-- =================================================================
-- Convenience view that joins everything needed to render a page.
-- The renderer queries this view, serializes the result as JSON-LD,
-- and emits the HTML template with the JSON embedded.

CREATE OR REPLACE VIEW `v_linkage_page` AS
SELECT
  l.linkage_id,
  l.linkage_type,
  l.direction,
  l.linkage_score,
  l.linkage_score_confidence_interval,
  l.linkage_score_n_evaluations,
  l.score_computed_at,
  l.last_validated_at,
  l.stale_after_days,
  -- Staleness flag: TRUE when last validation predates the threshold.
  (l.last_validated_at IS NULL
    OR l.last_validated_at < (NOW() - INTERVAL l.stale_after_days DAY)) AS is_stale,
  l.derivation_supporting_weight_a,
  l.derivation_opposing_weight_d,
  l.derivation_depth_attenuation,
  l.template_version,
  l.created_at, l.created_by,
  l.last_edited_at, l.last_edited_by,

  -- X node
  l.x_node_id,
  x.canonical_statement AS x_canonical_statement,
  x.canonical_url       AS x_canonical_url,
  x.argument_score      AS x_argument_score,
  x.node_type           AS x_node_type,

  -- Y node
  l.y_node_id,
  y.canonical_statement AS y_canonical_statement,
  y.canonical_url       AS y_canonical_url,
  y.argument_score      AS y_argument_score,
  y.node_type           AS y_node_type,

  -- Computed: contribution to Y
  (x.argument_score * l.linkage_score) AS contribution_to_y

FROM linkages l
JOIN nodes x ON l.x_node_id = x.node_id
JOIN nodes y ON l.y_node_id = y.node_id
WHERE l.deleted_at IS NULL
  AND x.deleted_at IS NULL
  AND y.deleted_at IS NULL;


-- =================================================================
-- AUDIT LOG (every score change traces here)
-- =================================================================
-- Required to satisfy the audit-lock principle. Any change to a
-- score column logs a row here with the trigger that caused it.

CREATE TABLE IF NOT EXISTS `score_audit_log` (
  `audit_id`            BIGINT        NOT NULL AUTO_INCREMENT,
  `table_name`          VARCHAR(64)   NOT NULL,
  `row_id`              VARCHAR(64)   NOT NULL,
  `column_name`         VARCHAR(64)   NOT NULL,
  `old_value`           DECIMAL(5,4)  DEFAULT NULL,
  `new_value`           DECIMAL(5,4)  DEFAULT NULL,
  `triggered_by`        VARCHAR(128)  NOT NULL,  -- e.g., 'recompute_engine', 'manual_override'
  `triggered_at`        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `reason`              TEXT          DEFAULT NULL,

  PRIMARY KEY (`audit_id`),
  INDEX `idx_table_row` (`table_name`, `row_id`),
  INDEX `idx_triggered_at` (`triggered_at` DESC)
);


-- =================================================================
-- NOTES FOR IMPLEMENTERS
-- =================================================================
--
-- 1. The HTML template is a RENDER, not a source. Don't edit content
--    on a rendered page expecting it to persist. Edit the database
--    (or the JSON-LD if working in a wiki-only flow) and regenerate.
--
-- 2. Every score column is read-only from application code. Scores
--    are written by recompute_scores(linkage_id) and similar stored
--    procedures defined in the engine. Direct UPDATEs trigger the
--    audit log and should be reviewed.
--
-- 3. AI assistants writing to this database MUST set is_ai_assistant
--    flags and provide ai_session_id where applicable. This is the
--    audit trail for AI-generated content.
--
-- 4. The five-step check is REQUIRED before inserting any new
--    linkage_arguments row that affects the linkage_score. Check
--    rows persist; they are not transient. The check IS the audit.
--
-- 5. To migrate an existing PBworks page to this schema: parse the
--    embedded JSON-LD block, INSERT into linkages, then INSERT
--    rows into the supporting tables. The data-* attributes in the
--    HTML are redundant with the JSON-LD; parse the JSON-LD only.
--
-- 6. Note for SQLite parity: this schema uses MariaDB/MySQL ENUMs
--    and CHECK constraints. The companion Prisma schema in
--    prisma/schema.prisma already models the same domain on SQLite
--    (LinkageArgument, LinkageVote, FallacyClaim, FallacyClaimVote,
--    EquivalenceCandidate, GroupingVote). When promoting from SQLite
--    to MariaDB, this file is the target.
--
-- 7. Fallacy claims never dock a score at filing. The counter-argument
--    row referenced by counter_arg_id stays in DRAFT until
--    v_fallacy_claim_tally computes 'confirmed'; only then does the
--    application publish it and rerun the linkage recompute. Draft and
--    rejected linkage_arguments rows are excluded from every score
--    aggregate.
