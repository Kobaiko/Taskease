import React from 'react';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
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
    <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl ${
      popular ? 'ring-2 ring-purple-500' : ''
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{name}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">${price}</span>
          <span className="text-gray-500 dark:text-gray-400">/{interval}</span>
        </div>

        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            popular
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
          }`}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}