import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  type User,
  type UserCredential,
  type AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

githubProvider.setCustomParameters({
  prompt: 'consent',
});

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: any;
  createdAt: any;
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

// Registration data interface
export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
}

// Authentication service class
export class AuthService {
  // Email/Password Registration
  static async registerWithEmail(data: RegistrationData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore
      await this.createUserProfile(userCredential.user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      return userCredential;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Email/Password Sign In
  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update user status to online
      await this.updateUserStatus(userCredential.user.uid, 'online');
      
      return userCredential;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Google OAuth Sign In
  static async signInWithGoogle(): Promise<UserCredential> {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      
      // Check if this is a new user and create profile if needed
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        await this.createUserProfile(userCredential.user);
      }
      
      // Update user status to online
      await this.updateUserStatus(userCredential.user.uid, 'online');
      
      return userCredential;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // GitHub OAuth Sign In
  static async signInWithGithub(): Promise<UserCredential> {
    try {
      const userCredential = await signInWithPopup(auth, githubProvider);
      
      // Check if this is a new user and create profile if needed
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        await this.createUserProfile(userCredential.user);
      }
      
      // Update user status to online
      await this.updateUserStatus(userCredential.user.uid, 'online');
      
      return userCredential;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Facebook OAuth Sign In
  static async signInWithFacebook(): Promise<UserCredential> {
    try {
      const userCredential = await signInWithPopup(auth, facebookProvider);
      
      // Check if this is a new user and create profile if needed
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        await this.createUserProfile(userCredential.user);
      }
      
      // Update user status to online
      await this.updateUserStatus(userCredential.user.uid, 'online');
      
      return userCredential;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Sign Out
  static async signOut(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Update user status to offline before signing out
        await this.updateUserStatus(currentUser.uid, 'offline');
      }
      
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Password Reset
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Resend Email Verification
  static async resendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      await sendEmailVerification(user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Create user profile in Firestore
  private static async createUserProfile(
    user: User,
    additionalData?: { displayName?: string; photoURL?: string }
  ): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: additionalData?.displayName || user.displayName || '',
      photoURL: additionalData?.photoURL || user.photoURL || undefined,
      bio: '',
      status: 'online',
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      settings: {
        theme: 'light',
        notifications: true,
        privacy: {
          showLastSeen: true,
          showOnlineStatus: true,
        },
        aiPreferences: {
          personality: 'helpful',
          responseLength: 'medium',
        },
      },
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
  }

  // Update user status
  private static async updateUserStatus(
    uid: string,
    status: 'online' | 'away' | 'busy' | 'offline'
  ): Promise<void> {
    await setDoc(
      doc(db, 'users', uid),
      {
        status,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Handle authentication errors
  private static handleAuthError(error: AuthError): Error {
    let message = 'An authentication error occurred';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in popup was closed before completion';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Only one popup request is allowed at a time';
        break;
      default:
        message = error.message;
    }

    return new Error(message);
  }

  // Get current user profile
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Check if username is available
  static async isUsernameAvailable(username: string): Promise<boolean> {
    // This would typically query a separate usernames collection
    // For now, we'll just check if the username is not empty and meets basic criteria
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  }
}

export default AuthService;