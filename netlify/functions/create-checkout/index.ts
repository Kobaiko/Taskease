import { Handler } from '@netlify/functions';
import { API_URL } from '../../../src/services/lemonsqueezy/config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      throw new Error('Missing Lemonsqueezy configuration');
    }

    if (!variantId || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Both variantId and email are required'
        })
      };
    }

    const checkoutResponse = await fetch(`${API_URL}/v1/checkouts`, {
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
            checkout_data: {
              email,
              custom: { user_email: email }
            },
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

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error('Lemonsqueezy API error:', checkoutData);
      throw new Error(checkoutData.errors?.[0]?.detail || 'Failed to create checkout');
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: checkoutData.data.attributes.url })
    };
  } catch (error) {
    console.error('Error creating checkout:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to create checkout',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};