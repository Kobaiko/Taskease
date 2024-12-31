import { Handler } from '@netlify/functions';
import { API_URL } from '../../../src/services/lemonsqueezy/config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestData = JSON.parse(event.body || '');
    const { variantId, email } = requestData;
    
    if (!variantId || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const apiKey = process.env.VITE_LEMONSQUEEZY_API_KEY;
    const storeId = process.env.VITE_LEMONSQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      throw new Error('Missing Lemon Squeezy configuration');
    }

    const baseUrl = process.env.URL || 'http://localhost:8888';

    const response = await fetch(`${API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: null,
            checkout_data: {
              email,
              custom: {
                user_email: email
              }
            },
            checkout_options: {
              dark: true,
              success_url: `${baseUrl}/dashboard?success=true`,
              cancel_url: `${baseUrl}/pricing`
            }
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId }
            },
            variant: {
              data: { type: 'variants', id: variantId }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lemon Squeezy API error:', errorData);
      throw new Error(
        errorData.errors?.[0]?.detail || 'Failed to create checkout'
      );
    }

    const data = await response.json();
    const checkoutUrl = data?.data?.attributes?.url;

    if (!checkoutUrl) {
      throw new Error('Invalid response: Missing checkout URL');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ url: checkoutUrl })
    };

  } catch (error) {
    console.error('Checkout creation error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create checkout'
      })
    };
  }
};