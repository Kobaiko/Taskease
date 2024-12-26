import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserCredits } from '../types';

const CREDITS_COLLECTION = 'credits';
const INITIAL_CREDITS = 3;

export async function initializeUserCredits(userId: string): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    const userCredits: UserCredits = {
      userId,
      credits: INITIAL_CREDITS,
      lastUpdated: new Date()
    };
    await setDoc(creditRef, userCredits);
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    await initializeUserCredits(userId);
    return INITIAL_CREDITS;
  }

  return creditDoc.data().credits;
}

export async function deductCredit(userId: string): Promise<number> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    throw new Error('User credits not found');
  }

  const currentCredits = creditDoc.data().credits;
  if (currentCredits <= 0) {
    throw new Error('No credits remaining');
  }

  const newCredits = currentCredits - 1;
  await updateDoc(creditRef, {
    credits: newCredits,
    lastUpdated: new Date()
  });

  return newCredits;
}