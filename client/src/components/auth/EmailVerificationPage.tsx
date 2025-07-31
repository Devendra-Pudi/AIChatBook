import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email, CheckCircle, Refresh } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/supabase/auth';

const EmailVerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { currentUser, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is already verified
    if (isEmailVerified) {
      navigate('/', { replace: true });
    }
  }, [isEmailVerified, navigate]);

  useEffect(() => {
    // Redirect if no user is logged in
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleResendVerification = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error: resendError } = await authService.resendVerification(currentUser.email);
      
      if (resendError) {
        throw new Error(resendError.message);
      }
      
      setResendSuccess(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!currentUser) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ backgroundColor: 'grey.50', p: 2 }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        {isEmailVerified ? (
          <>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Email Verified!
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Your email has been successfully verified. You can now access all features of ChatAI.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              size="large"
            >
              Continue to ChatAI
            </Button>
          </>
        ) : (
          <>
            <Email color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              We've sent a verification email to:
            </Typography>
            <Typography variant="body1" fontWeight="bold" mb={3}>
              {currentUser.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Please check your inbox and click the verification link to activate your account.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {resendSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Verification email sent successfully! Please check your inbox.
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="outlined"
                onClick={handleResendVerification}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </Button>

              <Button
                variant="text"
                onClick={handleRefresh}
                startIcon={<CheckCircle />}
              >
                I've Verified My Email
              </Button>

              <Typography variant="caption" color="text.secondary" mt={2}>
                Didn't receive the email? Check your spam folder or try resending.
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default EmailVerificationPage;