import { Handler } from '@netlify/functions';
import { handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionCancelled } from '../../../src/services/webhookHandler';

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    // Verify webhook signature
    const signature = event.headers['x-signature'];
    if (!signature || !WEBHOOK_SECRET) {
      return {
        statusCode: 401,
        body: 'Unauthorized'
      };
    }

    // Parse webhook payload
    const payload = JSON.parse(event.body || '{}');
    const { meta: { event_name }, data } = payload;

    // Handle different webhook events
    switch (event_name) {
      case 'subscription_created':
        await handleSubscriptionCreated(data.attributes);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(data.attributes);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(data.attributes);
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
}