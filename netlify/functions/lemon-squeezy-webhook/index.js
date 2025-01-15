const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // Get Firebase configuration from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase configuration. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    
    console.log('Firebase initialized successfully with project:', projectId);
  } catch (error) {
    console.error('Firebase initialization error:', {
      message: error.message,
      projectId: process.env.FIREBASE_PROJECT_ID ? 'present' : 'missing',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'present' : 'missing',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'present' : 'missing'
    });
    throw error;
  }
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

const updateUserCredits = async (userEmail, credits = 150) => {
  console.log(`Updating credits for user ${userEmail} to ${credits}`);
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('email', '==', userEmail).get();

  if (!userSnapshot.empty) {
    await userSnapshot.docs[0].ref.update({
      credits,
      lastCreditUpdate: new Date().toISOString()
    });
    console.log(`Successfully updated credits for ${userEmail}`);
    return true;
  } else {
    console.error(`User document not found for email: ${userEmail}`);
    return false;
  }
};

const handleNewSubscription = async (userEmail, data) => {
  console.log('Handling new subscription for:', userEmail);
  
  const userSubsRef = db.collection('user_subscriptions');
  const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

  const subscriptionData = {
    userId: userEmail,
    creditsUsed: 0,
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

  if (userSubsSnapshot.empty) {
    await userSubsRef.add(subscriptionData);
  } else {
    await userSubsSnapshot.docs[0].ref.update(subscriptionData);
  }

  // Add initial credits
  await updateUserCredits(userEmail);
};

const handleSubscriptionUpdate = async (userEmail, data) => {
  console.log('Handling subscription update for:', userEmail);
  
  const userSubsRef = db.collection('user_subscriptions');
  const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

  if (!userSubsSnapshot.empty) {
    await userSubsSnapshot.docs[0].ref.update({
      subscriptionStatus: data.attributes.status,
      subscriptionRenewsAt: data.attributes.renews_at,
      subscriptionUrls: data.attributes.urls,
      lastUpdated: new Date().toISOString()
    });

    // Refresh credits on successful payment
    await updateUserCredits(userEmail);
  }
};

const updateUserSubscription = async (event) => {
  try {
    // Always use custom_data.user_email as the source of truth
    const userEmail = event.meta.custom_data?.user_email;
    if (!userEmail) {
      console.error('No user email found in custom_data:', event.meta);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user_email in custom_data' })
      };
    }

    console.log('Processing webhook for user:', userEmail, 'Event:', event.meta.event_name);
    
    const { data, meta } = event;
    const eventName = meta.event_name;

    switch (eventName) {
      case 'subscription_created':
      case 'order_created':
        await handleNewSubscription(userEmail, data);
        break;
      
      case 'subscription_updated':
      case 'subscription_payment_success':
        await handleSubscriptionUpdate(userEmail, data);
        break;
      
      default:
        console.log(`Event ${eventName} doesn't require credit update`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        email: userEmail,
        event: eventName
      })
    };
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  console.log('Received webhook request');
  
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const signature = event.headers['x-signature'];
    if (!signature) {
      console.error('No signature found in webhook request');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No signature provided' })
      };
    }

    const isValid = verifyWebhookSignature(event.body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const webhookData = JSON.parse(event.body);
    console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));
    
    return await updateUserSubscription(webhookData);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      })
    };
  }
}; 