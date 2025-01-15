import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const USERS_COLLECTION = 'users';

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userDoc.exists()) {
      return 0;
    }
    return userDoc.data().credits || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

export async function updateUserCredits(userId: string, newCredits: number): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      credits: newCredits,
      lastCreditUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

export async function deductCredit(userId: string): Promise<number> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const currentCredits = userDoc.data().credits || 0;
  if (currentCredits <= 0) {
    throw new Error('No credits remaining');
  }

  const newCredits = currentCredits - 1;
  await updateDoc(userRef, {
    credits: newCredits,
    lastCreditUpdate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return newCredits;
}

export async function initializeUserCredits(userId: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    
    const userData = userDoc.data();
    if (typeof userData.credits === 'undefined') {
      await updateDoc(userRef, {
        credits: 0,
        lastCreditUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error initializing user credits:', error);
    throw error;
  }
}