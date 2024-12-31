import { Handler } from '@netlify/functions';
import { API_URL } from '../../../src/services/lemonsqueezy/config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

export const handler: Handler = async (event) => {
  // Handle preflight requests
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
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { variantId, email } = JSON.parse(event.body);
    const apiKey = process.env.VITE_LEMONSQUEEZY_API_KEY;
    const storeId = process.env.VITE_LEMONSQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      throw new Error('Missing required configuration');
    }

    if (!variantId || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

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
            checkout_data: { email },
            checkout_options: {
              dark: true,
              success_url: `${process.env.URL || 'http://localhost:8888'}/dashboard?success=true`,
              cancel_url: `${process.env.URL || 'http://localhost:8888'}/pricing`
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create checkout');
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: data.data.attributes.url })
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to create checkout',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};