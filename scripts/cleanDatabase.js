import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
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

async function cleanDatabase() {
  const collections = [
    'users',
    'tasks',
    'credits',
    'userPreferences',
    'marketing_consent',
    'beta_consent',
    'admins',
    'user_subscriptions'
  ];

  try {
    for (const collectionName of collections) {
      console.log(`Clearing collection: ${collectionName}`);
      
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
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

    console.log('Successfully cleared all collections');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    process.exit(0);
  }
}

cleanDatabase(); 