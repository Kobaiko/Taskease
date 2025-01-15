import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const USERS_COLLECTION = 'users';

export async function getUserSubscriptionData(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      subscriptionId: userData.subscriptionId,
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionRenewsAt: userData.subscriptionRenewsAt,
      credits: userData.credits || 0,
      isSubscribed: userData.subscriptionStatus === 'active'
    };
  } catch (error) {
    console.error('Error getting subscription data:', error);
    throw error;
  }
}

export async function handleSubscriptionSuccess(
  userId: string,
  subscriptionId: string,
  planId: string
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  await updateDoc(userRef, {
    credits: 150,
    lastCreditUpdate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionId,
    subscriptionPlanId: planId,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date().toISOString(),
    subscriptionRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
}

export async function cancelSubscription(userId: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('No subscription found');
  }

  const subscriptionId = userDoc.data().subscriptionId;
  if (!subscriptionId) {
    throw new Error('No active subscription found');
  }

  await updateDoc(userRef, {
    subscriptionStatus: 'canceled',
    updatedAt: new Date().toISOString()
  });
}