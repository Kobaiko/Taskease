import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserCredits } from '../types';

const USERS_COLLECTION = 'users';
const INITIAL_CREDITS = 3;

export async function initializeUserCredits(userId: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const userData = {
      id: userId,
      credits: INITIAL_CREDITS,
      lastCreditUpdate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, userData);
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await initializeUserCredits(userId);
    return INITIAL_CREDITS;
  }

  return userDoc.data().credits || 0;
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