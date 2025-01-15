const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
const initializeFirebase = async () => {
  if (!getApps().length) {
    try {
      console.log('[Firebase] Starting initialization...');
      
      // Get Firebase configuration from environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      console.log('[Firebase] Configuration check:', {
        hasProjectId: !!projectId,
        projectIdValue: projectId,
        hasClientEmail: !!clientEmail,
        clientEmailLength: clientEmail?.length,
        hasPrivateKey: !!privateKey,
        privateKeyLength: privateKey?.length
      });

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase configuration. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      }

      const config = {
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      };

      console.log('[Firebase] Initializing with config:', {
        projectId,
        clientEmail: clientEmail ? `${clientEmail.substring(0, 10)}...` : null,
        privateKeyLength: privateKey?.length
      });

      initializeApp(config);
      
      // Test Firestore connection
      const db = getFirestore();
      console.log('[Firebase] Testing Firestore connection...');
      await db.collection('users').limit(1).get();
      
      console.log('[Firebase] Initialization successful');
    } catch (error) {
      console.error('[Firebase] Initialization error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        projectId: process.env.FIREBASE_PROJECT_ID ? 'present' : 'missing',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'present' : 'missing',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'present' : 'missing'
      });
      throw error;
    }
  }
};

// Initialize Firebase before handling any requests
let db;

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
    
    // Get or create user document
    const usersRef = db.collection('users');
    console.log('[updateUserCredits] Querying users collection for:', userEmail);
    
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();
    console.log('[updateUserCredits] User query result:', {
      exists: !userSnapshot.empty,
      docCount: userSnapshot.size
    });

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      console.log(`[updateUserCredits] Found existing user:`, {
        userId: userDoc.id,
        currentCredits: userData.credits,
        email: userData.email
      });
      
      // Update existing user
      await userDoc.ref.update({
        credits,
        lastCreditUpdate: new Date().toISOString()
      });
      console.log(`[updateUserCredits] Updated credits for existing user ${userDoc.id}`);
    } else {
      // Create new user
      const newUserData = {
        email: userEmail,
        credits,
        lastCreditUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      console.log('[updateUserCredits] Creating new user:', newUserData);
      
      const newUserRef = await usersRef.add(newUserData);
      console.log(`[updateUserCredits] Created new user with ID: ${newUserRef.id}`);
    }

    console.log(`[updateUserCredits] Successfully updated credits for ${userEmail}`);
    return true;
  } catch (error) {
    console.error('[updateUserCredits] Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
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

    // Update user credits first
    await updateUserCredits(userEmail, 150);

    // Get the user document
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();
    if (userSnapshot.empty) {
      throw new Error('User not found after credit update');
    }
    const userId = userSnapshot.docs[0].id;

    // Store subscription info
    const userSubsRef = db.collection('user_subscriptions');
    const subscriptionData = {
      userId,
      email: userEmail,
      subscriptionStatus: data.attributes.status,
      subscriptionId: data.id,
      subscriptionVariantId: data.attributes.variant_id,
      subscriptionStartDate: data.attributes.created_at,
      subscriptionRenewsAt: data.attributes.renews_at,
      lastUpdated: new Date().toISOString()
    };

    await userSubsRef.add(subscriptionData);
    console.log('[handleNewSubscription] Successfully stored subscription data');

    return true;
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

    // Update user credits first
    await updateUserCredits(userEmail, 150);

    // Get the user document
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();
    if (userSnapshot.empty) {
      throw new Error('User not found after credit update');
    }
    const userId = userSnapshot.docs[0].id;

    // Update subscription info
    const userSubsRef = db.collection('user_subscriptions');
    const userSubsSnapshot = await userSubsRef.where('userId', '==', userId).get();

    if (!userSubsSnapshot.empty) {
      await userSubsSnapshot.docs[0].ref.update({
        subscriptionStatus: data.attributes.status,
        subscriptionRenewsAt: data.attributes.renews_at,
        lastUpdated: new Date().toISOString()
      });
      console.log('[handleSubscriptionUpdate] Updated subscription data');
    } else {
      // If no subscription found, create one
      await handleNewSubscription(userEmail, data);
    }

    return true;
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
  console.log('[webhook] Received request', {
    method: event.httpMethod,
    headers: event.headers,
    hasSignature: !!event.headers['x-signature'],
    bodyLength: event.body?.length
  });
  
  try {
    // Initialize Firebase if not already initialized
    await initializeFirebase();
    db = getFirestore();

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const signature = event.headers['x-signature'];
    if (!signature) {
      console.error('[webhook] No signature found in request', {
        availableHeaders: Object.keys(event.headers)
      });
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No signature provided' })
      };
    }

    console.log('[webhook] Verifying signature with secret length:', process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.length);
    const isValid = verifyWebhookSignature(event.body, signature);
    if (!isValid) {
      console.error('[webhook] Invalid signature', {
        signatureLength: signature.length,
        bodyPreview: event.body.substring(0, 100)
      });
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const webhookData = JSON.parse(event.body);
    console.log('[webhook] Processing webhook data:', {
      eventName: webhookData.meta?.event_name,
      userEmail: webhookData.meta?.custom_data?.user_email,
      hasData: !!webhookData.data,
      timestamp: new Date().toISOString()
    });
    
    return await updateUserSubscription(webhookData);
  } catch (error) {
    console.error('[webhook] Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 