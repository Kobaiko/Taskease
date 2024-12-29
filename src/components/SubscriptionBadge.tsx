import React from 'react';
import { Star } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';

export function SubscriptionBadge() {
  const { currentUser } = useAuth();
  const { subscriptionData } = useSubscription(currentUser?.uid);

  if (!subscriptionData?.isSubscribed) return null;

  return (
    <div className="flex items-center gap-1 text-yellow-500">
      <Star className="w-4 h-4 fill-current" />
      <span className="text-xs font-medium">Premium</span>
    </div>
  );
}