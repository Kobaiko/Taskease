import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PricingCard } from '../components/PricingCard';
import { Logo } from '../components/Logo';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PLANS } from '../config/plans';
import { createCheckout } from '../services/lemonsqueezy/api';

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
      const checkoutUrl = await createCheckout(variantId, currentUser.email);
      if (!checkoutUrl) {
        throw new Error('Failed to create checkout');
      }
      window.location.href = checkoutUrl;
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
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft size={20} />
                <span className="text-sm">Back to App</span>
              </Link>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
              <Logo size="sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Get started with TaskEase today and boost your productivity
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
      </main>
    </div>
  );
}