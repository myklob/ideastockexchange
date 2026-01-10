/**
 * Idea Stock Exchange - Express Server
 * Backend API for the ISE platform
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Database setup
const dbPath = path.join(__dirname, 'ise.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with schema
function initializeDatabase() {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database:', err);
        } else {
            console.log('Database initialized successfully');
        }
    });
}

// Check if database exists, if not, initialize it
if (!fs.existsSync(dbPath)) {
    console.log('Creating new database...');
    initializeDatabase();
} else {
    console.log('Using existing database');
}

// ===================================
// API Routes
// ===================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ISE API is running' });
});

// ===================================
// Beliefs Routes
// ===================================

// Get all beliefs
app.get('/api/beliefs', (req, res) => {
    const query = `
        SELECT b.*, s.percentage_score, s.agree_count, s.disagree_count
        FROM beliefs b
        LEFT JOIN scores s ON b.id = s.belief_id
        WHERE b.is_active = 1
        ORDER BY s.percentage_score DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ beliefs: rows });
    });
});

// Get single belief by ID
app.get('/api/beliefs/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT b.*, s.percentage_score, s.agree_count, s.disagree_count, s.total_reasons
        FROM beliefs b
        LEFT JOIN scores s ON b.id = s.belief_id
        WHERE b.id = ? AND b.is_active = 1
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Belief not found' });
            return;
        }

        // Increment view count
        db.run('UPDATE beliefs SET view_count = view_count + 1 WHERE id = ?', [id]);

        res.json({ belief: row });
    });
});

// Create new belief
app.post('/api/beliefs', (req, res) => {
    const { content, description, type, created_by } = req.body;

    if (!content || !type) {
        res.status(400).json({ error: 'Content and type are required' });
        return;
    }

    const query = `
        INSERT INTO beliefs (content, description, type, created_by)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [content, description, type, created_by || 1], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({
            message: 'Belief created successfully',
            id: this.lastID
        });
    });
});

// ===================================
// Relationships Routes
// ===================================

// Get relationships for a belief
app.get('/api/beliefs/:id/relationships', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT
            r.*,
            b.content as child_content,
            b.type as child_type,
            s.percentage_score as child_score
        FROM relationships r
        JOIN beliefs b ON r.child_id = b.id
        LEFT JOIN scores s ON b.id = s.belief_id
        WHERE r.parent_id = ? AND r.is_active = 1 AND b.is_active = 1
        ORDER BY r.agreement_type, s.percentage_score DESC
    `;

    db.all(query, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const agreementArgs = rows.filter(r => r.agreement_type === 'agree');
        const disagreementArgs = rows.filter(r => r.agreement_type === 'disagree');

        res.json({
            parent_id: parseInt(id),
            agree: agreementArgs,
            disagree: disagreementArgs
        });
    });
});

// Create new relationship
app.post('/api/relationships', (req, res) => {
    const { parent_id, child_id, agreement_type, linkage_score, created_by } = req.body;

    if (!parent_id || !child_id || !agreement_type) {
        res.status(400).json({ error: 'parent_id, child_id, and agreement_type are required' });
        return;
    }

    const query = `
        INSERT INTO relationships (parent_id, child_id, agreement_type, linkage_score, created_by)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [
        parent_id,
        child_id,
        agreement_type,
        linkage_score || 1.0,
        created_by || 1
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Trigger score recalculation
        calculateBeliefScore(parent_id);

        res.json({
            message: 'Relationship created successfully',
            id: this.lastID
        });
    });
});

// ===================================
// Scoring Routes
// ===================================

// Get argument tree with scores
app.get('/api/beliefs/:id/tree', (req, res) => {
    const { id } = req.params;
    const depth = parseInt(req.query.depth) || 3;

    getArgumentTree(id, depth, (err, tree) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ tree });
    });
});

// Recalculate scores for a belief
app.post('/api/beliefs/:id/calculate-score', (req, res) => {
    const { id } = req.params;

    calculateBeliefScore(id, (err, score) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Score calculated successfully',
            belief_id: parseInt(id),
            score: score
        });
    });
});

// ===================================
// Evidence Routes
// ===================================

// Get evidence for a belief
app.get('/api/beliefs/:id/evidence', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT e.*, u.username as creator_name
        FROM evidence e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.belief_id = ?
        ORDER BY e.evidence_weight DESC, e.created_at DESC
    `;

    db.all(query, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ evidence: rows });
    });
});

// Add evidence to a belief
app.post('/api/evidence', (req, res) => {
    const {
        belief_id,
        content,
        source_title,
        source_url,
        source_type,
        evidence_weight,
        author,
        publication_date,
        created_by
    } = req.body;

    if (!belief_id || !content) {
        res.status(400).json({ error: 'belief_id and content are required' });
        return;
    }

    const query = `
        INSERT INTO evidence (
            belief_id, content, source_title, source_url, source_type,
            evidence_weight, author, publication_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
        belief_id,
        content,
        source_title,
        source_url,
        source_type || 'opinion',
        evidence_weight || 0.5,
        author,
        publication_date,
        created_by || 1
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({
            message: 'Evidence added successfully',
            id: this.lastID
        });
    });
});

// ===================================
// Voting Routes
// ===================================

// Submit a vote
app.post('/api/votes', (req, res) => {
    const { user_id, target_id, target_type, vote_value } = req.body;

    if (!user_id || !target_id || !target_type || vote_value === undefined) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }

    const query = `
        INSERT INTO votes (user_id, target_id, target_type, vote_value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, target_id, target_type)
        DO UPDATE SET vote_value = ?, updated_at = CURRENT_TIMESTAMP
    `;

    db.run(query, [user_id, target_id, target_type, vote_value, vote_value], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({
            message: 'Vote recorded successfully'
        });
    });
});

// Get votes for a target
app.get('/api/votes/:target_type/:target_id', (req, res) => {
    const { target_type, target_id } = req.params;

    const query = `
        SELECT
            COUNT(*) as vote_count,
            AVG(vote_value) as average_score,
            SUM(CASE WHEN vote_value > 0 THEN 1 ELSE 0 END) as positive_votes,
            SUM(CASE WHEN vote_value < 0 THEN 1 ELSE 0 END) as negative_votes
        FROM votes
        WHERE target_type = ? AND target_id = ?
    `;

    db.get(query, [target_type, target_id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ voting_stats: row });
    });
});

// ===================================
// Search Routes
// ===================================

// Search beliefs
app.get('/api/search', (req, res) => {
    const { q } = req.query;

    if (!q) {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
    }

    const query = `
        SELECT b.*, s.percentage_score
        FROM beliefs b
        LEFT JOIN scores s ON b.id = s.belief_id
        WHERE (b.content LIKE ? OR b.description LIKE ?) AND b.is_active = 1
        ORDER BY s.percentage_score DESC
        LIMIT 50
    `;

    const searchTerm = `%${q}%`;

    db.all(query, [searchTerm, searchTerm], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ results: rows });
    });
});

// ===================================
// Helper Functions
// ===================================

// Calculate score for a belief (recursive)
function calculateBeliefScore(beliefId, callback, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) {
        if (callback) callback(null, 0);
        return;
    }

    // Get all relationships for this belief
    const query = `
        SELECT r.*, s.normalized_score as child_score
        FROM relationships r
        LEFT JOIN scores s ON r.child_id = s.belief_id
        WHERE r.parent_id = ? AND r.is_active = 1
    `;

    db.all(query, [beliefId], (err, relationships) => {
        if (err) {
            if (callback) callback(err);
            return;
        }

        let totalAgree = 0;
        let totalDisagree = 0;
        let totalReasons = relationships.length;

        if (totalReasons === 0) {
            // No arguments, neutral score
            updateScoreInDatabase(beliefId, 0, 0, 0, 0);
            if (callback) callback(null, 0);
            return;
        }

        let processed = 0;

        relationships.forEach(rel => {
            const childScore = rel.child_score || 0.5; // Default neutral
            const linkage = rel.linkage_score || 1.0;
            const contribution = (childScore * linkage) / (depth + 1);

            if (rel.agreement_type === 'agree') {
                totalAgree += contribution;
            } else {
                totalDisagree += contribution;
            }

            processed++;

            if (processed === totalReasons) {
                // Calculate final score
                const rawScore = totalAgree - totalDisagree;
                const normalizedScore = (rawScore / totalReasons + 1) / 2; // 0 to 1
                const finalScore = Math.max(0, Math.min(1, normalizedScore));
                const percentageScore = Math.round((finalScore * 2 - 1) * 100); // -100 to +100

                const agreeCount = relationships.filter(r => r.agreement_type === 'agree').length;
                const disagreeCount = relationships.filter(r => r.agreement_type === 'disagree').length;

                updateScoreInDatabase(beliefId, rawScore, finalScore, percentageScore, totalReasons, agreeCount, disagreeCount);

                if (callback) callback(null, percentageScore);
            }
        });
    });
}

// Update score in database
function updateScoreInDatabase(beliefId, rawScore, normalizedScore, percentageScore, totalReasons, agreeCount = 0, disagreeCount = 0) {
    const query = `
        INSERT INTO scores (belief_id, raw_score, normalized_score, percentage_score, total_reasons, agree_count, disagree_count, last_calculated)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(belief_id)
        DO UPDATE SET
            raw_score = ?,
            normalized_score = ?,
            percentage_score = ?,
            total_reasons = ?,
            agree_count = ?,
            disagree_count = ?,
            last_calculated = CURRENT_TIMESTAMP
    `;

    db.run(query, [
        beliefId, rawScore, normalizedScore, percentageScore, totalReasons, agreeCount, disagreeCount,
        rawScore, normalizedScore, percentageScore, totalReasons, agreeCount, disagreeCount
    ], (err) => {
        if (err) {
            console.error('Error updating score:', err);
        }
    });
}

// Get argument tree recursively
function getArgumentTree(beliefId, maxDepth, callback, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
        callback(null, { id: beliefId, children: [] });
        return;
    }

    const query = `
        SELECT
            b.id,
            b.content,
            b.type,
            r.agreement_type,
            r.linkage_score,
            s.percentage_score
        FROM relationships r
        JOIN beliefs b ON r.child_id = b.id
        LEFT JOIN scores s ON b.id = s.belief_id
        WHERE r.parent_id = ? AND r.is_active = 1 AND b.is_active = 1
    `;

    db.all(query, [beliefId], (err, children) => {
        if (err) {
            callback(err);
            return;
        }

        // Get parent belief info
        db.get('SELECT * FROM beliefs WHERE id = ?', [beliefId], (err, parent) => {
            if (err) {
                callback(err);
                return;
            }

            const tree = {
                ...parent,
                children: children
            };

            callback(null, tree);
        });
    });
}

// ===================================
// Serve HTML Pages
// ===================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===================================
// Error Handling
// ===================================

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ===================================
// Start Server
// ===================================

app.listen(PORT, () => {
    console.log(`ISE Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the site`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
