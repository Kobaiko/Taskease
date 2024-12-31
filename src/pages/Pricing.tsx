import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PricingCard } from '../components/PricingCard';
import { Logo } from '../components/Logo';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PLANS } from '../config/plans';

export function Pricing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (variantId: string) => {
    if (!currentUser?.email) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    try {
      setError('');
      setLoading(true);

      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variantId,
          email: currentUser.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create checkout');
      }

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to checkout URL
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create checkout. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size={40} className="text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Rest of the component remains the same */}
    </div>
  );
}