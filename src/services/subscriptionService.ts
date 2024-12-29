import { doc, setDoc, getDoc, updateDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Subscription, UserSubscriptionData } from '../types/subscription';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const USER_SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';
const CREDITS_COLLECTION = 'credits';

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
  const batch = db.batch();

  // Update subscription status
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  batch.set(subscriptionRef, {
    id: subscriptionId,
    userId,
    planId,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false,
    createdAt: Timestamp.now()
  });

  // Update user subscription data
  const userSubRef = doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId);
  batch.set(userSubRef, {
    subscriptionId,
    creditsUsed: 0,
    isSubscribed: true,
    updatedAt: Timestamp.now()
  });

  // Set credits to 150
  const creditsRef = doc(db, CREDITS_COLLECTION, userId);
  batch.set(creditsRef, {
    userId,
    credits: 150,
    lastUpdated: Timestamp.now()
  });

  await batch.commit();
}

export async function cancelSubscription(userId: string): Promise<void> {
  const userSubRef = doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId);
  const userSubDoc = await getDoc(userSubRef);

  if (!userSubDoc.exists()) {
    throw new Error('No subscription found');
  }

  const { subscriptionId } = userSubDoc.data();
  if (!subscriptionId) {
    throw new Error('No active subscription found');
  }

  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  await updateDoc(subscriptionRef, {
    status: 'canceled',
    cancelAtPeriodEnd: true,
    updatedAt: Timestamp.now()
  });

  await updateDoc(userSubRef, {
    isSubscribed: false,
    updatedAt: Timestamp.now()
  });
}