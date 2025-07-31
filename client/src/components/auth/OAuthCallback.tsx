import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { authService } from '../../services/supabase/auth';

const OAuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the current session after OAuth redirect
        const session = await authService.getCurrentSession();
        
        if (session) {
          // Successful authentication, redirect to main app
          navigate('/', { replace: true });
        } else {
          // Check for error in URL params
          const errorDescription = searchParams.get('error_description');
          const error = searchParams.get('error');
          
          if (error || errorDescription) {
            throw new Error(errorDescription || error || 'OAuth authentication failed');
          } else {
            throw new Error('Authentication failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError((error as Error).message);
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1">
          Completing authentication...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
        sx={{ p: 2 }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Authentication Error
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to login page...
          </Typography>
        </Alert>
      </Box>
    );
  }

  return null;
};

export default OAuthCallback;