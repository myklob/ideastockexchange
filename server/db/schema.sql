-- ============================================================
-- ISE (Idea Stock Exchange) — PostgreSQL Relational Schema
-- ============================================================
-- Run with: psql -d ise -f schema.sql
-- Requires PostgreSQL 14+

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────

CREATE TYPE maslow_level AS ENUM (
  'PHYSIOLOGICAL',
  'SAFETY',
  'BELONGING',
  'ESTEEM',
  'SELF_ACTUALIZATION',
  'INVALID'
);

CREATE TYPE stakeholder_type AS ENUM (
  'Government',
  'International',
  'Population',
  'NGO',
  'Media',
  'Corporate',
  'Other'
);

CREATE TYPE stakeholder_position AS ENUM (
  'Supporter',
  'Opponent',
  'Neutral',
  'Mixed'
);

CREATE TYPE evidence_tier AS ENUM (
  'T1', -- Peer-reviewed empirical study          weight: 1.00
  'T2', -- Government / intergovernmental report   weight: 0.92
  'T3', -- Survey data (nationally representative) weight: 0.85
  'T4', -- Expert consensus / think-tank           weight: 0.75
  'T5', -- Behavioral / revealed-preference        weight: 0.70
  'T6', -- Journalistic reporting                  weight: 0.55
  'T7'  -- Anecdotal / speculative                 weight: 0.30
);

CREATE TYPE ledger_side AS ENUM (
  'pro-pressure',
  'pro-engagement',
  'neutral'
);

CREATE TYPE brainstorm_status AS ENUM (
  'pending',
  'clustered',
  'rejected'
);

CREATE TYPE argument_direction AS ENUM (
  'affirming',
  'challenging'
);

CREATE TYPE validity_direction AS ENUM (
  'for_high_validity',
  'for_low_validity'
);

CREATE TYPE evidence_depth AS ENUM (
  'Low',
  'Medium',
  'High',
  'Very High'
);

-- ──────────────────────────────────────────────────────────────
-- STAKEHOLDERS
-- ──────────────────────────────────────────────────────────────

CREATE TABLE stakeholders (
  stakeholder_id              VARCHAR(20)      PRIMARY KEY,
  name                        TEXT             NOT NULL,
  type                        stakeholder_type NOT NULL,
  description                 TEXT,
  population_estimate         BIGINT,
  population_fraction         NUMERIC(10, 7),
  representation_confidence   SMALLINT         CHECK (representation_confidence BETWEEN 0 AND 100),

  -- Power dimensions (0–100 each)
  power_political             SMALLINT         CHECK (power_political     BETWEEN 0 AND 100),
  power_economic              SMALLINT         CHECK (power_economic      BETWEEN 0 AND 100),
  power_military              SMALLINT         CHECK (power_military      BETWEEN 0 AND 100),
  power_narrative             SMALLINT         CHECK (power_narrative     BETWEEN 0 AND 100),
  power_institutional         SMALLINT         CHECK (power_institutional BETWEEN 0 AND 100),
  power_total_influence       SMALLINT,        -- avg of 5 dimensions; computed on insert/update
  power_description           TEXT,

  created_at                  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  created_by                  TEXT             NOT NULL DEFAULT 'user'
);

-- Denormalised join so we can ask "which conflicts does this stakeholder belong to?"
-- The conflict FK is deferred and added after the conflicts table is created.
CREATE TABLE stakeholder_conflict_links (
  stakeholder_id  VARCHAR(20)  NOT NULL REFERENCES stakeholders(stakeholder_id) ON DELETE CASCADE,
  conflict_id     VARCHAR(20)  NOT NULL,            -- FK added below after conflicts table
  PRIMARY KEY (stakeholder_id, conflict_id)
);

-- ──────────────────────────────────────────────────────────────
-- INTERESTS  (universal; not tied to any single conflict)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE interests (
  interest_id         VARCHAR(20)   PRIMARY KEY,
  name                TEXT          NOT NULL,
  description         TEXT,
  maslow_level        maslow_level  NOT NULL,
  base_validity_score SMALLINT      CHECK (base_validity_score BETWEEN 0 AND 100),
  tags                TEXT[]        NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by          TEXT          NOT NULL DEFAULT 'user'
);

-- Semantic keyword / phrase cluster per interest (for NLP deduplication)
CREATE TABLE interest_semantic_clusters (
  id          SERIAL       PRIMARY KEY,
  interest_id VARCHAR(20)  NOT NULL REFERENCES interests(interest_id) ON DELETE CASCADE,
  phrase      TEXT         NOT NULL
);

-- ──────────────────────────────────────────────────────────────
-- CONFLICTS
-- ──────────────────────────────────────────────────────────────

CREATE TABLE conflicts (
  conflict_id         VARCHAR(20)    PRIMARY KEY,
  name                TEXT           NOT NULL,
  description         TEXT,
  parent_topic        TEXT,
  spectrum_min        INTEGER        NOT NULL DEFAULT -100,
  spectrum_max        INTEGER        NOT NULL DEFAULT  100,
  importance_score    SMALLINT       CHECK (importance_score  BETWEEN 0 AND 100),
  controversy_score   SMALLINT       CHECK (controversy_score BETWEEN 0 AND 100),
  evidence_depth      evidence_depth,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by          TEXT           NOT NULL DEFAULT 'user'
);

-- Now we can safely add the FK that references conflicts
ALTER TABLE stakeholder_conflict_links
  ADD CONSTRAINT fk_scl_conflict
  FOREIGN KEY (conflict_id) REFERENCES conflicts(conflict_id) ON DELETE CASCADE;

-- ──────────────────────────────────────────────────────────────
-- STAKEHOLDER–CONFLICT MAPPINGS
-- ──────────────────────────────────────────────────────────────

CREATE TABLE conflict_stakeholder_mappings (
  id              SERIAL               PRIMARY KEY,
  conflict_id     VARCHAR(20)          NOT NULL REFERENCES conflicts(conflict_id)     ON DELETE CASCADE,
  stakeholder_id  VARCHAR(20)          NOT NULL REFERENCES stakeholders(stakeholder_id),
  position        stakeholder_position NOT NULL,
  role            TEXT,
  UNIQUE (conflict_id, stakeholder_id)
);

-- ──────────────────────────────────────────────────────────────
-- APPLIED INTERESTS  (a specific interest as held by a stakeholder in a conflict)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE applied_interests (
  id                          SERIAL       PRIMARY KEY,
  mapping_id                  INTEGER      NOT NULL REFERENCES conflict_stakeholder_mappings(id) ON DELETE CASCADE,
  interest_id                 VARCHAR(20)  NOT NULL REFERENCES interests(interest_id),
  linkage_accuracy            SMALLINT     CHECK (linkage_accuracy            BETWEEN 0 AND 100),
  percent_motivated           NUMERIC(4,3) CHECK (percent_motivated           BETWEEN 0 AND 1),
  contextual_validity_score   SMALLINT     CHECK (contextual_validity_score   BETWEEN 0 AND 100),
  composite_score             SMALLINT,    -- stored: (validity*0.6 + linkage*0.4)
  UNIQUE (mapping_id, interest_id)
);

-- ──────────────────────────────────────────────────────────────
-- EVIDENCE  (per applied interest)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE evidence (
  id                  SERIAL        PRIMARY KEY,
  evidence_id         VARCHAR(20)   UNIQUE,
  applied_interest_id INTEGER       NOT NULL REFERENCES applied_interests(id) ON DELETE CASCADE,
  tier                evidence_tier NOT NULL,
  description         TEXT          NOT NULL,
  url                 TEXT,
  year                SMALLINT,
  quality_score       SMALLINT      CHECK (quality_score BETWEEN 0 AND 100)
);

-- ──────────────────────────────────────────────────────────────
-- LINKAGE ARGUMENTS  (per applied interest)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE linkage_arguments (
  id                  SERIAL              PRIMARY KEY,
  applied_interest_id INTEGER             NOT NULL REFERENCES applied_interests(id) ON DELETE CASCADE,
  direction           argument_direction  NOT NULL,
  argument            TEXT                NOT NULL
);

-- ──────────────────────────────────────────────────────────────
-- VALIDITY ARGUMENTS  (per applied interest)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE validity_arguments (
  id                  SERIAL              PRIMARY KEY,
  applied_interest_id INTEGER             NOT NULL REFERENCES applied_interests(id) ON DELETE CASCADE,
  direction           validity_direction  NOT NULL,
  argument            TEXT                NOT NULL
);

-- ──────────────────────────────────────────────────────────────
-- SHARED INTERESTS  (interests that cross both sides of a conflict)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE shared_interests (
  id                  SERIAL       PRIMARY KEY,
  conflict_id         VARCHAR(20)  NOT NULL REFERENCES conflicts(conflict_id) ON DELETE CASCADE,
  interest_id         VARCHAR(20)  NOT NULL REFERENCES interests(interest_id),
  avg_validity_score  SMALLINT     CHECK (avg_validity_score BETWEEN 0 AND 100),
  UNIQUE (conflict_id, interest_id)
);

-- Which stakeholders share this interest
CREATE TABLE shared_interest_stakeholders (
  shared_interest_id  INTEGER      NOT NULL REFERENCES shared_interests(id) ON DELETE CASCADE,
  stakeholder_id      VARCHAR(20)  NOT NULL REFERENCES stakeholders(stakeholder_id),
  PRIMARY KEY (shared_interest_id, stakeholder_id)
);

-- Bridging proposals for a shared interest
CREATE TABLE bridging_proposals (
  id                  SERIAL    PRIMARY KEY,
  shared_interest_id  INTEGER   NOT NULL REFERENCES shared_interests(id) ON DELETE CASCADE,
  proposal            TEXT      NOT NULL,
  created_by          TEXT      NOT NULL DEFAULT 'system'
);

-- ──────────────────────────────────────────────────────────────
-- STRUCTURAL TRADEOFFS  (hard tensions between interests per conflict)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE tradeoffs (
  id                  SERIAL       PRIMARY KEY,
  conflict_id         VARCHAR(20)  NOT NULL REFERENCES conflicts(conflict_id) ON DELETE CASCADE,
  interest_a_id       VARCHAR(20)  NOT NULL REFERENCES interests(interest_id),
  interest_b_id       VARCHAR(20)  NOT NULL REFERENCES interests(interest_id),
  tension_description TEXT         NOT NULL
);

-- ──────────────────────────────────────────────────────────────
-- EVIDENCE LEDGER  (conflict-level empirical record)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE evidence_ledger (
  id            SERIAL        PRIMARY KEY,
  evidence_id   VARCHAR(20)   UNIQUE,
  conflict_id   VARCHAR(20)   NOT NULL REFERENCES conflicts(conflict_id) ON DELETE CASCADE,
  claim         TEXT          NOT NULL,
  side          ledger_side,
  source        TEXT,
  tier          evidence_tier,
  year          SMALLINT,
  quality_score SMALLINT      CHECK (quality_score BETWEEN 0 AND 100),
  url           TEXT,
  finding       TEXT
);

-- ──────────────────────────────────────────────────────────────
-- RAW BRAINSTORM QUEUE
-- ──────────────────────────────────────────────────────────────

CREATE TABLE raw_brainstorm (
  id              SERIAL             PRIMARY KEY,
  submission_id   VARCHAR(20)        UNIQUE,
  conflict_id     VARCHAR(20)        NOT NULL REFERENCES conflicts(conflict_id) ON DELETE CASCADE,
  raw_text        TEXT               NOT NULL,
  submitted_by    TEXT               NOT NULL DEFAULT 'anonymous',
  submitted_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  clustered_to    VARCHAR(20)        REFERENCES interests(interest_id),
  similarity_score SMALLINT,
  status          brainstorm_status  NOT NULL DEFAULT 'pending'
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────

CREATE INDEX idx_csm_conflict_id     ON conflict_stakeholder_mappings (conflict_id);
CREATE INDEX idx_csm_stakeholder_id  ON conflict_stakeholder_mappings (stakeholder_id);
CREATE INDEX idx_ai_mapping_id       ON applied_interests (mapping_id);
CREATE INDEX idx_ai_interest_id      ON applied_interests (interest_id);
CREATE INDEX idx_evidence_ai_id      ON evidence (applied_interest_id);
CREATE INDEX idx_la_ai_id            ON linkage_arguments (applied_interest_id);
CREATE INDEX idx_va_ai_id            ON validity_arguments (applied_interest_id);
CREATE INDEX idx_si_conflict_id      ON shared_interests (conflict_id);
CREATE INDEX idx_bp_shared_id        ON bridging_proposals (shared_interest_id);
CREATE INDEX idx_el_conflict_id      ON evidence_ledger (conflict_id);
CREATE INDEX idx_rb_conflict_id      ON raw_brainstorm (conflict_id);
CREATE INDEX idx_rb_status           ON raw_brainstorm (status);
CREATE INDEX idx_interests_maslow    ON interests (maslow_level);
CREATE INDEX idx_isc_interest_id     ON interest_semantic_clusters (interest_id);
CREATE INDEX idx_scl_conflict_id     ON stakeholder_conflict_links (conflict_id);

-- ──────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_stakeholders
  BEFORE UPDATE ON stakeholders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_interests
  BEFORE UPDATE ON interests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_conflicts
  BEFORE UPDATE ON conflicts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
