import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import beliefRoutes from './routes/beliefs.js';
import beliefLinksRoutes from './routes/beliefLinks.js';
import argumentRoutes from './routes/arguments.js';
import evidenceRoutes from './routes/evidence.js';
import analysisRoutes from './routes/analysis.js';
import topicRoutes from './routes/topics.js';
import conflictResolutionRoutes from './routes/conflictResolution.js';
import journalRoutes from './routes/journals.js';
import studyRoutes from './routes/studies.js';
import assumptionRoutes from './routes/assumptions.js';
import contributorRoutes from './routes/contributors.js';
import lawRoutes from './routes/laws.js';
import beliefGeneratorRoutes from './routes/beliefGenerator.js';
import exportRoutes from './routes/exportRoutes.js';

// Import monetization routes
import subscriptionRoutes from './routes/subscriptions.js';
import portfolioRoutes from './routes/portfolio.js';
import achievementRoutes from './routes/achievements.js';
import gamificationRoutes from './routes/gamification.js';
import matchingRoutes from './routes/matching.js';

// Import confidence interval routes
import confidenceIntervalRoutes from './routes/confidenceIntervals.js';

// Import evidence quality scoring routes
import methodologyChallengeRoutes from './routes/methodologyChallenges.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// REASONRANK / ARGUMENTRANK ALGORITHM
// ============================================================================

/**
 * ArgumentRank algorithm - adapted from PageRank
 * Evaluates the credibility of arguments based on interlinking support
 *
 * @param {number[][]} M - Adjacency matrix (positive = support, negative = opposition)
 * @param {number} numIterations - Number of iterations to run
 * @param {number} d - Damping factor (default 0.85, like PageRank)
 * @returns {number[]} - Array of scores for each argument
 */
function argumentrank(M, numIterations = 100, d = 0.85) {
  const N = M.length;

  // Initialize scores evenly
  let v = Array(N).fill(1 / N);

  // Create transition matrix
  const M_hat = [];
  for (let i = 0; i < N; i++) {
    M_hat[i] = [];
    for (let j = 0; j < N; j++) {
      M_hat[i][j] = d * M[i][j] + (1 - d) / N;
    }
  }

  // Iteratively update scores
  for (let iter = 0; iter < numIterations; iter++) {
    const v_new = Array(N).fill(0);

    // Matrix multiplication: v_new = M_hat * v
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        v_new[i] += M_hat[i][j] * v[j];
      }
    }

    // Prevent negative scores
    for (let i = 0; i < N; i++) {
      v_new[i] = Math.max(0, v_new[i]);
    }

    // Normalize to sum to 1
    const sum = v_new.reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      for (let i = 0; i < N; i++) {
        v_new[i] /= sum;
      }
    }

    v = v_new;
  }

  return v;
}

/**
 * Calculate Conclusion Score (CS) for a belief
 * CS = sum((RtA - RtD) × ES × LC × VC × LR × UD × AI)
 */
function calculateConclusionScore(argumentsList) {
  let totalScore = 0;

  for (const arg of argumentsList) {
    const {
      reasonToAgree = 0,
      reasonToDisagree = 0,
      evidenceStrength = 1.0,
      logicalCoherence = 1.0,
      verificationCredibility = 1.0,
      linkageRelevance = 1.0,
      uniqueness = 1.0,
      argumentImportance = 1.0
    } = arg;

    const score = (reasonToAgree - reasonToDisagree) *
                  evidenceStrength *
                  logicalCoherence *
                  verificationCredibility *
                  linkageRelevance *
                  uniqueness *
                  argumentImportance;

    totalScore += score;
  }

  return totalScore;
}

// ============================================================================
// API ROUTES
// ============================================================================

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/beliefs', beliefRoutes);
app.use('/api/beliefs', beliefLinksRoutes); // Belief link routes (What Links Here feature)
app.use('/api/arguments', argumentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/conflicts', conflictResolutionRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/assumptions', assumptionRoutes);
app.use('/api/contributors', contributorRoutes);
app.use('/api/laws', lawRoutes);
app.use('/api/belief-generator', beliefGeneratorRoutes);
app.use('/api/export', exportRoutes);

// Mount monetization routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/matching', matchingRoutes);

// Mount confidence interval routes
app.use('/api/confidence-intervals', confidenceIntervalRoutes);

// Mount evidence quality scoring routes
app.use('/api/methodology-challenges', methodologyChallengeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Idea Stock Exchange API is running',
    timestamp: new Date().toISOString(),
    database: 'connected', // TODO: Add actual DB status check
  });
});

// Calculate ArgumentRank scores
app.post('/api/argumentrank', (req, res) => {
  try {
    const { matrix, iterations = 100, dampingFactor = 0.85 } = req.body;

    if (!matrix || !Array.isArray(matrix)) {
      return res.status(400).json({
        success: false,
        error: 'Matrix is required and must be an array',
      });
    }

    const scores = argumentrank(matrix, iterations, dampingFactor);

    res.json({
      success: true,
      data: {
        scores,
        iterations,
        dampingFactor,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Calculate Conclusion Score
app.post('/api/conclusion-score', (req, res) => {
  try {
    const { arguments: args } = req.body;

    if (!args || !Array.isArray(args)) {
      return res.status(400).json({
        success: false,
        error: 'Arguments array is required',
      });
    }

    const score = calculateConclusionScore(args);

    res.json({
      success: true,
      data: {
        conclusionScore: score,
        argumentCount: args.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Example: Run ArgumentRank with sample data
app.get('/api/examples/argumentrank', (req, res) => {
  try {
    // Example argument linkage matrix
    const M = [
      [0, -0.5, 0, 0, 1],
      [0.5, 0, -0.5, 0, 0],
      [0.5, -0.5, 0, 0, 0],
      [0, 1, 0.5, 0, -1],
      [0, 0, 0.5, 1, 0],
    ];

    const scores = argumentrank(M, 100, 0.85);

    res.json({
      success: true,
      data: {
        matrix: M,
        scores,
        description: 'Example ArgumentRank calculation with sample adjacency matrix',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET  /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/beliefs',
      'GET  /api/beliefs/:id',
      'POST /api/beliefs',
      'PUT  /api/beliefs/:id',
      'DELETE /api/beliefs/:id',
      'GET  /api/beliefs/:id/arguments',
      'POST /api/arguments',
      'PUT  /api/arguments/:id',
      'DELETE /api/arguments/:id',
      'POST /api/arguments/:id/vote',
      'GET  /api/evidence',
      'POST /api/evidence',
      'POST /api/evidence/:id/verify',
      'POST /api/argumentrank',
      'POST /api/conclusion-score',
      'GET  /api/examples/argumentrank',
      'GET  /api/conflicts',
      'GET  /api/conflicts/:id',
      'POST /api/conflicts/detect/:beliefId',
      'POST /api/conflicts/create/:beliefId',
      'GET  /api/conflicts/:id/suggestions',
      'PUT  /api/conflicts/:id/advance',
      'POST /api/conflicts/:id/communicate',
      'POST /api/conflicts/:id/propose-solution',
      'PUT  /api/conflicts/:id/resolve',
      'POST /api/methodology-challenges',
      'GET  /api/methodology-challenges/:id',
      'GET  /api/methodology-challenges/evidence/:evidenceId',
      'POST /api/methodology-challenges/:id/evaluate',
      'POST /api/methodology-challenges/:id/respond',
      'POST /api/methodology-challenges/:id/evaluate-response',
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 Idea Stock Exchange API Server');
  console.log('='.repeat(70));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(70));
  console.log('\n📋 Authentication Endpoints:');
  console.log('  POST /api/auth/register - Register new user');
  console.log('  POST /api/auth/login    - Login user');
  console.log('  GET  /api/auth/me       - Get current user');
  console.log('\n💡 Belief Endpoints:');
  console.log('  GET    /api/beliefs           - Get all beliefs');
  console.log('  GET    /api/beliefs/:id       - Get specific belief');
  console.log('  POST   /api/beliefs           - Create new belief');
  console.log('  PUT    /api/beliefs/:id       - Update belief');
  console.log('  DELETE /api/beliefs/:id       - Delete belief');
  console.log('\n🔄 Argument Endpoints:');
  console.log('  POST   /api/arguments         - Create argument');
  console.log('  PUT    /api/arguments/:id     - Update argument');
  console.log('  DELETE /api/arguments/:id     - Delete argument');
  console.log('  POST   /api/arguments/:id/vote - Vote on argument');
  console.log('\n📚 Evidence Endpoints:');
  console.log('  GET  /api/evidence            - Get all evidence');
  console.log('  POST /api/evidence            - Create evidence');
  console.log('  POST /api/evidence/:id/verify - Verify evidence');
  console.log('\n🧮 Algorithm Endpoints:');
  console.log('  POST /api/argumentrank        - Calculate ArgumentRank');
  console.log('  POST /api/conclusion-score    - Calculate Conclusion Score');
  console.log('  GET  /api/examples/argumentrank - Example calculation');
  console.log('\n🤝 Conflict Resolution Endpoints:');
  console.log('  GET  /api/conflicts           - Get all conflicts');
  console.log('  GET  /api/conflicts/:id       - Get conflict details');
  console.log('  POST /api/conflicts/detect/:beliefId - Detect conflict');
  console.log('  POST /api/conflicts/create/:beliefId - Create resolution workflow');
  console.log('  GET  /api/conflicts/:id/suggestions  - Get resolution suggestions');
  console.log('  PUT  /api/conflicts/:id/advance      - Advance workflow');
  console.log('  POST /api/conflicts/:id/communicate  - Add communication');
  console.log('  POST /api/conflicts/:id/propose-solution - Propose solution');
  console.log('  PUT  /api/conflicts/:id/resolve      - Mark as resolved');
  console.log('\n🔬 Evidence Quality Scoring Endpoints:');
  console.log('  POST /api/methodology-challenges     - Submit methodology challenge');
  console.log('  GET  /api/methodology-challenges/:id - Get challenge details');
  console.log('  GET  /api/methodology-challenges/evidence/:evidenceId - Get challenges for evidence');
  console.log('  POST /api/methodology-challenges/:id/evaluate - Evaluate challenge');
  console.log('  POST /api/methodology-challenges/:id/respond - Respond to challenge');
  console.log('='.repeat(70));
});

export default app;
