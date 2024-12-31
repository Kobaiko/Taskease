export function validateEnvironment(apiKey?: string, storeId?: string) {
  if (!apiKey) {
    throw new Error('Missing Lemon Squeezy API key');
  }

  if (!storeId) {
    throw new Error('Missing Lemon Squeezy store ID');
  }

  return {
    apiKey,
    storeId
  };
}

export function validateCheckoutResponse(data: any): string {
  if (!data?.data?.attributes?.url) {
    console.error('Invalid checkout response:', data);
    throw new Error('Invalid checkout response from Lemon Squeezy');
  }

  return data.data.attributes.url;
}