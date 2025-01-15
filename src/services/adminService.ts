import { collection, doc, getDoc, getDocs, query, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminUser } from '../types';

const ADMINS_COLLECTION = 'admins';
const USERS_COLLECTION = 'users';
const USER_SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';

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

    // Create admin user document with unlimited credits
    const userId = adminEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      id: userId,
      email: adminEmail,
      credits: 999999,
      lastCreditUpdate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: true
    });

    // Add user subscription data
    await setDoc(doc(db, USER_SUBSCRIPTIONS_COLLECTION, userId), {
      subscriptionId: 'admin',
      creditsUsed: 0,
      trialEndsAt: null,
      isAdmin: true,
      updatedAt: new Date().toISOString()
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
  email: string;
  credits: number;
  lastUpdated: Date;
}>> {
  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
  
  return usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      credits: data.credits || 0,
      lastUpdated: data.lastCreditUpdate ? new Date(data.lastCreditUpdate) : new Date()
    };
  });
}

export async function setUserCredits(userId: string, credits: number): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(userRef, {
    credits,
    lastCreditUpdate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
}