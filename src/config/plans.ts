export const STORE_ID = '142541';

// Product IDs
export const PRODUCT_IDS = {
  monthly: '417921',
  yearly: '417923'
} as const;

// Variant IDs for test mode
export const VARIANT_IDS = {
  monthly: '419456', // Test mode variant ID for monthly plan
  yearly: '419460'   // Test mode variant ID for yearly plan
} as const;

export const PLANS = {
  monthly: {
    id: 'monthly-plan',
    name: 'Monthly',
    price: 9.99,
    interval: 'monthly' as const,
    variantId: VARIANT_IDS.monthly,
    productId: PRODUCT_IDS.monthly,
    features: [
      '150 tasks per month',
      'AI-powered task breakdown',
      'Unlimited subtasks',
      'Priority support',
      'Cancel anytime'
    ]
  },
  yearly: {
    id: 'yearly-plan',
    name: 'Yearly',
    price: 99.99,
    interval: 'yearly' as const,
    variantId: VARIANT_IDS.yearly,
    productId: PRODUCT_IDS.yearly,
    features: [
      'Everything in Monthly',
      '17% discount',
      '150 tasks per month',
      'AI-powered task breakdown',
      'Unlimited subtasks',
      'Priority support'
    ]
  }
} as const;