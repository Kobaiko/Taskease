import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export function DeleteFeedback() {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const navigate = useNavigate();

  const reasons = [
    'Performance issues',
    'Too complicated to use',
    'Found another solution',
    'Not meeting my needs',
    'Privacy concerns',
    'Missing features',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you can implement the feedback submission logic
    // For now, we'll just redirect to login
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              We're sorry to see you go
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your account and all associated data have been successfully deleted.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Would you mind telling us why you left?
              </label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label key={r} className="flex items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please specify:
                </label>
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Tell us more..."
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Submit & Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
