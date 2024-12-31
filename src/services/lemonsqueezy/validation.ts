export function validateEnvironment(apiKey?: string, storeId?: string) {
  if (!apiKey) {
    throw new Error('Missing Lemon Squeezy API key. Please check your environment variables.');
  }

  if (!storeId) {
    throw new Error('Missing Lemon Squeezy store ID. Please check your environment variables.');
  }

  return { apiKey, storeId };
}

export function validateCheckoutResponse(data: any): string {
  if (!data?.data?.attributes?.url) {
    console.error('Invalid checkout response:', data);
    throw new Error('Invalid response from Lemon Squeezy: Missing checkout URL');
  }

  return data.data.attributes.url;
}