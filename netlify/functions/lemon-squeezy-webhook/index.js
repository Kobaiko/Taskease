const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

const verifyWebhookSignature = (payload, signature) => {
  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

const handleSubscriptionCreated = async (event) => {
  const { data, meta } = event;
  // Get user email from custom data
  const userEmail = meta.custom_data?.user_email;
  
  if (!userEmail) {
    console.error('No user email found in subscription data');
    return;
  }

  console.log('Processing subscription for user:', userEmail);

  // Find user by email
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('email', '==', userEmail).get();

  if (userSnapshot.empty) {
    console.error(`No user found with email: ${userEmail}`);
    return;
  }

  const userDoc = userSnapshot.docs[0];

  // Update user's subscription status and credits
  const updateData = {
    credits: 150,
    subscriptionStatus: data.attributes.status,
    subscriptionId: data.id,
    subscriptionVariantId: data.attributes.variant_id,
    subscriptionStartDate: data.attributes.created_at,
    subscriptionRenewsAt: data.attributes.renews_at,
    subscriptionUrls: data.attributes.urls,
    subscriptionCardBrand: data.attributes.card_brand,
    subscriptionCardLastFour: data.attributes.card_last_four
  };

  await userDoc.ref.update(updateData);
  console.log(`Updated subscription for user ${userEmail}:`, updateData);
};

exports.handler = async (event) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const signature = event.headers['x-signature'];
    if (!signature) {
      return { statusCode: 401, body: 'No signature provided' };
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(event.body, signature)) {
      return { statusCode: 401, body: 'Invalid signature' };
    }

    const payload = JSON.parse(event.body);
    const eventName = payload.meta.event_name;

    console.log('Received Lemon Squeezy webhook:', eventName, 'for user:', payload.meta.custom_data?.user_email);

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(payload);
        break;
      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}; 