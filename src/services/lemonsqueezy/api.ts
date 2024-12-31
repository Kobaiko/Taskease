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

    const response = await fetch(`${API_URL}/v1/checkouts`, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        Authorization: `Bearer ${apiKey}`
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
            product_options: {
              redirect_url: `${window.location.origin}/dashboard`,
              receipt_link_url: `${window.location.origin}/dashboard`,
              receipt_button_text: 'Return to Dashboard'
            },
            checkout_options: {
              dark: document.documentElement.classList.contains('dark')
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
      const errorData = await response.json();
      console.error('Lemon Squeezy API Error:', errorData);
      throw new Error(errorData.errors?.[0]?.detail || 'Failed to create checkout');
    }

    const data = await response.json();
    return validateCheckoutResponse(data);
  } catch (error) {
    console.error('Lemonsqueezy API error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create checkout. Please try again.');
  }
}