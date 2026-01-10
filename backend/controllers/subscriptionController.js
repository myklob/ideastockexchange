import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import {
  SUBSCRIPTION_PLANS,
  createStripeCustomer,
  createStripeSubscription,
  cancelStripeSubscription,
  updateStripeSubscription,
  createSetupIntent,
  getCustomerPaymentMethods
} from '../config/stripe.js';

// Get current user's subscription
export const getCurrentSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user.id });

    // Create free subscription if none exists
    if (!subscription) {
      subscription = await Subscription.createFreeSubscription(req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        subscription: subscription._id
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all available plans
export const getPlans = async (req, res) => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      description: plan.description
    }));

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create or upgrade subscription
export const createSubscription = async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;

    // Validate plan
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    let subscription = await Subscription.findOne({ user: req.user.id });

    // Free plan - no payment needed
    if (planId === 'free') {
      if (subscription) {
        // Cancel existing Stripe subscription if any
        if (subscription.stripeSubscriptionId) {
          await cancelStripeSubscription(subscription.stripeSubscriptionId, false);
        }

        subscription.plan = 'free';
        subscription.status = 'active';
        subscription.features = plan.features;
        subscription.amount = 0;
        subscription.stripeSubscriptionId = null;
        subscription.stripePaymentMethodId = null;
        await subscription.save();
      } else {
        subscription = await Subscription.createFreeSubscription(req.user.id);
        await User.findByIdAndUpdate(req.user.id, {
          subscription: subscription._id
        });
      }

      return res.json({
        success: true,
        data: {
          subscription,
          requiresPayment: false
        }
      });
    }

    // Paid plans - need Stripe integration
    if (!plan.stripePriceId) {
      return res.status(400).json({
        success: false,
        error: 'Stripe price ID not configured for this plan'
      });
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer(
        user.email,
        user.username,
        { userId: user._id.toString() }
      );
      stripeCustomerId = stripeCustomer.id;
    }

    // Create or update Stripe subscription
    let stripeSubscription;
    if (subscription?.stripeSubscriptionId) {
      // Update existing subscription
      stripeSubscription = await updateStripeSubscription(
        subscription.stripeSubscriptionId,
        plan.stripePriceId
      );
    } else {
      // Create new subscription
      stripeSubscription = await createStripeSubscription(
        stripeCustomerId,
        plan.stripePriceId,
        { userId: user._id.toString(), planId }
      );
    }

    // Update or create subscription record
    const subscriptionData = {
      plan: planId,
      status: stripeSubscription.status,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePaymentMethodId: paymentMethodId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      amount: plan.price,
      currency: 'usd',
      interval: plan.interval,
      features: plan.features
    };

    if (subscription) {
      Object.assign(subscription, subscriptionData);
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        user: req.user.id,
        ...subscriptionData
      });

      await User.findByIdAndUpdate(req.user.id, {
        subscription: subscription._id
      });
    }

    // Create transaction record
    await Transaction.create({
      user: req.user.id,
      type: 'subscription_payment',
      amount: plan.price,
      currency: 'usd',
      status: stripeSubscription.status === 'active' ? 'completed' : 'pending',
      description: `${plan.name} subscription`,
      relatedSubscription: subscription._id,
      stripePaymentIntentId: stripeSubscription.latest_invoice?.payment_intent?.id
    });

    res.json({
      success: true,
      data: {
        subscription,
        clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret,
        requiresPayment: stripeSubscription.status !== 'active'
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    if (subscription.plan === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel free subscription'
      });
    }

    // Cancel Stripe subscription
    if (subscription.stripeSubscriptionId) {
      await cancelStripeSubscription(subscription.stripeSubscriptionId, cancelAtPeriodEnd);
    }

    if (cancelAtPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
      subscription.cancelledAt = new Date();
    } else {
      subscription.status = 'cancelled';
      subscription.plan = 'free';
      subscription.features = SUBSCRIPTION_PLANS.free.features;
    }

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: cancelAtPeriodEnd
        ? 'Subscription will be cancelled at the end of the billing period'
        : 'Subscription cancelled immediately'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reactivate cancelled subscription
export const reactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is not scheduled for cancellation'
      });
    }

    // Reactivate Stripe subscription
    if (subscription.stripeSubscriptionId) {
      const stripeSubscription = await updateStripeSubscription(
        subscription.stripeSubscriptionId,
        SUBSCRIPTION_PLANS[subscription.plan].stripePriceId
      );

      subscription.cancelAtPeriodEnd = false;
      subscription.cancelledAt = null;
      subscription.status = stripeSubscription.status;
      await subscription.save();
    }

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription || !subscription.stripeCustomerId) {
      return res.json({
        success: true,
        data: []
      });
    }

    const paymentMethods = await getCustomerPaymentMethods(subscription.stripeCustomerId);

    res.json({
      success: true,
      data: paymentMethods.data
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create setup intent for adding payment method
export const createSetupIntentEndpoint = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let subscription = await Subscription.findOne({ user: req.user.id });

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer(
        user.email,
        user.username,
        { userId: user._id.toString() }
      );
      stripeCustomerId = stripeCustomer.id;

      if (subscription) {
        subscription.stripeCustomerId = stripeCustomerId;
        await subscription.save();
      }
    }

    const setupIntent = await createSetupIntent(stripeCustomerId);

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret
      }
    });
  } catch (error) {
    console.error('Create setup intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get subscription usage/analytics
export const getSubscriptionAnalytics = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    // Get transaction history for this subscription
    const transactions = await Transaction.find({
      user: req.user.id,
      relatedSubscription: subscription._id
    }).sort({ createdAt: -1 }).limit(10);

    // Calculate analytics
    const analytics = {
      currentPlan: subscription.plan,
      status: subscription.status,
      daysUntilRenewal: subscription.daysUntilRenewal(),
      features: subscription.features,
      totalSpent: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      recentTransactions: transactions
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
