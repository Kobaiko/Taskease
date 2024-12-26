import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';

export function SubscriptionStatus() {
  const { currentUser } = useAuth();
  const { subscriptionData } = useSubscription(currentUser?.uid);

  // Don't show anything if there's no subscription data
  if (!subscriptionData) return null;

  return null; // We're not showing any status in the UI
}