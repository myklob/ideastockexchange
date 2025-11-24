/**
 * Claims API Routes
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Claim = require('../models/Claim');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/claims
 * Get all claims or search claims
 */
router.get('/',
  query('search').optional().trim(),
  query('category').optional().trim(),
  validate,
  (req, res, next) => {
    try {
      const { search, category } = req.query;

      let claims;
      if (search) {
        claims = Claim.search(search);
      } else if (category) {
        claims = Claim.getByCategory(category);
      } else {
        claims = Claim.getAll();
      }

      res.json({
        success: true,
        count: claims.length,
        claims
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/claims/stats
 * Get claims statistics
 */
router.get('/stats', (req, res, next) => {
  try {
    const stats = Claim.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/claims/categories
 * Get all claim categories
 */
router.get('/categories', (req, res, next) => {
  try {
    const categories = Claim.getCategories();
    res.json({
      success: true,
      categories: categories.map(c => c.category)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/claims/:id
 * Get a single claim by ID
 */
router.get('/:id',
  param('id').trim().notEmpty(),
  validate,
  (req, res, next) => {
    try {
      const claim = Claim.getById(req.params.id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          error: 'Claim not found'
        });
      }

      res.json({
        success: true,
        claim
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/claims
 * Create a new claim
 */
router.post('/',
  body('id').trim().notEmpty().withMessage('ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('url').trim().isURL().withMessage('Valid URL is required'),
  body('patterns').isArray({ min: 1 }).withMessage('At least one pattern is required'),
  body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
  body('reasonsFor').optional().isInt({ min: 0 }),
  body('reasonsAgainst').optional().isInt({ min: 0 }),
  body('evidenceScore').isFloat({ min: 0, max: 1 }).withMessage('Evidence score must be between 0 and 1'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  validate,
  (req, res, next) => {
    try {
      const claim = Claim.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Claim created successfully',
        claim
      });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return res.status(409).json({
          success: false,
          error: 'Claim with this ID already exists'
        });
      }
      next(error);
    }
  }
);

/**
 * PUT /api/claims/:id
 * Update a claim
 */
router.put('/:id',
  param('id').trim().notEmpty(),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('url').optional().trim().isURL(),
  body('patterns').optional().isArray({ min: 1 }),
  body('confidence').optional().isFloat({ min: 0, max: 1 }),
  body('reasonsFor').optional().isInt({ min: 0 }),
  body('reasonsAgainst').optional().isInt({ min: 0 }),
  body('evidenceScore').optional().isFloat({ min: 0, max: 1 }),
  body('category').optional().trim().notEmpty(),
  validate,
  (req, res, next) => {
    try {
      const claim = Claim.getById(req.params.id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          error: 'Claim not found'
        });
      }

      const updatedClaim = Claim.update(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Claim updated successfully',
        claim: updatedClaim
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/claims/:id
 * Delete a claim
 */
router.delete('/:id',
  param('id').trim().notEmpty(),
  validate,
  (req, res, next) => {
    try {
      const deleted = Claim.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Claim not found'
        });
      }

      res.json({
        success: true,
        message: 'Claim deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/claims/:id/detect
 * Record a detection of this claim
 */
router.post('/:id/detect',
  param('id').trim().notEmpty(),
  body('url').optional().trim().isURL(),
  validate,
  (req, res, next) => {
    try {
      const claim = Claim.getById(req.params.id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          error: 'Claim not found'
        });
      }

      const userAgent = req.headers['user-agent'];
      Claim.recordDetection(req.params.id, req.body.url, userAgent);

      res.json({
        success: true,
        message: 'Detection recorded'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
