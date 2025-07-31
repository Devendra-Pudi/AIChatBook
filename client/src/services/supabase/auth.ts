import { supabase } from '../../config/supabase';
import type { 
  User, 
  Session, 
  AuthError, 
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials,
  SignInWithOAuthCredentials,
  Provider
} from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
  photoURL?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: AuthError | null;
}

class SupabaseAuthService {
  // Convert Supabase User to AuthUser
  private convertUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.display_name || user.user_metadata?.full_name,
      photoURL: user.user_metadata?.avatar_url,
      emailVerified: user.email_confirmed_at !== null,
      createdAt: user.created_at,
    };
  }

  // Convert Supabase Session to AuthSession
  private convertSession(session: Session): AuthSession {
    return {
      user: this.convertUser(session.user),
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at || 0,
    };
  }

  // Sign up with email and password
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const credentials: SignUpWithPasswordCredentials = {
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName,
          avatar_url: data.photoURL,
        },
      },
    };

    const { data: authData, error } = await supabase.auth.signUp(credentials);

    return {
      user: authData.user ? this.convertUser(authData.user) : null,
      session: authData.session ? this.convertSession(authData.session) : null,
      error,
    };
  }

  // Sign in with email and password
  async signIn(data: SignInData): Promise<AuthResponse> {
    const credentials: SignInWithPasswordCredentials = {
      email: data.email,
      password: data.password,
    };

    const { data: authData, error } = await supabase.auth.signInWithPassword(credentials);

    return {
      user: authData.user ? this.convertUser(authData.user) : null,
      session: authData.session ? this.convertSession(authData.session) : null,
      error,
    };
  }

  // Sign in with OAuth provider
  async signInWithOAuth(provider: Provider): Promise<{ error: AuthError | null }> {
    const credentials: SignInWithOAuthCredentials = {
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    };

    const { error } = await supabase.auth.signInWithOAuth(credentials);
    return { error };
  }

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Get current session
  async getCurrentSession(): Promise<AuthSession | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? this.convertSession(session) : null;
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? this.convertUser(user) : null;
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  }

  // Update password
  async updatePassword(password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.updateUser({ password });

    return {
      user: data.user ? this.convertUser(data.user) : null,
      session: null,
      error,
    };
  }

  // Update user profile
  async updateProfile(updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar_url: updates.photoURL,
      },
    });

    return {
      user: data.user ? this.convertUser(data.user) : null,
      session: null,
      error,
    };
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session ? this.convertSession(session) : null);
    });
  }

  // Verify email
  async verifyEmail(token: string, type: 'signup' | 'recovery' = 'signup'): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type === 'signup' ? 'email' : 'recovery',
    });

    return {
      user: data.user ? this.convertUser(data.user) : null,
      session: data.session ? this.convertSession(data.session) : null,
      error,
    };
  }

  // Resend verification email
  async resendVerification(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error };
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService();
export default authService;