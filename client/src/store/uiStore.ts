import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UIState, NotificationState, UUID } from '../types';

interface UIStore extends UIState {
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveModal: (modal: string | null) => void;
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp'>) => void;
  removeNotification: (id: UUID) => void;
  markNotificationAsRead: (id: UUID) => void;
  clearNotifications: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        theme: 'light',
        sidebarOpen: true,
        activeModal: null,
        notifications: [],
        isOnline: navigator.onLine,

        // Actions
        setTheme: (theme) => set({ theme }, false, 'setTheme'),

        toggleTheme: () =>
          set(
            (state) => ({
              theme: state.theme === 'light' ? 'dark' : 'light',
            }),
            false,
            'toggleTheme'
          ),

        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }, false, 'setSidebarOpen'),

        toggleSidebar: () =>
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'toggleSidebar'
          ),

        setActiveModal: (modal) =>
          set({ activeModal: modal }, false, 'setActiveModal'),

        addNotification: (notification) =>
          set(
            (state) => {
              const newNotification: NotificationState = {
                ...notification,
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                read: false,
              };

              return {
                notifications: [newNotification, ...state.notifications],
              };
            },
            false,
            'addNotification'
          ),

        removeNotification: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'removeNotification'
          ),

        markNotificationAsRead: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            }),
            false,
            'markNotificationAsRead'
          ),

        clearNotifications: () =>
          set({ notifications: [] }, false, 'clearNotifications'),

        setOnlineStatus: (isOnline) =>
          set({ isOnline }, false, 'setOnlineStatus'),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Selectors
export const selectTheme = (state: UIStore) => state.theme;
export const selectSidebarOpen = (state: UIStore) => state.sidebarOpen;
export const selectActiveModal = (state: UIStore) => state.activeModal;
export const selectNotifications = (state: UIStore) => state.notifications;
export const selectUnreadNotifications = (state: UIStore) =>
  state.notifications.filter((n) => !n.read);
export const selectUnreadNotificationCount = (state: UIStore) =>
  state.notifications.filter((n) => !n.read).length;
export const selectIsOnline = (state: UIStore) => state.isOnline;