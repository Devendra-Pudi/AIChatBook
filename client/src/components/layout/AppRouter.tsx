import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  EmailVerificationPage,
  ProtectedRoute,
  OAuthCallback,
} from '../auth';
import { ChatPage } from '../chat';
import { Box, CircularProgress } from '@mui/material';

const AppRouter: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordForm />
          }
        />

        {/* Email verification route */}
        <Route
          path="/verify-email"
          element={<EmailVerificationPage />}
        />

        {/* OAuth callback route */}
        <Route
          path="/auth/callback"
          element={<OAuthCallback />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireEmailVerification={true}>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;