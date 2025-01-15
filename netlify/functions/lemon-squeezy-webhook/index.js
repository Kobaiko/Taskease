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
    // Get user email from custom data
    const userEmail = meta.custom_data?.user_email;
    const eventName = meta.event_name;
    
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

    console.log('Processing subscription for user:', userEmail);

    // Find user by email in user_subscriptions collection
    const userSubsRef = db.collection('user_subscriptions');
    const userSubsSnapshot = await userSubsRef.where('userId', '==', userEmail).get();

    if (userSubsSnapshot.empty) {
      console.log('Creating new user subscription document for:', userEmail);
      await userSubsRef.add({
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
    }

    const userSubDoc = userSubsSnapshot.docs[0];
    console.log('Found user subscription document:', userSubDoc.id);

    // Update subscription data
    const updateData = {
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

    console.log('Updating user subscription with data:', updateData);

    // Update user_subscriptions collection
    await userSubDoc.ref.update(updateData);
    console.log(`Successfully updated subscription for user ${userEmail}`);

    // Update credits in the main users collection
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', userEmail).get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await userDoc.ref.update({
        credits: 150,
        subscriptionStatus: data.attributes.status
      });
      console.log(`Successfully updated credits for user ${userEmail}`);
    }
    
    // Verify the updates
    const updatedSubDoc = await userSubDoc.ref.get();
    const updatedSubData = updatedSubDoc.data();
    console.log('Updated subscription data:', {
      creditsUsed: updatedSubData.creditsUsed,
      subscriptionStatus: updatedSubData.subscriptionStatus,
      subscriptionId: updatedSubData.subscriptionId,
      lastUpdated: updatedSubData.lastUpdated
    });
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
    throw error;
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