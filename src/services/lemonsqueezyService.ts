import axios from 'axios';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

const api = axios.create({
  baseURL: LEMON_SQUEEZY_API_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${import.meta.env.VIT_LEMONSQUEEZY_API}`
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
        price: variant.attributes.price / 100, // Convert cents to dollars
        description: variant.attributes.description
      }));
    } catch (error) {
      console.error('Error fetching variants:', error);
      throw error;
    }
  },

  async createCheckout(variantId: string, email: string): Promise<string> {
    try {
      const storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
      const response = await api.post('/checkouts', {
        data: {
          type: 'checkouts',
          attributes: {
            store_id: storeId,
            variant_id: variantId,
            custom_price: null,
            product_options: {
              enabled: true,
              customer_email: email,
              receipt_thank_you_note: "Thank you for choosing TaskEase!",
              redirect_url: `${window.location.origin}/dashboard`
            }
          }
        }
      });
      
      return response.data.data.attributes.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  },

  async getSubscription(subscriptionId: string) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }
};