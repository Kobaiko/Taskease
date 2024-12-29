import type { Subscription } from '../types/subscription';

const API_KEY = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
const STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
const API_URL = 'https://api.lemonsqueezy.com/v1';

function validateConfig() {
  console.log('Environment check:', {
    hasApiKey: !!API_KEY,
    hasStoreId: !!STORE_ID,
    apiKeyType: typeof API_KEY,
    storeIdType: typeof STORE_ID
  });

  if (!API_KEY) throw new Error('Lemonsqueezy API key is not configured');
  if (!STORE_ID) throw new Error('Lemonsqueezy store ID is not configured');
}

export async function createCheckout(variantId: string, email: string): Promise<string> {
  try {
    validateConfig();

    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          store_id: parseInt(STORE_ID),
          variant_id: parseInt(variantId),
          custom_price: null,
          product_options: {
            name: null,
            description: null,
            media: null,
            redirect_url: `${window.location.origin}/dashboard`,
            receipt_thank_you_note: 'Thank you for subscribing to TaskEase!',
            receipt_link_url: `${window.location.origin}/dashboard`,
            receipt_button_text: 'Go to Dashboard',
            enabled_variants: null
          },
          checkout_options: {
            dark: document.documentElement.classList.contains('dark'),
            custom_fields: null
          },
          checkout_data: {
            email,
            custom: {
              user_id: email
            }
          },
          expires_at: null
        }
      }
    };

    console.log('Creating checkout with data:', {
      url: `${API_URL}/checkouts`,
      variantId,
      storeId: STORE_ID
    });

    const response = await fetch(`${API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
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
    throw error;
  }
}