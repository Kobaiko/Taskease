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

// Helper function to clean undefined values from an object
const cleanUndefined = (obj) => {
  const cleaned = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

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
  try {
    console.log(`[updateUserCredits] Starting credit update for ${userEmail} to ${credits}`);
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();

    const updateData = cleanUndefined({
      credits,
      lastCreditUpdate: new Date().toISOString()
    });

    if (!userSnapshot.empty) {
      await userSnapshot.docs[0].ref.update(updateData);
      console.log(`[updateUserCredits] Successfully updated credits for ${userEmail}`);
      return true;
    } else {
      console.log(`[updateUserCredits] Creating new user document for ${userEmail}`);
      const newUserData = cleanUndefined({
        email: userEmail,
        credits,
        lastCreditUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      await usersRef.add(newUserData);
      console.log(`[updateUserCredits] Created new user document for ${userEmail}`);
      return true;
    }
  } catch (error) {
    console.error('[updateUserCredits] Error:', error);
    throw error;
  }
};

const handleNewSubscription = async (userEmail, data) => {
  try {
    console.log('[handleNewSubscription] Starting for:', userEmail);
    console.log('[handleNewSubscription] Data:', JSON.stringify(data, null, 2));
    
    if (!data?.attributes) {
      throw new Error('Invalid subscription data: missing attributes');
    }
    
    const userSubsRef = db.collection('user_subscriptions');
    const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

    const subscriptionData = cleanUndefined({
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
    });

    if (userSubsSnapshot.empty) {
      await userSubsRef.add(subscriptionData);
      console.log('[handleNewSubscription] Created new subscription document');
    } else {
      await userSubsSnapshot.docs[0].ref.update(subscriptionData);
      console.log('[handleNewSubscription] Updated existing subscription document');
    }

    // Add initial credits
    await updateUserCredits(userEmail);
    console.log('[handleNewSubscription] Completed successfully');
  } catch (error) {
    console.error('[handleNewSubscription] Error:', error);
    throw error;
  }
};

const handleSubscriptionUpdate = async (userEmail, data) => {
  try {
    console.log('[handleSubscriptionUpdate] Starting for:', userEmail);
    console.log('[handleSubscriptionUpdate] Data:', JSON.stringify(data, null, 2));
    
    if (!data?.attributes) {
      throw new Error('Invalid subscription data: missing attributes');
    }
    
    const userSubsRef = db.collection('user_subscriptions');
    const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

    if (!userSubsSnapshot.empty) {
      const updateData = cleanUndefined({
        subscriptionStatus: data.attributes.status,
        subscriptionRenewsAt: data.attributes.renews_at,
        subscriptionUrls: data.attributes.urls,
        lastUpdated: new Date().toISOString()
      });

      await userSubsSnapshot.docs[0].ref.update(updateData);
      console.log('[handleSubscriptionUpdate] Updated subscription document');

      // Refresh credits on successful payment
      await updateUserCredits(userEmail);
      console.log('[handleSubscriptionUpdate] Updated credits');
    } else {
      console.log('[handleSubscriptionUpdate] No existing subscription found, creating new');
      await handleNewSubscription(userEmail, data);
    }
  } catch (error) {
    console.error('[handleSubscriptionUpdate] Error:', error);
    throw error;
  }
};

const updateUserSubscription = async (event) => {
  try {
    console.log('[updateUserSubscription] Processing event:', event.meta?.event_name);
    console.log('[updateUserSubscription] Full event:', JSON.stringify(event, null, 2));
    
    // Always use custom_data.user_email as the source of truth
    const userEmail = event.meta?.custom_data?.user_email;
    if (!userEmail) {
      console.error('[updateUserSubscription] No user email found in custom_data:', event.meta);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user_email in custom_data' })
      };
    }

    if (!event.data) {
      console.error('[updateUserSubscription] No data in event');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing data in event' })
      };
    }

    console.log('[updateUserSubscription] Processing for user:', userEmail, 'Event:', event.meta.event_name);
    
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
        console.log(`[updateUserSubscription] Event ${eventName} doesn't require credit update`);
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
    console.error('[updateUserSubscription] Error:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  console.log('[webhook] Received request');
  
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const signature = event.headers['x-signature'];
    if (!signature) {
      console.error('[webhook] No signature found in request');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No signature provided' })
      };
    }

    const isValid = verifyWebhookSignature(event.body, signature);
    if (!isValid) {
      console.error('[webhook] Invalid signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const webhookData = JSON.parse(event.body);
    console.log('[webhook] Payload:', JSON.stringify(webhookData, null, 2));
    
    return await updateUserSubscription(webhookData);
  } catch (error) {
    console.error('[webhook] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 