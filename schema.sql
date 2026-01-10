-- ===================================
-- Idea Stock Exchange Database Schema
-- Like a family tree for arguments
-- ===================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS beliefs;
DROP TABLE IF EXISTS users;

-- ===================================
-- Users Table
-- ===================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_expert BOOLEAN DEFAULT 0,
    expertise_field VARCHAR(100),
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ===================================
-- Beliefs Table (Arguments & Conclusions)
-- This is like the "people" in a family tree
-- Each belief can be either a conclusion or an argument
-- ===================================
CREATE TABLE beliefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK(type IN ('conclusion', 'argument', 'evidence')),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_beliefs_type ON beliefs(type);
CREATE INDEX idx_beliefs_created_by ON beliefs(created_by);
CREATE FULLTEXT INDEX idx_beliefs_content ON beliefs(content, description);

-- ===================================
-- Relationships Table
-- This is like the "parent-child" relationships in a family tree
-- Shows which arguments support or oppose which conclusions
-- ===================================
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,  -- The conclusion being supported/opposed
    child_id INTEGER NOT NULL,   -- The argument that supports/opposes
    agreement_type VARCHAR(10) NOT NULL CHECK(agreement_type IN ('agree', 'disagree')),
    linkage_score REAL DEFAULT 1.0 CHECK(linkage_score >= -1.0 AND linkage_score <= 1.0),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (parent_id) REFERENCES beliefs(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES beliefs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(parent_id, child_id)
);

CREATE INDEX idx_relationships_parent ON relationships(parent_id);
CREATE INDEX idx_relationships_child ON relationships(child_id);
CREATE INDEX idx_relationships_type ON relationships(agreement_type);

-- ===================================
-- Scores Table
-- Cached calculated scores for each belief
-- Updated when arguments change
-- ===================================
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    belief_id INTEGER NOT NULL UNIQUE,
    raw_score REAL DEFAULT 0,  -- Sum of (agree - disagree)
    normalized_score REAL DEFAULT 0,  -- Normalized to -1 to +1
    percentage_score INTEGER DEFAULT 0,  -- Displayed as -100 to +100
    agree_count INTEGER DEFAULT 0,
    disagree_count INTEGER DEFAULT 0,
    total_reasons INTEGER DEFAULT 0,
    confidence_level REAL DEFAULT 0,  -- Based on number and quality of arguments
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (belief_id) REFERENCES beliefs(id) ON DELETE CASCADE
);

CREATE INDEX idx_scores_belief ON scores(belief_id);
CREATE INDEX idx_scores_normalized ON scores(normalized_score);
CREATE INDEX idx_scores_percentage ON scores(percentage_score);

-- ===================================
-- Evidence Table
-- Supporting documentation for arguments
-- Books, articles, studies, data sources
-- ===================================
CREATE TABLE evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    belief_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    source_title VARCHAR(255),
    source_url TEXT,
    source_type VARCHAR(50) CHECK(source_type IN (
        'peer_reviewed_meta_analysis',
        'peer_reviewed_study',
        'expert_consensus',
        'verified_data',
        'news_reporting',
        'expert_opinion',
        'anecdotal',
        'opinion'
    )),
    evidence_weight REAL DEFAULT 0.5 CHECK(evidence_weight >= 0 AND evidence_weight <= 1.0),
    author VARCHAR(255),
    publication_date DATE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT 0,
    FOREIGN KEY (belief_id) REFERENCES beliefs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_evidence_belief ON evidence(belief_id);
CREATE INDEX idx_evidence_type ON evidence(source_type);
CREATE INDEX idx_evidence_weight ON evidence(evidence_weight);

-- ===================================
-- Votes Table
-- User votes on arguments and linkage scores
-- ===================================
CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,  -- Can be belief_id or relationship_id
    target_type VARCHAR(20) NOT NULL CHECK(target_type IN ('belief', 'relationship')),
    vote_value REAL NOT NULL CHECK(vote_value >= -1.0 AND vote_value <= 1.0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, target_id, target_type)
);

CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_votes_target ON votes(target_id, target_type);

-- ===================================
-- Interests Table (for conflict resolution)
-- What people care about in different issues
-- ===================================
CREATE TABLE interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    belief_id INTEGER NOT NULL,
    user_id INTEGER,
    interest_description TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK(priority >= 1 AND priority <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (belief_id) REFERENCES beliefs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_interests_belief ON interests(belief_id);
CREATE INDEX idx_interests_user ON interests(user_id);

-- ===================================
-- Tags Table
-- Categorization for beliefs
-- ===================================
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE belief_tags (
    belief_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (belief_id, tag_id),
    FOREIGN KEY (belief_id) REFERENCES beliefs(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ===================================
-- ReasonRank Table
-- PageRank-style scores for arguments
-- ===================================
CREATE TABLE reason_ranks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    belief_id INTEGER NOT NULL UNIQUE,
    rank_score REAL DEFAULT 0,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (belief_id) REFERENCES beliefs(id) ON DELETE CASCADE
);

CREATE INDEX idx_reason_ranks_score ON reason_ranks(rank_score DESC);

-- ===================================
-- Sample Data for Testing
-- ===================================

-- Insert sample users
INSERT INTO users (username, email, password_hash, is_expert, expertise_field, reputation_score) VALUES
('admin', 'admin@ideastockexchange.org', 'hashed_password_here', 1, 'Philosophy', 100),
('historian1', 'historian@example.com', 'hashed_password_here', 1, 'History', 85),
('citizen1', 'citizen@example.com', 'hashed_password_here', 0, NULL, 10);

-- Insert sample beliefs (WWII example)
INSERT INTO beliefs (content, description, type, created_by) VALUES
('The United States should have joined WWII', 'Main conclusion about US entry into World War II', 'conclusion', 1),
('Nazi Germany was doing bad things', 'General statement about Nazi actions', 'argument', 1),
('Nazis were committing systematic genocide', 'Specific argument about Holocaust', 'argument', 2),
('Need to defend allied nations', 'Argument about protecting allies', 'argument', 1),
('Prevent Nazi territorial expansion', 'Argument about stopping Nazi conquest', 'argument', 2),
('Cost in American lives was too high', 'Opposing argument about casualties', 'argument', 1),
('Economic burden on US economy', 'Opposing argument about economic cost', 'argument', 1),
('America should focus on domestic issues', 'Isolationist argument', 'argument', 3),
('Historical evidence of Holocaust', 'Sub-argument supporting genocide claim', 'argument', 2),
('Concentration camps documented', 'Sub-argument with evidence', 'argument', 2),
('Sacrifice necessary for greater good', 'Counter to lives lost argument', 'argument', 1),
('Moral imperative to stop genocide', 'Ethical argument', 'argument', 1);

-- Insert relationships
INSERT INTO relationships (parent_id, child_id, agreement_type, linkage_score, created_by) VALUES
-- Supporting arguments for joining WWII
(1, 2, 'agree', 0.90, 1),
(1, 3, 'agree', 0.98, 2),
(1, 4, 'agree', 0.85, 1),
(1, 5, 'agree', 0.88, 2),
-- Opposing arguments for joining WWII
(1, 6, 'disagree', 0.75, 1),
(1, 7, 'disagree', 0.60, 1),
(1, 8, 'disagree', 0.55, 3),
-- Sub-arguments for genocide
(3, 9, 'agree', 0.99, 2),
(3, 10, 'agree', 0.99, 2),
-- Sub-arguments against lives lost
(6, 11, 'disagree', 0.80, 1),
(6, 12, 'disagree', 0.85, 1);

-- Insert sample evidence
INSERT INTO evidence (belief_id, content, source_title, source_url, source_type, evidence_weight, author, created_by) VALUES
(3, 'Documentation of systematic murder of 6 million Jews during WWII', 'The Holocaust Encyclopedia', 'https://encyclopedia.ushmm.org', 'peer_reviewed_study', 1.0, 'United States Holocaust Memorial Museum', 2),
(10, 'Liberation of concentration camps by Allied forces revealed extensive evidence', 'Liberation of Nazi Camps', 'https://www.history.com/topics/world-war-ii/liberation-of-nazi-camps', 'verified_data', 0.9, 'History.com Editors', 2),
(6, 'Over 400,000 American military deaths in WWII', 'WWII Casualties', 'https://www.nationalww2museum.org/students-teachers/student-resources/research-starters/research-starters-us-military-numbers', 'verified_data', 0.95, 'National WWII Museum', 1);

-- Insert sample tags
INSERT INTO tags (name, description) VALUES
('WWII', 'World War II related topics'),
('Ethics', 'Ethical and moral arguments'),
('History', 'Historical events and decisions'),
('Politics', 'Political decisions and policy'),
('Military', 'Military strategy and warfare');

-- Link beliefs to tags
INSERT INTO belief_tags (belief_id, tag_id) VALUES
(1, 1), (1, 3), (1, 4),
(2, 1), (2, 3),
(3, 1), (3, 2), (3, 3),
(6, 1), (6, 5);

-- ===================================
-- Views for Common Queries
-- ===================================

-- View: Beliefs with their scores
CREATE VIEW belief_scores_view AS
SELECT
    b.id,
    b.content,
    b.description,
    b.type,
    COALESCE(s.percentage_score, 0) as score,
    COALESCE(s.agree_count, 0) as agree_count,
    COALESCE(s.disagree_count, 0) as disagree_count,
    COALESCE(s.total_reasons, 0) as total_reasons,
    COALESCE(s.confidence_level, 0) as confidence,
    b.view_count,
    b.created_at
FROM beliefs b
LEFT JOIN scores s ON b.id = s.belief_id
WHERE b.is_active = 1;

-- View: Top-ranked beliefs
CREATE VIEW top_beliefs_view AS
SELECT
    b.*,
    s.percentage_score,
    s.agree_count,
    s.disagree_count,
    rr.rank_score
FROM beliefs b
LEFT JOIN scores s ON b.id = s.belief_id
LEFT JOIN reason_ranks rr ON b.id = rr.belief_id
WHERE b.is_active = 1
ORDER BY s.percentage_score DESC, rr.rank_score DESC
LIMIT 100;

-- View: Argument tree (parent-child relationships)
CREATE VIEW argument_tree_view AS
SELECT
    r.id as relationship_id,
    r.parent_id,
    p.content as parent_content,
    r.child_id,
    c.content as child_content,
    r.agreement_type,
    r.linkage_score,
    COALESCE(ps.percentage_score, 0) as parent_score,
    COALESCE(cs.percentage_score, 0) as child_score
FROM relationships r
JOIN beliefs p ON r.parent_id = p.id
JOIN beliefs c ON r.child_id = c.id
LEFT JOIN scores ps ON p.id = ps.belief_id
LEFT JOIN scores cs ON c.id = cs.belief_id
WHERE r.is_active = 1 AND p.is_active = 1 AND c.is_active = 1;

-- ===================================
-- Triggers for Automatic Updates
-- ===================================

-- Update timestamp on beliefs
CREATE TRIGGER update_belief_timestamp
AFTER UPDATE ON beliefs
BEGIN
    UPDATE beliefs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp on users
CREATE TRIGGER update_user_timestamp
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp on votes
CREATE TRIGGER update_vote_timestamp
AFTER UPDATE ON votes
BEGIN
    UPDATE votes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ===================================
-- Stored Procedures (as needed in application code)
-- ===================================

-- Note: SQLite doesn't support stored procedures, so these will be
-- implemented in the application layer (Node.js/JavaScript)
--
-- Functions needed:
-- - calculateBeliefScore(beliefId)
-- - calculateReasonRank()
-- - getArgumentTree(beliefId, depth)
-- - getUserVotingPower(userId)
-- - getEvidenceQualityScore(beliefId)
