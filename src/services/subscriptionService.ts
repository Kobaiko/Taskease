import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Subscription, UserSubscriptionData } from '../types/subscription';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const USER_SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';

export async function createSubscription(userId: string, planId: string): Promise<void> {
  const subscription: Subscription = {
    id: crypto.randomUUID(),
    userId,
    planId,
    status: 'trial',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false
  };

  await setDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id), subscription);
  
  const userData: UserSubscriptionData = {
    subscriptionId: subscription.id,
    trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days trial
    creditsUsed: 0
  };

  await setDoc(doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId), userData);
}

export async function getUserSubscriptionData(userId: string): Promise<UserSubscriptionData | null> {
  try {
    const docRef = doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Initialize subscription data for new users
      const initialData: UserSubscriptionData = {
        creditsUsed: 0,
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days trial
      };
      await setDoc(docRef, initialData);
      return initialData;
    }
    
    return docSnap.data() as UserSubscriptionData;
  } catch (error) {
    console.error('Error getting subscription data:', error);
    throw error;
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: Subscription['status']
): Promise<void> {
  const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  await updateDoc(docRef, { status });
}