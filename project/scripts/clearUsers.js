import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_EMAIL = 'kobaiko@gmail.com';

async function clearAllUsersExceptAdmin() {
  const collections = [
    'tasks',
    'credits',
    'userPreferences',
    'marketing_consent',
    'beta_consent'
  ];

  try {
    for (const collectionName of collections) {
      console.log(`Clearing collection: ${collectionName}`);
      
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where('email', '!=', ADMIN_EMAIL));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(async (doc) => {
        try {
          await deleteDoc(doc.ref);
          console.log(`Deleted document ${doc.id} from ${collectionName}`);
        } catch (error) {
          console.error(`Error deleting document ${doc.id}:`, error);
        }
      });

      await Promise.all(deletePromises);
    }

    console.log('Successfully cleared all non-admin user data');
  } catch (error) {
    console.error('Error clearing users:', error);
  } finally {
    process.exit(0);
  }
}

clearAllUsersExceptAdmin();