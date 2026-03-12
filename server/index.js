/**
 * ISE Stakeholder Analysis API Server
 * Port 3001 (React dev server proxies to this on port 3000)
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const stakeholderRoutes = require('./routes/stakeholders');
const interestRoutes    = require('./routes/interests');
const conflictRoutes    = require('./routes/conflicts');
const analysisRoutes    = require('./routes/analysis');

const app  = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API routes
app.use('/api/stakeholders', stakeholderRoutes);
app.use('/api/interests',    interestRoutes);
app.use('/api/conflicts',    conflictRoutes);
app.use('/api/analysis',     analysisRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`ISE API running on http://localhost:${PORT}`);
  console.log(`  GET /api/conflicts           — list all conflicts`);
  console.log(`  GET /api/analysis/conflict/CFL-001/full-profile — main analysis view`);
  console.log(`  GET /api/stakeholders        — list all stakeholders`);
  console.log(`  GET /api/interests           — list all interests`);
});

module.exports = app;
