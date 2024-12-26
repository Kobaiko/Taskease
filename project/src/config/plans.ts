export const STORE_ID = '142541';
export const VARIANT_IDS = {
  monthly: '419456',
  yearly: '419460'
} as const;

export const PLANS = {
  monthly: {
    id: 'monthly-plan',
    name: 'Monthly',
    price: 9.99,
    interval: 'monthly',
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
    interval: 'yearly',
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