import type { Subscription } from '../types/subscription';

const API_KEY = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
const STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
const API_URL = 'https://api.lemonsqueezy.com/v1';

function validateConfig() {
  const errors = [];
  
  if (!API_KEY || API_KEY === 'undefined') {
    errors.push('Lemonsqueezy API key is not configured');
  }
  
  if (!STORE_ID || STORE_ID === 'undefined') {
    errors.push('Lemonsqueezy store ID is not configured');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
}

export async function createCheckout(variantId: string, email: string): Promise<string> {
  try {
    validateConfig();

    const response = await fetch(`${API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            store_id: STORE_ID,
            product_options: {
              enabled_variants: [variantId],
              redirect_url: `${window.location.origin}/dashboard`,
              receipt_link_url: `${window.location.origin}/dashboard`,
              receipt_button_text: 'Go to Dashboard',
              receipt_thank_you_note: 'Thank you for subscribing to TaskEase!'
            },
            checkout_data: {
              email,
              custom: {
                user_id: email
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Lemonsqueezy API error:', error);
      throw new Error(error.message || 'Failed to create checkout');
    }

    const data = await response.json();
    return data.data.attributes.url;
  } catch (error) {
    console.error('Checkout creation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unable to create checkout session. Please try again later.');
  }
}