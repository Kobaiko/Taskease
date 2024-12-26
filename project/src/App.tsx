import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Pricing } from './pages/Pricing';
import { AccountDeleted } from './pages/AccountDeleted';
import { DeleteFeedback } from './pages/DeleteFeedback';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/account-deleted" element={<AccountDeleted />} />
          <Route path="/delete-feedback" element={<DeleteFeedback />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <AdminDashboard />
              </AuthGuard>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}