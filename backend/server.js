import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import xml2js from 'xml2js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

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
 * CS = ((RtA - RtD) � ES � LC � VC � LR � UD � AI)
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
// SAMPLE DATA
// ============================================================================

const sampleBeliefs = [
  {
    id: 1,
    statement: "Renewable energy is more cost-effective than fossil fuels in the long term",
    score: 85,
    arguments: {
      supporting: [
        {
          id: 101,
          content: "Solar and wind costs have decreased by 89% and 70% respectively since 2010",
          scores: {
            overall: 92,
            logical: 95,
            linkage: 88,
            importance: 93,
          },
        },
        {
          id: 102,
          content: "Renewable energy sources have minimal operating costs after installation",
          scores: {
            overall: 85,
            logical: 87,
            linkage: 82,
            importance: 86,
          },
        },
        {
          id: 103,
          content: "Government subsidies and tax incentives reduce upfront costs significantly",
          scores: {
            overall: 78,
            logical: 80,
            linkage: 75,
            importance: 79,
          },
        },
      ],
      opposing: [
        {
          id: 201,
          content: "Initial infrastructure costs for renewable energy remain prohibitively high",
          scores: {
            overall: 72,
            logical: 75,
            linkage: 70,
            importance: 71,
          },
        },
        {
          id: 202,
          content: "Energy storage solutions are still expensive and inefficient",
          scores: {
            overall: 68,
            logical: 70,
            linkage: 65,
            importance: 69,
          },
        },
      ],
    },
  },
  {
    id: 2,
    statement: "Remote work increases employee productivity",
    score: 73,
    arguments: {
      supporting: [
        {
          id: 301,
          content: "Studies show 13% productivity increase for remote workers",
          scores: {
            overall: 88,
            logical: 90,
            linkage: 85,
            importance: 89,
          },
        },
        {
          id: 302,
          content: "Reduced commute time allows for more focused work hours",
          scores: {
            overall: 81,
            logical: 83,
            linkage: 78,
            importance: 82,
          },
        },
      ],
      opposing: [
        {
          id: 401,
          content: "Collaboration and communication challenges reduce team efficiency",
          scores: {
            overall: 76,
            logical: 78,
            linkage: 73,
            importance: 77,
          },
        },
        {
          id: 402,
          content: "Home distractions can significantly impact individual productivity",
          scores: {
            overall: 71,
            logical: 73,
            linkage: 68,
            importance: 72,
          },
        },
        {
          id: 403,
          content: "Lack of supervision may lead to decreased work quality",
          scores: {
            overall: 65,
            logical: 67,
            linkage: 62,
            importance: 66,
          },
        },
      ],
    },
  },
];

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Idea Stock Exchange API is running',
    timestamp: new Date().toISOString()
  });
});

// Get all beliefs
app.get('/api/beliefs', (req, res) => {
  try {
    const beliefs = sampleBeliefs.map(belief => ({
      id: belief.id,
      statement: belief.statement,
      score: belief.score,
      supportingCount: belief.arguments.supporting.length,
      opposingCount: belief.arguments.opposing.length,
    }));

    res.json({
      success: true,
      data: beliefs,
      count: beliefs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get a specific belief by ID
app.get('/api/beliefs/:id', (req, res) => {
  try {
    const beliefId = parseInt(req.params.id);
    const belief = sampleBeliefs.find(b => b.id === beliefId);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    res.json({
      success: true,
      data: belief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get arguments for a specific belief
app.get('/api/beliefs/:id/arguments', (req, res) => {
  try {
    const beliefId = parseInt(req.params.id);
    const belief = sampleBeliefs.find(b => b.id === beliefId);

    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found',
      });
    }

    res.json({
      success: true,
      data: belief.arguments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
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

// Load XML belief data
app.get('/api/xml/beliefs', async (req, res) => {
  try {
    const xmlPath = join(__dirname, 'data', 'belief-analysis.xml');
    const xmlData = await fs.readFile(xmlPath, 'utf-8');

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Could not load XML data. File may not exist.',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/beliefs',
      'GET /api/beliefs/:id',
      'GET /api/beliefs/:id/arguments',
      'POST /api/argumentrank',
      'POST /api/conclusion-score',
      'GET /api/examples/argumentrank',
      'GET /api/xml/beliefs',
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
  console.log('='.repeat(60));
  console.log('=� Idea Stock Exchange API Server');
  console.log('='.repeat(60));
  console.log(`=� Server running on port ${PORT}`);
  console.log(`< API Base URL: http://localhost:${PORT}/api`);
  console.log(`=� Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
  console.log('\nAvailable Endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/beliefs');
  console.log('  GET  /api/beliefs/:id');
  console.log('  GET  /api/beliefs/:id/arguments');
  console.log('  POST /api/argumentrank');
  console.log('  POST /api/conclusion-score');
  console.log('  GET  /api/examples/argumentrank');
  console.log('  GET  /api/xml/beliefs');
  console.log('='.repeat(60));
});

export default app;
