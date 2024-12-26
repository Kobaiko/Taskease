import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserSubscriptionData } from '../services/subscriptionService';
import { LoadingSpinner } from './LoadingSpinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkSubscription() {
      if (!currentUser) {
        setCheckingSubscription(false);
        return;
      }

      try {
        const subscriptionData = await getUserSubscriptionData(currentUser.uid);
        setHasSubscription(!!subscriptionData);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    }

    checkSubscription();
  }, [currentUser]);

  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size={40} className="text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasSubscription && location.pathname !== '/pricing') {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}