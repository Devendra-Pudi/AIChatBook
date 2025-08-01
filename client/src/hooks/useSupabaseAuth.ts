import { useEffect, useState } from 'react';
import { useUserStore } from '../store';
import { supabase } from '../config/supabase';
import type { User, LoginForm, RegisterForm } from '../types';

export const useSupabaseAuth = () => {
  const [loading, setLoading] = useState(true);
  const { setCurrentUser, setAuthenticated, setError } = useUserStore();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else if (session?.user) {
          // Fetch user profile data
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('uid', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile as User);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch user profile data
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('uid', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile as User);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setCurrentUser, setAuthenticated, setError]);

  const signIn = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: RegisterForm) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            display_name: credentials.displayName,
          },
        },
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Create user profile in database
      if (data.user) {
        const userProfile: Partial<User> = {
          uid: data.user.id,
          email: credentials.email,
          displayName: credentials.displayName,
          status: 'online',
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          settings: {
            theme: 'light',
            notifications: true,
            privacy: {
              showLastSeen: true,
              showOnlineStatus: true,
              allowGroupInvites: true,
              readReceipts: true,
            },
            aiPreferences: {
              defaultPersonality: {
                id: 'default',
                name: 'Assistant',
                description: 'Helpful AI assistant',
                systemPrompt: 'You are a helpful AI assistant.',
                temperature: 0.7,
                maxTokens: 1000,
              },
              responseLength: 'medium',
              enableSuggestions: true,
              autoTranslate: false,
            },
          },
        };

        const { error: profileError } = await supabase
          .from('users')
          .insert([userProfile]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
};