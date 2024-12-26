import { collection, doc, getDoc, getDocs, query, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminUser, UserSubscriptionData } from '../types';

const ADMINS_COLLECTION = 'admins';
const CREDITS_COLLECTION = 'credits';
const USER_SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

export async function isUserAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  const adminRef = doc(db, ADMINS_COLLECTION, email);
  const adminDoc = await getDoc(adminRef);
  return adminDoc.exists();
}

export async function initializeFirstAdmin(): Promise<void> {
  const adminEmail = 'kobaiko@gmail.com';
  const adminRef = doc(db, ADMINS_COLLECTION, adminEmail);
  const adminDoc = await getDoc(adminRef);

  if (!adminDoc.exists()) {
    const admin: AdminUser = {
      email: adminEmail,
      addedAt: new Date()
    };
    await setDoc(adminRef, admin);

    // Set up subscription for admin
    const subscriptionId = crypto.randomUUID();
    
    // Add subscription
    await setDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId), {
      id: subscriptionId,
      userId: adminEmail,
      planId: 'yearly-plan',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      cancelAtPeriodEnd: false,
      createdAt: Timestamp.now()
    });

    // Add user subscription data
    await setDoc(doc(db, USER_SUBSCRIPTIONS_COLLECTION, adminEmail), {
      subscriptionId,
      creditsUsed: 0,
      trialEndsAt: null, // No trial for admin
      isAdmin: true
    });

    // Add initial credits
    await setDoc(doc(db, CREDITS_COLLECTION, adminEmail), {
      userId: adminEmail,
      credits: 999999, // Unlimited credits for admin
      lastUpdated: new Date()
    });
  }
}

export async function addAdmin(email: string, addedByEmail: string): Promise<void> {
  const adminRef = doc(db, ADMINS_COLLECTION, email);
  const admin: AdminUser = {
    email,
    addedBy: addedByEmail,
    addedAt: new Date()
  };
  await setDoc(adminRef, admin);
}

export async function getAllUsers(): Promise<Array<{
  id: string;
  credits: number;
  lastUpdated: Date;
}>> {
  const creditsSnapshot = await getDocs(collection(db, CREDITS_COLLECTION));
  
  return creditsSnapshot.docs.map(doc => {
    const data = doc.data() as UserSubscriptionData;
    return {
      id: doc.id,
      credits: data.credits,
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.seconds * 1000) : new Date()
    };
  });
}

export async function setUserCredits(userId: string, credits: number): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  await setDoc(creditRef, {
    userId,
    credits,
    lastUpdated: new Date()
  }, { merge: true });
}