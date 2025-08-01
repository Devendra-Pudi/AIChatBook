import { useEffect, useState } from 'react';
import { useUserStore } from '../store';
import { supabase } from '../config/supabase';
import type { User, UUID } from '../types';

export const useSupabaseUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, addUser, addUsers, updateUser } = useUserStore();

  // Fetch user by ID
  const fetchUser = async (userId: UUID) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', userId)
        .single();

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      const user: User = {
        uid: data.uid,
        email: data.email,
        displayName: data.display_name,
        photoURL: data.photo_url,
        bio: data.bio,
        status: data.status,
        lastSeen: data.last_seen,
        createdAt: data.created_at,
        settings: data.settings,
      };

      addUser(user);
      return { success: true, data: user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch multiple users by IDs
  const fetchUsers = async (userIds: UUID[]) => {
    if (userIds.length === 0) return { success: true, data: [] };

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('uid', userIds);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      const users: User[] = data.map((userData) => ({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.display_name,
        photoURL: userData.photo_url,
        bio: userData.bio,
        status: userData.status,
        lastSeen: userData.last_seen,
        createdAt: userData.created_at,
        settings: userData.settings,
      }));

      addUsers(users);
      return { success: true, data: users };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Search users by display name or email
  const searchUsers = async (query: string, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('uid, email, display_name, photo_url, status')
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      const users = data.map((userData) => ({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.display_name,
        photoURL: userData.photo_url,
        status: userData.status,
      }));

      return { success: true, data: users };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search users';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('users')
        .update({
          display_name: updates.displayName,
          photo_url: updates.photoURL,
          bio: updates.bio,
          settings: updates.settings,
        })
        .eq('uid', currentUser.uid);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      updateUser(currentUser.uid, updates);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateStatus = async (status: User['status']) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const lastSeen = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .update({
          status,
          last_seen: lastSeen,
        })
        .eq('uid', currentUser.uid);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      updateUser(currentUser.uid, { status, lastSeen });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user settings
  const updateSettings = async (settings: Partial<User['settings']>) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const updatedSettings = { ...currentUser.settings, ...settings };

      const { error } = await supabase
        .from('users')
        .update({ settings: updatedSettings })
        .eq('uid', currentUser.uid);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      updateUser(currentUser.uid, { settings: updatedSettings });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get online users
  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('uid, display_name, photo_url, status, last_seen')
        .eq('status', 'online');

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      const users = data.map((userData) => ({
        uid: userData.uid,
        displayName: userData.display_name,
        photoURL: userData.photo_url,
        status: userData.status,
        lastSeen: userData.last_seen,
      }));

      return { success: true, data: users };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch online users';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchUser,
    fetchUsers,
    searchUsers,
    updateProfile,
    updateStatus,
    updateSettings,
    fetchOnlineUsers,
  };
};