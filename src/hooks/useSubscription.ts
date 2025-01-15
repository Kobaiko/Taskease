import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserSubscriptionData {
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionRenewsAt?: string;
  credits: number;
  isSubscribed?: boolean;
}

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
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSubscriptionData({
            subscriptionId: userData.subscriptionId,
            subscriptionStatus: userData.subscriptionStatus,
            subscriptionRenewsAt: userData.subscriptionRenewsAt,
            credits: userData.credits || 0,
            isSubscribed: userData.subscriptionStatus === 'active'
          });
        } else {
          setSubscriptionData(null);
        }
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