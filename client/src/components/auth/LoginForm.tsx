import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/icons-material';
import { authService } from '../../services/supabase/auth';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { user, error: signInError } = await authService.signIn({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (user) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      
      // Set specific field errors based on error type
      if (errorMessage.toLowerCase().includes('email')) {
        setFormError('email', { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setFormError('password', { message: errorMessage });
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
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your ChatAI account
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
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            {...register('password')}
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{ mb: 2 }}
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

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <FormControlLabel
              control={<Checkbox {...register('rememberMe')} disabled={loading} />}
              label="Remember me"
            />
            <Link
              to="/forgot-password"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.875rem',
              }}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
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
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 'bold',
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;