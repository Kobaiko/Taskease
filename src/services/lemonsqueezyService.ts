import axios, { AxiosError } from 'axios';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

// Log the API key presence and first few characters (safely)
const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API;
const formattedApiKey = apiKey?.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;

console.log('API Key Info:', {
  present: !!apiKey,
  startsWithBearer: formattedApiKey.startsWith('Bearer'),
  length: apiKey?.length,
  firstChars: apiKey ? `${apiKey.slice(0, 6)}...` : 'none'
});

const api = axios.create({
  baseURL: LEMON_SQUEEZY_API_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': formattedApiKey
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
          message: error.message
        });
      }
      throw error;
    }
  },

  async createCheckout(variantId: string, email: string): Promise<string> {
    try {
      const storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
      
      if (!storeId) {
        throw new Error('Invalid store ID');
      }

      console.log('Creating checkout with:', { 
        storeId, 
        variantId, 
        email,
        apiKeyPresent: !!apiKey
      });
      
      const payload = {
        data: {
          type: "checkouts",
          attributes: {
            custom_price: null,
            product_options: {
              name: "TaskEase Subscription",
              description: "Subscription to TaskEase - AI Task Management",
              redirect_url: import.meta.env.PROD ? "https://app.gettaskease.com" : window.location.origin,
              receipt_button_text: "Go to TaskEase",
              receipt_thank_you_note: "Thank you for choosing TaskEase!"
            },
            checkout_data: {
              email: email,
              custom: {
                user_email: email
              }
            },
            test_mode: import.meta.env.DEV || false
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: storeId
              }
            },
            variant: {
              data: {
                type: "variants",
                id: variantId
              }
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
          message: error.message
        });
        
        if (error.response?.status === 422 && error.response?.data?.errors) {
          const validationErrors = error.response.data.errors
            .map((e: any) => `${e.source?.pointer}: ${e.detail}`)
            .join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
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
          message: error.message
        });
      }
      throw error;
    }
  }
};