import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Save, RefreshCcw, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isUserAdmin, getAllUsers, addAdmin, setUserCredits } from '../services/adminService';

interface User {
  id: string;
  credits: number;
  lastUpdated: Date;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [creditsToSet, setCreditsToSet] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  async function checkAdminAccess() {
    if (!currentUser?.email) {
      navigate('/');
      return;
    }

    const isAdmin = await isUserAdmin(currentUser.email);
    if (!isAdmin) {
      navigate('/');
    }
  }

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser?.email || !newAdminEmail) return;

    try {
      setError('');
      await addAdmin(newAdminEmail, currentUser.email);
      setNewAdminEmail('');
    } catch (err) {
      console.error('Failed to add admin:', err);
      setError('Failed to add admin. Please try again.');
    }
  }

  async function handleSetCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !creditsToSet) return;

    try {
      setError('');
      const credits = parseInt(creditsToSet);
      if (isNaN(credits) || credits < 0) {
        setError('Please enter a valid number of credits');
        return;
      }

      await setUserCredits(selectedUser, credits);
      await loadUsers();
      setSelectedUser(null);
      setCreditsToSet('');
    } catch (err) {
      console.error('Failed to set credits:', err);
      setError('Failed to set credits. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
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
              <Layout className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
            </div>
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Admin</h2>
              <form onSubmit={handleAddAdmin} className="flex gap-3">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newAdminEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus size={16} />
                  Add Admin
                </button>
              </form>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Set Credits</h2>
              <form onSubmit={handleSetCredits} className="space-y-4">
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                >
                  <option value="">Select user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      User ID: {user.id} ({user.credits} credits)
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={creditsToSet}
                    onChange={(e) => setCreditsToSet(e.target.value)}
                    placeholder="Number of credits"
                    min="0"
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!selectedUser || !creditsToSet}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    Set Credits
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users</h2>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            ) : (
              <div className="space-y-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        User ID: {user.id}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: {user.lastUpdated.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {user.credits} credits
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}