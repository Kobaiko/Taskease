import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { PricingCard } from '../components/PricingCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PLANS } from '../config/plans';
import { openCheckout } from '../lib/lemonsqueezy';

export function Pricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      await openCheckout(data.url);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Logo size="lg" />
          <h1 className="mt-8 text-4xl font-bold text-gray-900 dark:text-white">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Get started with TaskEase today
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name={PLANS.monthly.name}
            price={PLANS.monthly.price}
            interval={PLANS.monthly.interval}
            features={PLANS.monthly.features}
            onSelect={() => handleSelectPlan(PLANS.monthly.variantId)}
          />
          <PricingCard
            name={PLANS.yearly.name}
            price={PLANS.yearly.price}
            interval={PLANS.yearly.interval}
            features={PLANS.yearly.features}
            onSelect={() => handleSelectPlan(PLANS.yearly.variantId)}
            popular
          />
        </div>
      </div>
    </div>
  );
}