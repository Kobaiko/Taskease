import type { CheckoutSuccessData } from '../types/lemonsqueezy';

let isInitialized = false;

export async function initializeLemonSqueezy() {
  if (isInitialized) return;

  return new Promise<void>((resolve, reject) => {
    try {
      if (window.LemonSqueezy) {
        setupEventHandlers();
        isInitialized = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setupEventHandlers();
        isInitialized = true;
        resolve();
      };

      script.onerror = (error) => {
        console.error('Failed to load Lemon Squeezy script:', error);
        reject(new Error('Failed to load Lemon Squeezy script'));
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error initializing Lemon Squeezy:', error);
      reject(error);
    }
  });
}

function setupEventHandlers() {
  window.LemonSqueezy?.Setup({
    eventHandler: (data: { event: string; data?: CheckoutSuccessData }) => {
      switch (data.event) {
        case 'Checkout.Success':
          if (data.data) {
            handleCheckoutSuccess(data.data);
          }
          break;
      }
    }
  });
}

async function handleCheckoutSuccess(data: CheckoutSuccessData) {
  try {
    // Store the order data temporarily
    sessionStorage.setItem('checkoutSuccess', JSON.stringify(data));
    // Redirect to dashboard with success message
    window.location.href = '/dashboard?success=true';
  } catch (error) {
    console.error('Error handling checkout success:', error);
  }
}

export async function openCheckout(checkoutUrl: string): Promise<void> {
  try {
    await initializeLemonSqueezy();
    window.LemonSqueezy?.Url.Open(checkoutUrl);
  } catch (error) {
    console.error('Error opening checkout:', error);
    // Fallback to direct URL if SDK fails
    window.open(checkoutUrl, '_blank');
  }
}