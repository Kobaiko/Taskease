import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const auth = getAuth();
const db = getFirestore();

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // List all users from Firebase Auth
    const { users } = await auth.listUsers();
    
    // Get credits from Firestore
    const creditsSnapshot = await db.collection('credits').get();
    const creditsMap = new Map();
    
    creditsSnapshot.forEach(doc => {
      creditsMap.set(doc.id, {
        credits: doc.data().credits,
        lastUpdated: doc.data().lastUpdated?.toDate()
      });
    });

    // Combine user data with credits
    const userData = users.map(user => ({
      id: user.uid,
      email: user.email,
      credits: creditsMap.get(user.uid)?.credits || 0,
      lastUpdated: creditsMap.get(user.uid)?.lastUpdated || new Date()
    }));

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ users: userData })
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to list users',
        details: error.message 
      })
    };
  }
};