import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface CreditsExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsExhaustedModal({ isOpen, onClose }: CreditsExhaustedModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Logo size="sm" />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Out of Credits
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upgrade now to create more tasks with AI-powered breakdowns.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
            <div className="text-sm text-purple-900 dark:text-purple-100">
              <div className="font-medium mb-2">Premium Features:</div>
              <ul className="space-y-1">
                <li>• 150 tasks per month</li>
                <li>• AI-powered task breakdown</li>
                <li>• Unlimited subtasks</li>
                <li>• Priority support</li>
                <li>• Cancel anytime</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                navigate('/pricing');
                onClose();
              }}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Upgrade Now
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              I Don't want more AI generated tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}