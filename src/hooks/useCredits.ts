import { useState, useEffect } from 'react';
import { getUserCredits } from '../services/creditService';
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
        const userCredits = await getUserCredits(userId);
        setCredits(userCredits);
      } catch (error) {
        console.error('Error loading credits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCredits();
  }, [userId]);

  const hasAvailableCredits = credits > 0 || 
    (subscriptionData?.trialEndsAt && new Date(subscriptionData.trialEndsAt) > new Date());

  return { credits, loading, hasAvailableCredits };
}