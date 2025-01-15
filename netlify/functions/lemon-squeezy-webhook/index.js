import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createHmac } from 'crypto';

// Initialize Firebase Admin
const FIREBASE_ADMIN_CONFIG = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL,
};

if (getApps().length === 0) {
  initializeApp({
    credential: cert(FIREBASE_ADMIN_CONFIG)
  });
}

const db = getFirestore();

function verifyWebhookSignature(payload, signature) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Webhook secret not configured');
  }

  const hmac = createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}

async function updateUserCredits(email, subscriptionId, subscriptionStatus) {
  console.log('Updating user credits:', { email, subscriptionId, subscriptionStatus });
  
  try {
    // Create a deterministic user ID from the email
    const userId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userRef = db.collection('users').doc(userId);
    
    // Get the current user document
    const userDoc = await userRef.get();
    const now = new Date().toISOString();
    
    if (userDoc.exists) {
      console.log('Existing user found:', userDoc.data());
      
      // Update existing user
      await userRef.update({
        email,
        credits: 150, // Reset to 150 credits
        subscriptionId,
        subscriptionStatus,
        lastCreditUpdate: now,
        updatedAt: now
      });
      
      console.log('Updated existing user document');
    } else {
      console.log('Creating new user document');
      
      // Create new user
      await userRef.set({
        id: userId,
        email,
        credits: 150,
        subscriptionId,
        subscriptionStatus,
        lastCreditUpdate: now,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('Created new user document');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

export async function handler(event, context) {
  console.log('Received webhook event:', event);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify signature
  const signature = event.headers['x-signature'];
  if (!signature) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'No signature provided' })
    };
  }

  try {
    const isValid = verifyWebhookSignature(event.body, signature);
    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const payload = JSON.parse(event.body);
    console.log('Webhook payload:', payload);

    // Extract user email from custom data
    const userEmail = payload.data?.attributes?.custom_data?.user_email || 
                     payload.meta?.custom_data?.user_email ||
                     payload.data?.attributes?.user_email ||
                     payload.data?.attributes?.billing_email;

    if (!userEmail) {
      console.error('No user email found in webhook data');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No user email found in webhook data' })
      };
    }

    // Process the webhook based on event type
    const eventName = payload.meta.event_name;
    const subscriptionId = payload.data?.attributes?.subscription_id;
    
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await updateUserCredits(
          userEmail,
          subscriptionId,
          payload.data?.attributes?.status || 'active'
        );
        break;
        
      case 'subscription_cancelled':
        await updateUserCredits(
          userEmail,
          subscriptionId,
          'cancelled'
        );
        break;
        
      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Webhook processed successfully',
        email: userEmail,
        event: eventName
      })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
} 