import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  GitHub,
  Facebook,
  CheckCircle,
} from '@mui/icons-material';
import { authService } from '../../services/supabase/auth';

// Validation schema
const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .min(2, 'Display name must be at least 2 characters')
      .max(50, 'Display name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { user, error: signUpError } = await authService.signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (user) {
        setSuccess(true);
        
        // Redirect to email verification page after a short delay
        setTimeout(() => {
          navigate('/verify-email');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      
      // Set specific field errors based on error type
      if (errorMessage.toLowerCase().includes('email')) {
        setFormError('email', { message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    setLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await authService.signInWithOAuth(provider);
      
      if (oauthError) {
        throw new Error(oauthError.message);
      }

      // OAuth redirect will handle navigation
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[strength - 1] || '' };
  };

  const passwordStrength = getPasswordStrength(password || '');

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
          <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Registration Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            We've sent a verification email to your address. Please check your inbox and click the verification link to activate your account.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to verification page...
          </Typography>
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
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join ChatAI and start connecting
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('displayName')}
            fullWidth
            label="Display Name"
            autoComplete="name"
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            {...register('email')}
            fullWidth
            label="Email Address"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            {...register('password')}
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{ mb: 1 }}
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {password && (
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Password strength: {passwordStrength.label}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  backgroundColor: 'grey.200',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    height: '100%',
                    backgroundColor:
                      passwordStrength.strength <= 2
                        ? 'error.main'
                        : passwordStrength.strength <= 3
                        ? 'warning.main'
                        : 'success.main',
                    transition: 'all 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          )}

          <TextField
            {...register('confirmPassword')}
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            sx={{ mb: 2 }}
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                {...register('acceptTerms')}
                disabled={loading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link to="/terms" style={{ textDecoration: 'none' }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" style={{ textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
              </Typography>
            }
            sx={{ mb: 3 }}
          />
          {errors.acceptTerms && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: -2, mb: 2 }}>
              {errors.acceptTerms.message}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Or continue with
            </Typography>
          </Divider>

          <Box display="flex" gap={1} mb={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHub />}
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
            >
              GitHub
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook />}
              onClick={() => handleOAuthSignIn('facebook')}
              disabled={loading}
            >
              Facebook
            </Button>
          </Box>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 'bold',
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterForm;