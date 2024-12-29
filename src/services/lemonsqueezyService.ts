import { createCheckout as createLemonsqueezyCheckout } from './lemonsqueezy/api';

export async function createCheckout(variantId: string, email: string): Promise<string> {
  try {
    return await createLemonsqueezyCheckout(variantId, email);
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw new Error('Failed to create checkout. Please try again.');
  }
}