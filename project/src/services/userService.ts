import { 
  updateProfile,
  updateEmail,
  verifyBeforeUpdateEmail,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface MarketingConsent {
  email: string;
  displayName: string;
  marketingConsent: boolean;
  timestamp: Date;
}

interface BetaConsent {
  email: string;
  displayName: string;
  betaConsent: boolean;
  timestamp: Date;
}

export async function updateUserProfile(data: {
  displayName?: string;
  photoURL?: string;
}) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await updateProfile(auth.currentUser, data);
}

export async function updateUserEmail(newEmail: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  // This will send a verification email to the new address
  // The email won't be updated until the user clicks the link in the verification email
}

export async function updateUserPassword(newPassword: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await updatePassword(auth.currentUser, newPassword);
}

export async function reauthenticateUser(password: string) {
  if (!auth.currentUser?.email) throw new Error('No authenticated user');
  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  await reauthenticateWithCredential(auth.currentUser, credential);
}

export async function saveUserTheme(userId: string, theme: 'dark' | 'light') {
  const userPrefsRef = doc(db, 'userPreferences', userId);
  await setDoc(userPrefsRef, { theme }, { merge: true });
}

export async function getUserTheme(userId: string): Promise<'dark' | 'light' | null> {
  const userPrefsRef = doc(db, 'userPreferences', userId);
  const userPrefs = await getDoc(userPrefsRef);
  return userPrefs.exists() ? userPrefs.data().theme : null;
}

export async function saveMarketingConsent(userId: string, data: MarketingConsent) {
  const marketingRef = doc(collection(db, 'marketing_consent'), userId);
  await setDoc(marketingRef, {
    ...data,
    timestamp: new Date()
  });
}

export async function saveBetaConsent(userId: string, data: BetaConsent) {
  const betaRef = doc(collection(db, 'beta_consent'), userId);
  await setDoc(betaRef, {
    ...data,
    timestamp: new Date()
  });
}

async function deleteUserDocuments(userId: string) {
  const collections = [
    'tasks',
    'credits',
    'userPreferences',
    'marketing_consent',
    'beta_consent',
    'admins'
  ];

  for (const collectionName of collections) {
    try {
      // Delete documents where userId is a field
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        await Promise.all(
          querySnapshot.docs.map(doc => deleteDoc(doc.ref))
        );
      }

      // Also try to delete document with userId as the document ID
      const docRef = doc(db, collectionName, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await deleteDoc(docRef);
      }
    } catch (error) {
      console.log(`Error deleting documents from ${collectionName}:`, error);
    }
  }
}

export async function deleteUserAccount(userId: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');

  try {
    // Delete user data
    await deleteUserDocuments(userId);

    // Finally, delete the user authentication account
    await deleteUser(auth.currentUser);
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete account. Please try again.');
  }
}