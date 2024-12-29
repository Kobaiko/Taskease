import { API_URL, API_HEADERS, getAuthHeader } from './config';
import { validateEnvironment, validateCheckoutResponse } from './validation';
import type { CheckoutResponse } from './types';

export async function createCheckout(
  variantId: string,
  email: string
): Promise<string> {
  try {
    const { apiKey, storeId } = validateEnvironment(
      import.meta.env.VITE_LEMONSQUEEZY_API_KEY,
      import.meta.env.VITE_LEMONSQUEEZY_STORE_ID
    );

    const response = await fetch(`${API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        ...getAuthHeader(apiKey)
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email,
              custom: {
                user_email: email
              }
            },
            checkout_options: {
              dark: document.documentElement.classList.contains('dark'),
              success_url: `${window.location.origin}/dashboard?subscription=success`,
              cancel_url: `${window.location.origin}/pricing?subscription=canceled`
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout');
    }

    const data: CheckoutResponse = await response.json();
    return validateCheckoutResponse(data);
  } catch (error) {
    console.error('Lemonsqueezy API error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create checkout. Please try again.');
  }
}