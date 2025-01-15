import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSubscription } from './useSubscription';

export function useCredits(userId: string | undefined) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const { subscriptionData } = useSubscription(userId);

  useEffect(() => {
    async function loadCredits() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setCredits(userDoc.data().credits || 0);
        }
      } catch (error) {
        console.error('Error loading credits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCredits();
  }, [userId]);

  const hasAvailableCredits = credits > 0 || 
    (subscriptionData?.subscriptionStatus === 'active');

  return { credits, loading, hasAvailableCredits };
}