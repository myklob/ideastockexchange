import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: STRIPE_SECRET_KEY is not set. Payments will not work.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16'
}) : null;

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    stripePriceId: null,
    price: 0,
    interval: 'month',
    features: {
      adFree: false,
      advancedMatching: false,
      premiumAnalytics: false,
      apiAccess: false,
      apiRateLimit: 100,
      virtualCurrencyBonus: 1000,
      prioritySupport: false,
      customBranding: false
    },
    description: 'Basic access to all core features'
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    price: 999, // $9.99
    interval: 'month',
    features: {
      adFree: true,
      advancedMatching: true,
      premiumAnalytics: true,
      apiAccess: true,
      apiRateLimit: 1000,
      virtualCurrencyBonus: 10000,
      prioritySupport: true,
      customBranding: false
    },
    description: 'Ad-free experience with advanced matching and analytics'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    price: 9999, // $99.99
    interval: 'month',
    features: {
      adFree: true,
      advancedMatching: true,
      premiumAnalytics: true,
      apiAccess: true,
      apiRateLimit: 10000,
      virtualCurrencyBonus: 100000,
      prioritySupport: true,
      customBranding: true
    },
    description: 'Full platform access with API integration and custom branding'
  }
};

// Helper function to create a Stripe customer
export async function createStripeCustomer(email, name, metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return await stripe.customers.create({
    email,
    name,
    metadata
  });
}

// Helper function to create a subscription
export async function createStripeSubscription(customerId, priceId, metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata
  });
}

// Helper function to cancel a subscription
export async function cancelStripeSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

// Helper function to update a subscription
export async function updateStripeSubscription(subscriptionId, priceId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId
    }],
    proration_behavior: 'create_prorations'
  });
}

// Helper function to create a payment intent
export async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true
    }
  });
}

// Helper function to create a setup intent (for saving payment methods)
export async function createSetupIntent(customerId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return await stripe.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: {
      enabled: true
    }
  });
}

// Helper function to get payment methods for a customer
export async function getCustomerPaymentMethods(customerId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card'
  });
}

// Webhook signature verification
export function constructWebhookEvent(payload, signature, webhookSecret) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export default stripe;
