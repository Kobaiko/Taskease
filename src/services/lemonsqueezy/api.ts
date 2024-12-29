import { API_URL, API_HEADERS, getAuthHeader } from './config';
import { validateEnvironment, validateCheckoutResponse } from './validation';
import type { CheckoutResponse } from './types';

export async function createCheckout(
  variantId: string,
  email: string
): Promise<string> {
  try {
    const { apiKey, storeId } = validateEnvironment(
      import.meta.env.VITE_LEMONSQUEEZY_API_KEY,
      import.meta.env.VITE_LEMONSQUEEZY_STORE_ID
    );

    const storeSlug = import.meta.env.VITE_LEMONSQUEEZY_STORE_SLUG;
    if (!storeSlug) {
      throw new Error('Missing Lemon Squeezy store slug');
    }

    // Build checkout URL with parameters
    const checkoutUrl = new URL(`https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}`);
    
    // Add required parameters
    checkoutUrl.searchParams.append('checkout[email]', email);
    checkoutUrl.searchParams.append('checkout[custom][user_email]', email);
    checkoutUrl.searchParams.append('dark', document.documentElement.classList.contains('dark').toString());
    checkoutUrl.searchParams.append('embed', '1');
    checkoutUrl.searchParams.append('media', '0');
    checkoutUrl.searchParams.append('success_url', `${window.location.origin}/dashboard?success=true`);
    checkoutUrl.searchParams.append('cancel_url', `${window.location.origin}/pricing?canceled=true`);

    return checkoutUrl.toString();
  } catch (error) {
    console.error('Lemonsqueezy API error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create checkout. Please try again.');
  }
}