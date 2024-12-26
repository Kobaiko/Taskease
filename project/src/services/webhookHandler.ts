import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateSubscriptionStatus } from './subscriptionService';
import { VARIANT_IDS } from '../config/plans';

export async function handleSubscriptionCreated(data: any) {
  const { customer_email, variant_id, subscription_id } = data;
  
  // Get user document by email
  const userDoc = await getDoc(doc(db, 'users', customer_email));
  if (!userDoc.exists()) return;

  const userId = userDoc.id;
  const planId = Object.entries(VARIANT_IDS).find(([_, id]) => id === variant_id)?.[0] || 'monthly';

  // Update subscription status
  await updateSubscriptionStatus(subscription_id, 'active');

  // Update user subscription data
  await updateDoc(doc(db, 'user_subscriptions', userId), {
    subscriptionId: subscription_id,
    planId,
    status: 'active',
    updatedAt: new Date()
  });
}

export async function handleSubscriptionUpdated(data: any) {
  const { subscription_id, status } = data;
  await updateSubscriptionStatus(subscription_id, status);
}

export async function handleSubscriptionCancelled(data: any) {
  const { subscription_id } = data;
  await updateSubscriptionStatus(subscription_id, 'canceled');
}