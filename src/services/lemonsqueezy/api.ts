import { API_URL } from './config';
import { validateCheckoutResponse } from './validation';

export async function createCheckout(variantId: string, email: string): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ variantId, email })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error('Server error: ' + errorText);
      }
      throw new Error(errorData.error || 'Failed to create checkout');
    }

    const data = await response.json();
    return validateCheckoutResponse(data);
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error instanceof Error ? error : new Error('Failed to create checkout');
  }
}