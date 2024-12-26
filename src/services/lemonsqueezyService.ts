import type { Subscription } from '../types/subscription';

const API_KEY = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
const API_URL = 'https://api.lemonsqueezy.com/v1';

export async function createCheckout(variantId: string, email: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Lemonsqueezy API key is not configured');
  }

  try {
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
      throw new Error(error.message || 'Failed to create checkout');
    }

    const data = await response.json();
    return data.data.attributes.url;
  } catch (error) {
    console.error('Checkout creation error:', error);
    throw new Error('Unable to create checkout session. Please try again later.');
  }
}