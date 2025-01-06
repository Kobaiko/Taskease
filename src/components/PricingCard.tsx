import React from 'react';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: readonly string[];
  onSelect: () => void;
  popular?: boolean;
}

export function PricingCard({
  name,
  price,
  interval,
  features,
  onSelect,
  popular = false
}: PricingCardProps) {
  return (
    <div
      className={`rounded-2xl p-8 ${
        popular
          ? 'bg-purple-600 text-white shadow-purple-200'
          : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
      }`}
    >
      <h3 className="text-2xl font-bold">{name}</h3>
      <p className="mt-4">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-sm ml-1">/{interval}</span>
      </p>
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check
              size={20}
              className={popular ? 'text-white' : 'text-purple-600 dark:text-purple-400'}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`mt-8 w-full rounded-lg py-3 px-6 font-medium ${
          popular
            ? 'bg-white text-purple-600 hover:bg-gray-50'
            : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}