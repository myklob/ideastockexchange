/**
 * IdeaStockExchange API Server
 * Main entry point for the backend API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const claimsRouter = require('./routes/claims');
const usersRouter = require('./routes/users');
const analyticsRouter = require('./routes/analytics');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Initialize database
initializeDatabase();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/claims', claimsRouter);
app.use('/api/users', usersRouter);
app.use('/api/analytics', analyticsRouter);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'IdeaStockExchange API',
    version: '1.0.0',
    description: 'Backend API for fact-checking claims and beliefs',
    endpoints: {
      claims: '/api/claims',
      users: '/api/users',
      analytics: '/api/analytics',
      health: '/health'
    },
    documentation: 'https://github.com/yourusername/ideastockexchange/blob/main/backend/README.md'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/api', '/health']
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║   IdeaStockExchange API Server                    ║
║                                                   ║
║   🚀 Server running on http://${HOST}:${PORT}     ║
║   📝 Environment: ${process.env.NODE_ENV || 'development'}                     ║
║   📊 API Docs: http://${HOST}:${PORT}/api          ║
║   ❤️  Health: http://${HOST}:${PORT}/health        ║
╚═══════════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
