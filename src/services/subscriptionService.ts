import { doc, setDoc, getDoc, updateDoc, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Subscription, UserSubscriptionData } from '../types/subscription';

const USERS_COLLECTION = 'users';
const USER_SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';

export async function getUserSubscriptionData(userId: string): Promise<UserSubscriptionData | null> {
  try {
    const docRef = doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return docSnap.data() as UserSubscriptionData;
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
  const batch = writeBatch(db);

  // Update user document with credits and subscription info
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);
  
  const userData = userDoc.exists() ? userDoc.data() : {};
  batch.set(userRef, {
    ...userData,
    id: userId,
    credits: 150,
    lastCreditUpdate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionId,
    subscriptionPlanId: planId,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date().toISOString(),
    subscriptionRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, { merge: true });

  // Update user subscription data
  const userSubRef = doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId);
  batch.set(userSubRef, {
    subscriptionId,
    creditsUsed: 0,
    isSubscribed: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await batch.commit();
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

  // Update user document
  await updateDoc(userRef, {
    subscriptionStatus: 'canceled',
    updatedAt: new Date().toISOString()
  });

  // Update user subscription data
  const userSubRef = doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId);
  await updateDoc(userSubRef, {
    isSubscribed: false,
    updatedAt: new Date().toISOString()
  });
}