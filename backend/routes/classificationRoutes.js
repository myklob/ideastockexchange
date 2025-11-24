/**
 * Classification Routes
 *
 * API routes for belief classification, hierarchy management, export, and analysis
 */

import express from 'express';
import {
  classifyBeliefById,
  classifyMultipleBeliefs,
  getHierarchies,
  getBeliefsByLevel,
  getDistribution,
  getBeliefSpectrum,
  getRelatedBeliefs,
  exportBeliefJSON,
  exportBeliefXMLEndpoint,
  exportISETemplate,
  exportTopicData,
  extractSubArguments,
  analyzeStructure,
  identifyIssues,
  getBeliefClassificationSummary,
} from '../controllers/classificationController.js';

const router = express.Router();

// Classification endpoints
router.post('/classify/:beliefId', classifyBeliefById);
router.post('/classify-batch', classifyMultipleBeliefs);

// Hierarchy endpoints
router.get('/hierarchies', getHierarchies);
router.get('/spectrum/:spectrum/:levelId', getBeliefsByLevel);
router.get('/distribution/:topicId/:spectrum', getDistribution);
router.get('/spectrum/:topicId/:spectrum', getBeliefSpectrum);
router.get('/related/:beliefId', getRelatedBeliefs);

// Export endpoints
router.get('/export/:beliefId', exportBeliefJSON);
router.get('/export/:beliefId/xml', exportBeliefXMLEndpoint);
router.get('/export/:beliefId/ise-template', exportISETemplate);
router.get('/export/topic/:topicId', exportTopicData);

// Sub-argument extraction
router.post('/extract-subarguments/:argumentId', extractSubArguments);
router.post('/analyze-structure/:argumentId', analyzeStructure);

// Issue identification
router.post('/identify-issues/:beliefId', identifyIssues);

// Summary
router.get('/belief/:beliefId/summary', getBeliefClassificationSummary);

export default router;
