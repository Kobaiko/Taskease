import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogOut, AlertCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PhotoUpload } from '../components/PhotoUpload';
import { uploadUserPhoto, updateUserProfile, updateUserEmail, updateUserPassword, deleteUserAccount } from '../services/userService';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function UserProfile() {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleUpdateProfile = async (file?: File) => {
    try {
      setLoading(true);
      setError('');
      
      let photoURL = currentUser?.photoURL;
      if (file) {
        photoURL = await uploadUserPhoto(file, currentUser?.uid);
      }

      await updateUserProfile({
        displayName: displayName || currentUser?.displayName,
        photoURL
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setLoading(true);
      setError('');
      await updateUserEmail(newEmail);
      setSuccess('Verification email sent! Please check your new email address and click the verification link to complete the email change.');
      setNewEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) return;

    if (newPassword !== confirmNewPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      setError('');
      await updateUserPassword(newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmNewPassword('');
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
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');
      if (!currentUser?.uid) throw new Error('No user found');
      await deleteUserAccount(currentUser.uid);
      navigate('/delete-feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Profile</h1>
              </div>
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

            <div className="mb-8 flex flex-col items-center">
              <PhotoUpload
                currentPhotoURL={currentUser?.photoURL}
                onPhotoSelect={handleUpdateProfile}
                className="mb-4"
              />
              <input
                type="text"
                placeholder={currentUser?.displayName || 'Enter your name'}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-xs px-4 py-2 text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
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
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                      placeholder="Enter new email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newEmail}
                    className="w-full btn btn-primary flex items-center justify-center"
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
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmNewPassword}
                    className="w-full btn btn-primary flex items-center justify-center"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Management</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete my account
                  </button>
                </div>
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
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete all your TaskEase Data and Profile? This cannot be undone!"
        confirmText="Yes, please delete all my data and profile"
        cancelText="Keep my Data and profile"
        confirmButtonClassName="text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50 text-sm"
        cancelButtonClassName="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      />
    </div>
  );
}