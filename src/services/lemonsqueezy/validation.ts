export function validateEnvironment(apiKey?: string, storeId?: string) {
  if (!apiKey) {
    throw new Error('Missing Lemon Squeezy API key. Please check your environment configuration.');
  }

  if (!storeId) {
    throw new Error('Missing Lemon Squeezy store ID. Please check your environment configuration.');
  }

  return {
    apiKey,
    storeId
  };
}

export function validateCheckoutResponse(data: any): string {
  if (!data?.data?.attributes?.url) {
    console.error('Invalid checkout response:', data);
    throw new Error('Invalid response from Lemon Squeezy. Please try again.');
  }

  return data.data.attributes.url;
}