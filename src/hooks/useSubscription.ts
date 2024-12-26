import { useState, useEffect } from 'react';
import { getUserSubscriptionData } from '../services/subscriptionService';
import type { UserSubscriptionData } from '../types/subscription';

export function useSubscription(userId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<UserSubscriptionData | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserSubscriptionData(userId);
        setSubscriptionData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [userId]);

  return { loading, error, subscriptionData };
}