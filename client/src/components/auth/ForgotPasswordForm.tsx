import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { ArrowBack, Email } from '@mui/icons-material';
import { authService } from '../../services/supabase/auth';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await authService.resetPassword(data.email);
      
      if (resetError) {
        throw new Error(resetError.message);
      }
      
      setSuccess(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          <Email color="primary" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Check Your Email
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </Typography>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            startIcon={<ArrowBack />}
          >
            Back to Login
          </Button>
        </Paper>
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
        }}
      >
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Forgot Password?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('email')}
            fullWidth
            label="Email Address"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Box textAlign="center">
            <Button
              component={Link}
              to="/login"
              startIcon={<ArrowBack />}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordForm;