import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function AccountDeleted() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <Logo size="lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Account Deleted Successfully
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're sorry to see you go. Your account and all associated data have been permanently deleted.
          </p>
          <Link
            to="/register"
            className="inline-block w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}