export const VARIANT_IDS = {
  monthly: '417921',  // Monthly plan variant ID
  yearly: '417923'    // Yearly plan variant ID
} as const;

export const PLANS = {
  monthly: {
    id: 'monthly-plan',
    name: 'Monthly',
    price: 9.99,
    interval: 'monthly' as const,
    variantId: VARIANT_IDS.monthly,
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