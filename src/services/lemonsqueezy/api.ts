import { API_URL, API_HEADERS } from './config';
import { validateEnvironment, validateCheckoutResponse } from './validation';
import type { CheckoutAttributes, CheckoutRelationships } from './types';

export async function createCheckout(
  variantId: string,
  email: string
): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ variantId, email })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Checkout API Error:', errorData);
      throw new Error(errorData.error || 'Failed to create checkout');
    }

    const data = await response.json();
    return validateCheckoutResponse(data);
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create checkout');
  }
}