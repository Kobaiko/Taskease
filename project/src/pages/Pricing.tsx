import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PricingCard } from '../components/PricingCard';
import { Logo } from '../components/Logo';
import { PLANS } from '../config/plans';
import { createCheckout } from '../services/lemonsqueezyService';

export function Pricing() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSelectPlan = async (variantId: string) => {
    if (!currentUser) {
      navigate('/register');
      return;
    }

    try {
      setError('');
      const checkoutUrl = await createCheckout(variantId, currentUser.email!);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setError(error instanceof Error ? error.message : 'Failed to create checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Logo size="lg" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose a plan that works for you
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            <ArrowLeft size={20} />
            <span>Go back to my Dashboard</span>
          </button>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            {...PLANS.monthly}
            onSelect={() => handleSelectPlan(PLANS.monthly.variantId)}
          />
          <PricingCard
            {...PLANS.yearly}
            popular
            onSelect={() => handleSelectPlan(PLANS.yearly.variantId)}
          />
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          By subscribing, you agree to our Terms of Service and Privacy Policy.<br />
          You can cancel your subscription at any time.
        </div>
      </div>
    </div>
  );
}