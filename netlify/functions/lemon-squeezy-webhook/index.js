const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: applicationDefault(),
    });
    console.log('Firebase initialized with application default credentials');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
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

const updateUserSubscription = async (event) => {
  try {
    console.log('Full webhook payload:', JSON.stringify(event, null, 2));
    
    const { data, meta } = event;
    const eventName = meta.event_name;
    const userEmail = meta.custom_data?.user_email;
    
    console.log('Processing webhook:', {
      eventName,
      userEmail,
      dataEmail: data.attributes.user_email,
      customData: meta.custom_data
    });
    
    if (!userEmail) {
      console.error('No user email found in custom_data. Meta:', meta);
      return;
    }

    // Handle different event types
    switch (eventName) {
      case 'subscription_created':
      case 'order_created':
        // For new subscriptions, ensure user gets initial credits
        await handleNewSubscription(userEmail, data);
        break;
      
      case 'subscription_updated':
      case 'subscription_payment_success':
        // Update subscription status and renew credits if needed
        await handleSubscriptionUpdate(userEmail, data);
        break;
      
      case 'subscription_cancelled':
      case 'subscription_expired':
        // Mark subscription as inactive but don't remove credits immediately
        await handleSubscriptionEnd(userEmail, data);
        break;
      
      case 'subscription_payment_failed':
        // Mark subscription for review but don't remove access immediately
        await handlePaymentFailure(userEmail, data);
        break;
      
      default:
        console.log(`Event ${eventName} doesn't require subscription update`);
        return;
    }
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
    throw error;
  }
};

const handleNewSubscription = async (userEmail, data) => {
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

  // Update user credits
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('email', '==', userEmail).get();

  if (!userSnapshot.empty) {
    await userSnapshot.docs[0].ref.update({
      credits: 150,
      subscriptionStatus: data.attributes.status
    });
  }
};

const handleSubscriptionUpdate = async (userEmail, data) => {
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
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();

    if (!userSnapshot.empty) {
      await userSnapshot.docs[0].ref.update({
        credits: 150,
        subscriptionStatus: data.attributes.status
      });
    }
  }
};

const handleSubscriptionEnd = async (userEmail, data) => {
  const userSubsRef = db.collection('user_subscriptions');
  const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

  if (!userSubsSnapshot.empty) {
    await userSubsSnapshot.docs[0].ref.update({
      subscriptionStatus: data.attributes.status,
      subscriptionRenewsAt: data.attributes.renews_at,
      lastUpdated: new Date().toISOString()
    });

    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();

    if (!userSnapshot.empty) {
      await userSnapshot.docs[0].ref.update({
        subscriptionStatus: data.attributes.status
      });
    }
  }
};

const handlePaymentFailure = async (userEmail, data) => {
  const userSubsRef = db.collection('user_subscriptions');
  const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

  if (!userSubsSnapshot.empty) {
    await userSubsSnapshot.docs[0].ref.update({
      subscriptionStatus: data.attributes.status,
      lastUpdated: new Date().toISOString(),
      paymentFailureDate: new Date().toISOString()
    });
  }
};

exports.handler = async (event) => {
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
    console.log('Received webhook event:', webhookData.meta.event_name);

    await updateUserSubscription(webhookData);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 