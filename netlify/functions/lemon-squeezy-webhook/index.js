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

const handleOrderCreated = async (event) => {
  const { data } = event;
  const userEmail = data.attributes.checkout_data?.custom?.user_email;
  
  if (!userEmail) {
    console.error('No user email found in order data');
    return;
  }

  // Find user by email
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('email', '==', userEmail).get();

  if (userSnapshot.empty) {
    console.error(`No user found with email: ${userEmail}`);
    return;
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();

  // Update user's credits and subscription status
  await userDoc.ref.update({
    credits: 150, // Set initial credits
    subscriptionStatus: 'active',
    subscriptionId: data.id,
    subscriptionVariantId: data.attributes.variant_id,
    subscriptionStartDate: new Date().toISOString(),
  });

  console.log(`Updated user ${userEmail} with subscription and credits`);
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

    console.log('Received Lemon Squeezy webhook:', eventName);

    switch (eventName) {
      case 'order_created':
        await handleOrderCreated(payload);
        break;
      // Add more event handlers as needed
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