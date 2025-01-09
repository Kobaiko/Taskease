const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

const verifyWebhookSignature = (payload, signature) => {
  try {
    const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    console.log('Webhook secret present:', !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
    return false;
  }
};

const updateUserSubscription = async (event) => {
  try {
    console.log('Full webhook payload:', JSON.stringify(event, null, 2));
    
    const { data, meta } = event;
    // Get user email from custom data
    const userEmail = meta.custom_data?.user_email;
    
    if (!userEmail) {
      console.error('No user email found in subscription data. Meta:', meta);
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
    console.log('Found user document:', userDoc.id);

    // Update user's subscription status and credits
    const updateData = {
      credits: 150, // Set initial credits for new subscriptions
      subscriptionStatus: data.attributes.status,
      subscriptionId: data.id,
      subscriptionVariantId: data.attributes.variant_id,
      subscriptionStartDate: data.attributes.created_at,
      subscriptionRenewsAt: data.attributes.renews_at,
      subscriptionUrls: data.attributes.urls,
      subscriptionCardBrand: data.attributes.card_brand,
      subscriptionCardLastFour: data.attributes.card_last_four,
      lastUpdated: new Date().toISOString()
    };

    console.log('Updating user with data:', updateData);

    await userDoc.ref.update(updateData);
    console.log(`Successfully updated subscription for user ${userEmail}`);
    
    // Verify the update
    const updatedDoc = await userDoc.ref.get();
    const updatedData = updatedDoc.data();
    console.log('Updated user data:', {
      credits: updatedData.credits,
      subscriptionStatus: updatedData.subscriptionStatus,
      subscriptionId: updatedData.subscriptionId,
      lastUpdated: updatedData.lastUpdated
    });
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  try {
    console.log('Received webhook request:', {
      method: event.httpMethod,
      headers: event.headers,
      path: event.path
    });

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const signature = event.headers['x-signature'];
    if (!signature) {
      console.error('No signature provided in headers:', event.headers);
      return { statusCode: 401, body: 'No signature provided' };
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(event.body, signature)) {
      console.error('Invalid signature. Headers:', event.headers);
      return { statusCode: 401, body: 'Invalid signature' };
    }

    const payload = JSON.parse(event.body);
    const eventName = payload.meta.event_name;

    console.log('Processing webhook:', {
      eventName,
      userEmail: payload.meta.custom_data?.user_email,
      testMode: payload.meta.test_mode
    });

    // Handle both subscription created and updated events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await updateUserSubscription(payload);
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
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message,
        stack: error.stack 
      }),
    };
  }
}; 