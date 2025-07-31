import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService, type AuthUser, type AuthSession } from '../services/supabase/auth';
import { supabase } from '../config/supabase';

// User profile interface (extended from AuthUser)
export interface UserProfile extends AuthUser {
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    privacy: {
      showLastSeen: boolean;
      showOnlineStatus: boolean;
    };
    aiPreferences: {
      personality: string;
      responseLength: 'short' | 'medium' | 'long';
    };
  };
}

// Auth context interface
interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const initialSession = await authService.getCurrentSession();
        if (initialSession) {
          setSession(initialSession);
          setCurrentUser(initialSession.user);
          await fetchUserProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for authentication state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (newSession) => {
      setSession(newSession);
      
      if (newSession?.user) {
        setCurrentUser(newSession.user);
        await fetchUserProfile(newSession.user.id);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Computed values
  const isAuthenticated = !!currentUser;
  const isEmailVerified = currentUser?.emailVerified ?? false;

  const value: AuthContextType = {
    currentUser,
    userProfile,
    session,
    loading,
    isAuthenticated,
    isEmailVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;