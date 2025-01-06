import axios, { AxiosError } from 'axios';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

// Log the API key presence and first few characters (safely)
const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API;
console.log('API Key Info:', {
  present: !!apiKey,
  startsWithBearer: apiKey?.startsWith('Bearer'),
  length: apiKey?.length,
  firstChars: apiKey ? `${apiKey.slice(0, 6)}...` : 'none'
});

const api = axios.create({
  baseURL: LEMON_SQUEEZY_API_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${apiKey}`
  }
});

export interface Variant {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export const lemonSqueezyService = {
  async getVariants(): Promise<Variant[]> {
    try {
      const response = await api.get('/variants');
      return response.data.data.map((variant: any) => ({
        id: variant.id,
        name: variant.attributes.name,
        price: variant.attributes.price / 100,
        description: variant.attributes.description
      }));
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error fetching variants:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          headers: {
            sent: error.config?.headers,
            received: error.response?.headers
          }
        });
      }
      throw error;
    }
  },

  async createCheckout(variantId: string, email: string): Promise<string> {
    try {
      const storeId = parseInt(import.meta.env.VITE_LEMONSQUEEZY_STORE_ID);
      
      if (!storeId || isNaN(storeId)) {
        throw new Error('Invalid store ID');
      }

      console.log('Creating checkout with:', { 
        storeId, 
        variantId, 
        email,
        apiKeyPresent: !!apiKey,
        apiKeyFormat: apiKey?.startsWith('Bearer') ? 'Starts with Bearer' : 'Invalid format'
      });
      
      const payload = {
        data: {
          type: 'checkouts',
          attributes: {
            store_id: storeId,
            variant_id: parseInt(variantId),
            custom_price: null,
            product_options: {
              enabled: true,
              name: "TaskEase Subscription",
              description: "Access to TaskEase premium features",
              media: [],
              redirect_url: `${window.location.origin}/dashboard`,
              receipt_link_url: `${window.location.origin}/dashboard`,
              receipt_button_text: "Access Dashboard",
              receipt_thank_you_note: "Thank you for choosing TaskEase!",
              customer_email: email
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
              desc: true,
              discount: true,
              dark: false,
              subscription_preview: true,
              button_color: "#7C3AED"
            }
          }
        }
      };

      console.log('Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/checkouts', payload);
      return response.data.data.attributes.url;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Checkout creation failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          headers: {
            sent: error.config?.headers,
            received: error.response?.headers
          }
        });
        
        // If it's a validation error (422), show the specific validation errors
        if (error.response?.status === 422 && error.response?.data?.errors) {
          const validationErrors = error.response.data.errors
            .map((e: any) => `${e.source?.pointer}: ${e.detail}`)
            .join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
      } else {
        console.error('Non-Axios error:', error);
      }
      throw error;
    }
  },

  async getSubscription(subscriptionId: string) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error fetching subscription:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          headers: {
            sent: error.config?.headers,
            received: error.response?.headers
          }
        });
      }
      throw error;
    }
  }
};