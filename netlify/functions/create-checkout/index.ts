import { Handler } from '@netlify/functions';
import { API_URL } from '../../../src/services/lemonsqueezy/config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
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
    let requestData;
    try {
      requestData = JSON.parse(event.body || '');
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

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

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from Lemon Squeezy: ' + responseText);
    }

    if (!response.ok) {
      throw new Error(responseData.errors?.[0]?.detail || 'Failed to create checkout');
    }

    if (!responseData?.data?.attributes?.url) {
      throw new Error('Invalid response: Missing checkout URL');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ url: responseData.data.attributes.url })
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