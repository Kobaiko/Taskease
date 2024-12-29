import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, User, Settings, LogOut, Mail, Lock, AlertCircle, Shield, Trash2, CreditCard, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { ConfirmDialog } from './ConfirmDialog';
import { PhotoUpload } from './PhotoUpload';
import { updateUserProfile, updateUserEmail, updateUserPassword, deleteUserAccount } from '../services/userService';
import { isUserAdmin } from '../services/adminService';
import { useSubscription } from '../hooks/useSubscription';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePasswordInput, setShowDeletePasswordInput] = useState(false);
  
  const { currentUser, logout, reauthenticate } = useAuth();
  const { subscriptionData } = useSubscription(currentUser?.uid);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.email) {
      checkAdminStatus(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  const checkAdminStatus = async (email: string) => {
    try {
      const adminStatus = await isUserAdmin(email);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleUpdateProfile = async (file?: File) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      
      let photoURL = currentUser.photoURL;
      if (file) {
        // Handle photo upload if needed
      }

      await updateUserProfile({
        displayName,
        photoURL
      });

      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) return;

    try {
      setLoading(true);
      setError('');
      await reauthenticate(currentPassword);
      await updateUserEmail(newEmail);
      setSuccess('Email updated successfully');
      setNewEmail('');
      setCurrentPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update email');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      setError('');
      await reauthenticate(currentPassword);
      await updateUserPassword(newPassword);
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!currentUser?.uid) throw new Error('No user found');
      
      if (!deletePassword) {
        setShowDeletePasswordInput(true);
        return;
      }

      setLoading(true);
      setError('');
      await reauthenticate(deletePassword);
      await deleteUserAccount(currentUser.uid);
      onClose();
      navigate('/delete-feedback');
    } catch (error) {
      console.error('Delete account error:', error);
      setError('Failed to delete account. Please verify your password and try again.');
    } finally {
      setLoading(false);
      setDeletePassword('');
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                {subscriptionData?.isSubscribed && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs font-medium">Premium</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <p className="text-sm">{success}</p>
              </div>
            )}

            <div className="flex flex-col items-center mb-8">
              <PhotoUpload className="mb-4" />
              <input
                type="text"
                placeholder={currentUser.displayName || 'Enter your name'}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-xs px-4 py-2 text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
              />
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Update Email</h3>
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="New email"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="Current password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newEmail || !currentPassword}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Email
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Update Password</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="Current password"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="New password"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Subscription</h3>
                <button
                  onClick={() => {
                    if (subscriptionData?.isSubscribed) {
                      window.open('https://taskease.lemonsqueezy.com/billing', '_blank');
                    } else {
                      navigate('/pricing');
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  {subscriptionData?.isSubscribed ? 'Manage Subscription' : 'Subscribe Now'}
                </button>
              </div>

              {isAdmin && (
                <div className="flex justify-center">
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg font-medium"
                    onClick={onClose}
                  >
                    <Shield className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Log Out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete my profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setShowDeletePasswordInput(false);
          setDeletePassword('');
          setError('');
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message={
          showDeletePasswordInput ? (
            <div className="space-y-4">
              <p>Please enter your password to confirm account deletion:</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            "Are you sure you want to delete all your TaskEase Data and Profile? This cannot be undone!"
          )
        }
        confirmText={showDeletePasswordInput ? "Delete forever" : "Delete forever"}
        cancelText={showDeletePasswordInput ? "Cancel!" : "Cancel!"}
        confirmButtonClassName="text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50 text-xs font-normal underline py-1"
        cancelButtonClassName="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 font-medium text-white px-6 py-2 rounded-lg"
        reverseButtonOrder={true}
      />
    </>
  );
}