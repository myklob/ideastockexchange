import express from 'express';
import {
  getCurrentSubscription,
  getPlans,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPaymentMethods,
  createSetupIntentEndpoint,
  getSubscriptionAnalytics
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get available plans (public info)
router.get('/plans', getPlans);

// Get current user's subscription
router.get('/current', getCurrentSubscription);

// Create or upgrade subscription
router.post('/subscribe', createSubscription);

// Cancel subscription
router.post('/cancel', cancelSubscription);

// Reactivate subscription
router.post('/reactivate', reactivateSubscription);

// Payment methods
router.get('/payment-methods', getPaymentMethods);
router.post('/setup-intent', createSetupIntentEndpoint);

// Analytics
router.get('/analytics', getSubscriptionAnalytics);

export default router;
