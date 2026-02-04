import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'past_due', 'trialing'],
    default: 'active',
    required: true
  },
  // Stripe integration fields
  stripeCustomerId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true,
    index: true
  },
  stripePaymentMethodId: {
    type: String
  },
  // Billing cycle
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  // Pricing
  amount: {
    type: Number,
    default: 0 // in cents
  },
  currency: {
    type: String,
    default: 'usd'
  },
  interval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  // Trial
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  // Features
  features: {
    adFree: {
      type: Boolean,
      default: false
    },
    advancedMatching: {
      type: Boolean,
      default: false
    },
    premiumAnalytics: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    apiRateLimit: {
      type: Number,
      default: 100 // requests per hour
    },
    virtualCurrencyBonus: {
      type: Number,
      default: 0 // bonus virtual currency per month
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    }
  },
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });

// Methods
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' || this.status === 'trialing';
};

subscriptionSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

subscriptionSchema.methods.getFeatureValue = function(featureName) {
  return this.features[featureName];
};

subscriptionSchema.methods.isExpired = function() {
  return this.currentPeriodEnd && new Date() > this.currentPeriodEnd;
};

subscriptionSchema.methods.daysUntilRenewal = function() {
  if (!this.currentPeriodEnd) return null;
  const days = Math.ceil((this.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

// Static methods
subscriptionSchema.statics.getPlanFeatures = function(planName) {
  const plans = {
    free: {
      adFree: false,
      advancedMatching: false,
      premiumAnalytics: false,
      apiAccess: false,
      apiRateLimit: 100,
      virtualCurrencyBonus: 1000,
      prioritySupport: false,
      customBranding: false,
      price: 0,
      description: 'Basic access to all core features'
    },
    premium: {
      adFree: true,
      advancedMatching: true,
      premiumAnalytics: true,
      apiAccess: true,
      apiRateLimit: 1000,
      virtualCurrencyBonus: 10000,
      prioritySupport: true,
      customBranding: false,
      price: 999, // $9.99/month
      description: 'Ad-free experience with advanced matching and analytics'
    },
    enterprise: {
      adFree: true,
      advancedMatching: true,
      premiumAnalytics: true,
      apiAccess: true,
      apiRateLimit: 10000,
      virtualCurrencyBonus: 100000,
      prioritySupport: true,
      customBranding: true,
      price: 9999, // $99.99/month
      description: 'Full platform access with API integration and custom branding'
    }
  };
  return plans[planName] || plans.free;
};

subscriptionSchema.statics.createFreeSubscription = async function(userId) {
  const features = this.getPlanFeatures('free');
  return await this.create({
    user: userId,
    plan: 'free',
    status: 'active',
    features
  });
};

// Hooks
subscriptionSchema.pre('save', function(next) {
  // Auto-update features based on plan
  if (this.isModified('plan')) {
    const planFeatures = this.constructor.getPlanFeatures(this.plan);
    this.features = {
      adFree: planFeatures.adFree,
      advancedMatching: planFeatures.advancedMatching,
      premiumAnalytics: planFeatures.premiumAnalytics,
      apiAccess: planFeatures.apiAccess,
      apiRateLimit: planFeatures.apiRateLimit,
      virtualCurrencyBonus: planFeatures.virtualCurrencyBonus,
      prioritySupport: planFeatures.prioritySupport,
      customBranding: planFeatures.customBranding
    };
  }

  // Check if subscription should expire
  if (this.currentPeriodEnd && new Date() > this.currentPeriodEnd && this.status === 'active') {
    this.status = 'expired';
  }

  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
