export const API_URL = 'https://api.lemonsqueezy.com/v1';

export const API_HEADERS = {
  'Accept': 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json'
};

export function getAuthHeader(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`
  };
}

export function validateStoreConfig() {
  const storeSlug = import.meta.env.VITE_LEMONSQUEEZY_STORE_SLUG;
  const apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
  const storeId = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;

  if (!storeSlug || !apiKey || !storeId) {
    throw new Error('Missing Lemon Squeezy configuration. Please check your environment variables.');
  }

  return { storeSlug, apiKey, storeId };
}