import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, UserState, UUID } from '../types';

interface UserStore extends UserState {
  // Actions
  setCurrentUser: (user: User | null) => void;
  updateUser: (userId: UUID, updates: Partial<User>) => void;
  addUser: (user: User) => void;
  addUsers: (users: User[]) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateUserStatus: (userId: UUID, status: User['status']) => void;
  updateUserStatusWithTimestamp: (userId: UUID, status: User['status'], lastSeen: string) => void;
  setUserOnlineStatus: (userId: UUID, status: 'online' | 'offline') => void;
  updateUserSettings: (userId: UUID, settings: Partial<User['settings']>) => void;
  clearUsers: () => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        users: {},
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setCurrentUser: (user) =>
          set(
            (state) => ({
              currentUser: user,
              isAuthenticated: !!user,
              users: user ? { ...state.users, [user.uid]: user } : state.users,
            }),
            false,
            'setCurrentUser'
          ),

        updateUser: (userId, updates) =>
          set(
            (state) => {
              const user = state.users[userId];
              if (!user) return state;

              const updatedUser = { ...user, ...updates };
              return {
                users: { ...state.users, [userId]: updatedUser },
                currentUser:
                  state.currentUser?.uid === userId
                    ? updatedUser
                    : state.currentUser,
              };
            },
            false,
            'updateUser'
          ),

        addUser: (user) =>
          set(
            (state) => ({
              users: { ...state.users, [user.uid]: user },
            }),
            false,
            'addUser'
          ),

        addUsers: (users) =>
          set(
            (state) => {
              const newUsers = users.reduce(
                (acc, user) => ({ ...acc, [user.uid]: user }),
                {}
              );
              return {
                users: { ...state.users, ...newUsers },
              };
            },
            false,
            'addUsers'
          ),

        setAuthenticated: (isAuthenticated) =>
          set({ isAuthenticated }, false, 'setAuthenticated'),

        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

        setError: (error) => set({ error }, false, 'setError'),

        updateUserStatus: (userId, status) =>
          set(
            (state) => {
              const user = state.users[userId];
              if (!user) return state;

              const updatedUser = {
                ...user,
                status,
                lastSeen: new Date().toISOString(),
              };

              return {
                users: { ...state.users, [userId]: updatedUser },
                currentUser:
                  state.currentUser?.uid === userId
                    ? updatedUser
                    : state.currentUser,
              };
            },
            false,
            'updateUserStatus'
          ),

        updateUserStatusWithTimestamp: (userId, status, lastSeen) =>
          set(
            (state) => {
              const user = state.users[userId];
              if (!user) return state;

              const updatedUser = {
                ...user,
                status,
                lastSeen,
              };

              return {
                users: { ...state.users, [userId]: updatedUser },
                currentUser:
                  state.currentUser?.uid === userId
                    ? updatedUser
                    : state.currentUser,
              };
            },
            false,
            'updateUserStatusWithTimestamp'
          ),

        setUserOnlineStatus: (userId, status) =>
          set(
            (state) => {
              const user = state.users[userId];
              if (!user) return state;

              const userStatus = status === 'online' ? 'online' : 'offline';
              const updatedUser = {
                ...user,
                status: userStatus,
                lastSeen: new Date().toISOString(),
              };

              return {
                users: { ...state.users, [userId]: updatedUser },
                currentUser:
                  state.currentUser?.uid === userId
                    ? updatedUser
                    : state.currentUser,
              };
            },
            false,
            'setUserOnlineStatus'
          ),

        updateUserSettings: (userId, settings) =>
          set(
            (state) => {
              const user = state.users[userId];
              if (!user) return state;

              const updatedUser = {
                ...user,
                settings: { ...user.settings, ...settings },
              };

              return {
                users: { ...state.users, [userId]: updatedUser },
                currentUser:
                  state.currentUser?.uid === userId
                    ? updatedUser
                    : state.currentUser,
              };
            },
            false,
            'updateUserSettings'
          ),

        clearUsers: () =>
          set(
            (state) => ({
              users: state.currentUser
                ? { [state.currentUser.uid]: state.currentUser }
                : {},
            }),
            false,
            'clearUsers'
          ),

        logout: () =>
          set(
            {
              currentUser: null,
              users: {},
              isAuthenticated: false,
              error: null,
            },
            false,
            'logout'
          ),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'UserStore' }
  )
);

// Selectors
export const selectCurrentUser = (state: UserStore) => state.currentUser;
export const selectIsAuthenticated = (state: UserStore) => state.isAuthenticated;
export const selectUserById = (userId: UUID) => (state: UserStore) =>
  state.users[userId];
export const selectAllUsers = (state: UserStore) => Object.values(state.users);
export const selectOnlineUsers = (state: UserStore) =>
  Object.values(state.users).filter((user) => user.status === 'online');