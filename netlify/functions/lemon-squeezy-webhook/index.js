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
    
    // Create a clean user ID from the email
    const userId = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    console.log(`[updateUserCredits] Using userId: ${userId}`);

    // Get the user document using the deterministic ID
    const userDoc = usersRef.doc(userId);
    const userSnapshot = await userDoc.get();

    if (userSnapshot.exists) {
      const userData = userSnapshot.data();
      console.log(`[updateUserCredits] Found existing user:`, {
        userId,
        currentCredits: userData.credits,
        email: userData.email
      });
      
      // Update existing user
      await userDoc.set({
        ...userData,
        credits,
        lastCreditUpdate: new Date().toISOString(),
        email: userEmail, // Ensure email is up to date
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`[updateUserCredits] Updated credits for existing user ${userId}`);
    } else {
      // Create new user with deterministic ID
      const newUserData = {
        id: userId,
        email: userEmail,
        credits,
        lastCreditUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('[updateUserCredits] Creating new user:', newUserData);
      
      await userDoc.set(newUserData);
      console.log(`[updateUserCredits] Created new user with ID: ${userId}`);
    }

    // Store subscription info in a subcollection
    const subscriptionsRef = userDoc.collection('subscriptions');
    const activeSubQuery = await subscriptionsRef
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!activeSubQuery.empty) {
      console.log('[updateUserCredits] User has active subscription');
    } else {
      console.log('[updateUserCredits] No active subscription found');
    }

    console.log(`[updateUserCredits] Successfully updated credits for ${userEmail}`);
    return userId;
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

    // Update user credits first and get userId
    const userId = await updateUserCredits(userEmail, 150);

    // Get the user document
    const userDoc = db.collection('users').doc(userId);
    
    // Add subscription to user's subscriptions subcollection
    const subscriptionsRef = userDoc.collection('subscriptions');
    const subscriptionData = cleanUndefined({
      status: data.attributes.status || 'active',
      subscriptionId: data.id,
      variantId: data.attributes.variant_id,
      startDate: data.attributes.created_at || new Date().toISOString(),
      renewsAt: data.attributes.renews_at || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await subscriptionsRef.doc(data.id).set(subscriptionData);
    console.log('[handleNewSubscription] Successfully stored subscription data:', subscriptionData);

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

    // Update user credits first and get userId
    const userId = await updateUserCredits(userEmail, 150);

    // Get the user document
    const userDoc = db.collection('users').doc(userId);
    
    // Update subscription in user's subscriptions subcollection
    const subscriptionRef = userDoc.collection('subscriptions').doc(data.id);
    const subscriptionSnapshot = await subscriptionRef.get();

    if (subscriptionSnapshot.exists) {
      const updateData = cleanUndefined({
        status: data.attributes.status || 'active',
        renewsAt: data.attributes.renews_at || null,
        updatedAt: new Date().toISOString()
      });
      
      console.log('[handleSubscriptionUpdate] Updating subscription with data:', updateData);
      await subscriptionRef.set(updateData, { merge: true });
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
    
    // Get email from custom_data first, then fallback to other sources
    const userEmail = event.meta?.custom_data?.user_email || 
                     event.data?.attributes?.custom_data?.user_email ||
                     event.data?.attributes?.billing_email;

    if (!userEmail) {
      console.error('[updateUserSubscription] No user email found:', {
        meta: event.meta,
        attributes: event.data?.attributes,
        customData: event.meta?.custom_data,
        attributesCustomData: event.data?.attributes?.custom_data
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user_email in webhook data' })
      };
    }

    // Clean and normalize the email
    const normalizedEmail = userEmail.toLowerCase().trim();
    console.log('[updateUserSubscription] Using email:', normalizedEmail);

    if (!event.data) {
      console.error('[updateUserSubscription] No data in event');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing data in event' })
      };
    }

    console.log('[updateUserSubscription] Processing for user:', normalizedEmail, 'Event:', event.meta.event_name);
    
    const { data, meta } = event;
    const eventName = meta.event_name;

    switch (eventName) {
      case 'subscription_created':
      case 'order_created':
        await handleNewSubscription(normalizedEmail, data);
        break;
      
      case 'subscription_updated':
      case 'subscription_payment_success':
        await handleSubscriptionUpdate(normalizedEmail, data);
        break;
      
      default:
        console.log(`[updateUserSubscription] Event ${eventName} doesn't require credit update`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        email: normalizedEmail,
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
    console.log('[webhook] Full webhook payload:', JSON.stringify(webhookData, null, 2));
    console.log('[webhook] Customer data:', {
      customData: webhookData.meta?.custom_data,
      customerEmail: webhookData.data?.attributes?.user_email,
      customerName: webhookData.data?.attributes?.user_name,
      billingEmail: webhookData.data?.attributes?.billing_email,
      metaEmail: webhookData.meta?.custom_data?.user_email,
      timestamp: new Date().toISOString()
    });
    
    // Get email from multiple possible sources
    const userEmail = webhookData.meta?.custom_data?.user_email || 
                     webhookData.data?.attributes?.user_email ||
                     webhookData.data?.attributes?.billing_email;

    if (!userEmail) {
      console.error('[webhook] No email found in webhook data');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'No email found in webhook data',
          webhookData: webhookData
        })
      };
    }

    // Process the webhook with the found email
    const result = await updateUserSubscription({
      ...webhookData,
      meta: {
        ...webhookData.meta,
        custom_data: {
          ...webhookData.meta?.custom_data,
          user_email: userEmail
        }
      }
    });

    console.log('[webhook] Processing complete:', {
      email: userEmail,
      status: result.statusCode,
      response: result.body
    });

    return result;
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