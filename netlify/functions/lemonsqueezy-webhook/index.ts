import { Handler } from '@netlify/functions';
import { createHmac } from 'crypto';
import { handleSubscriptionSuccess } from '../../../src/services/subscriptionService';

const WEBHOOK_SECRET = process.env.VITE_LEMONSQUEEZY_WEBHOOK_SECRET;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Verify webhook signature
    const signature = event.headers['x-signature'];
    if (!signature || !WEBHOOK_SECRET) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    const digest = hmac.update(event.body || '').digest('hex');
    
    if (signature !== digest) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const payload = JSON.parse(event.body || '{}');
    const { meta: { event_name }, data } = payload;

    switch (event_name) {
      case 'subscription_created':
        const { customer_email, subscription_id, variant_id } = data.attributes;
        await handleSubscriptionSuccess(customer_email, subscription_id, variant_id);
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook handler failed' })
    };
  }
};