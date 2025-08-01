import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Chat, ChatState, UUID } from '../types';

interface ChatStore extends ChatState {
  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: UUID, updates: Partial<Chat>) => void;
  removeChat: (chatId: UUID) => void;
  setActiveChat: (chatId: UUID | null) => void;
  incrementUnreadCount: (chatId: UUID) => void;
  resetUnreadCount: (chatId: UUID) => void;
  updateLastMessage: (chatId: UUID, lastMessage: Chat['lastMessage']) => void;
  addParticipant: (chatId: UUID, userId: UUID) => void;
  removeParticipant: (chatId: UUID, userId: UUID) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearChats: () => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      chats: {},
      activeChat: null,
      isLoading: false,
      error: null,

      // Actions
      setChats: (chats) =>
        set(
          {
            chats: chats.reduce(
              (acc, chat) => ({ ...acc, [chat.chatId]: chat }),
              {}
            ),
          },
          false,
          'setChats'
        ),

      addChat: (chat) =>
        set(
          (state) => ({
            chats: { ...state.chats, [chat.chatId]: chat },
          }),
          false,
          'addChat'
        ),

      updateChat: (chatId, updates) =>
        set(
          (state) => {
            const chat = state.chats[chatId];
            if (!chat) return state;

            return {
              chats: {
                ...state.chats,
                [chatId]: { ...chat, ...updates, updatedAt: new Date().toISOString() },
              },
            };
          },
          false,
          'updateChat'
        ),

      removeChat: (chatId) =>
        set(
          (state) => {
            const { [chatId]: removed, ...remainingChats } = state.chats;
            return {
              chats: remainingChats,
              activeChat: state.activeChat === chatId ? null : state.activeChat,
            };
          },
          false,
          'removeChat'
        ),

      setActiveChat: (chatId) =>
        set({ activeChat: chatId }, false, 'setActiveChat'),

      incrementUnreadCount: (chatId) =>
        set(
          (state) => {
            const chat = state.chats[chatId];
            if (!chat) return state;

            return {
              chats: {
                ...state.chats,
                [chatId]: { ...chat, unreadCount: chat.unreadCount + 1 },
              },
            };
          },
          false,
          'incrementUnreadCount'
        ),

      resetUnreadCount: (chatId) =>
        set(
          (state) => {
            const chat = state.chats[chatId];
            if (!chat) return state;

            return {
              chats: {
                ...state.chats,
                [chatId]: { ...chat, unreadCount: 0 },
              },
            };
          },
          false,
          'resetUnreadCount'
        ),

      updateLastMessage: (chatId, lastMessage) =>
        set(
          (state) => {
            const chat = state.chats[chatId];
            if (!chat) return state;

            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  ...chat,
                  lastMessage,
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          },
          false,
          'updateLastMessage'
        ),

      addParticipant: (chatId, userId) =>
        set(
          (state) => {
            const chat = state.chats[chatId];
            if (!chat || chat.participants.includes(userId)) return state;

            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  ...chat,
                  participants: [...chat.participants, userId],
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          },
          false,
          'addParticipant'
        ),

      removeParticipant: (chatId, userId) =>
        set(
          (state) => {
            const chat = state.chats[chatId];
            if (!chat) return state;

            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  ...chat,
                  participants: chat.participants.filter((id) => id !== userId),
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          },
          false,
          'removeParticipant'
        ),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      clearChats: () =>
        set(
          {
            chats: {},
            activeChat: null,
            error: null,
          },
          false,
          'clearChats'
        ),
    }),
    { name: 'ChatStore' }
  )
);

// Selectors
export const selectAllChats = (state: ChatStore) => Object.values(state.chats);
export const selectChatById = (chatId: UUID) => (state: ChatStore) =>
  state.chats[chatId];
export const selectActiveChat = (state: ChatStore) =>
  state.activeChat ? state.chats[state.activeChat] : null;
export const selectChatsByType = (type: Chat['type']) => (state: ChatStore) =>
  Object.values(state.chats).filter((chat) => chat.type === type);
export const selectChatsWithUnread = (state: ChatStore) =>
  Object.values(state.chats).filter((chat) => chat.unreadCount > 0);
export const selectTotalUnreadCount = (state: ChatStore) =>
  Object.values(state.chats).reduce((total, chat) => total + chat.unreadCount, 0);