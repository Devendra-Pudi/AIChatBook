import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Message, MessageState, UUID } from '../types';

interface MessageStore extends MessageState {
  // Actions
  setMessages: (chatId: UUID, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addMessageToChat: (chatId: UUID, message: Message) => void;
  updateMessage: (messageId: UUID, updates: Partial<Message>) => void;
  removeMessage: (chatId: UUID, messageId: UUID) => void;
  markMessageAsRead: (messageId: UUID, userId: UUID) => void;
  markMessageAsReadWithDetails: (chatId: UUID, messageId: UUID, userId: UUID, timestamp: string) => void;
  addReaction: (messageId: UUID, emoji: string, userId: UUID) => void;
  removeReaction: (messageId: UUID, emoji: string, userId: UUID) => void;
  setTypingUsers: (chatId: UUID, userId: UUID, isTyping: boolean) => void;
  addTypingUser: (chatId: UUID, userId: UUID) => void;
  removeTypingUser: (chatId: UUID, userId: UUID) => void;
  updateMessageStatus: (messageId: UUID, status: Message['status']) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: (chatId?: UUID) => void;
}

export const useMessageStore = create<MessageStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      messages: {},
      typingUsers: {},
      isLoading: false,
      error: null,

      // Actions
      setMessages: (chatId, messages) =>
        set(
          (state) => ({
            messages: { ...state.messages, [chatId]: messages },
          }),
          false,
          'setMessages'
        ),

      addMessage: (message) =>
        set(
          (state) => {
            const chatMessages = state.messages[message.chatId] || [];
            const existingIndex = chatMessages.findIndex(
              (m) => m.messageId === message.messageId
            );

            let updatedMessages;
            if (existingIndex >= 0) {
              // Update existing message
              updatedMessages = [...chatMessages];
              updatedMessages[existingIndex] = message;
            } else {
              // Add new message in chronological order
              updatedMessages = [...chatMessages, message].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            }

            return {
              messages: { ...state.messages, [message.chatId]: updatedMessages },
            };
          },
          false,
          'addMessage'
        ),

      addMessageToChat: (chatId, message) =>
        set(
          (state) => {
            const chatMessages = state.messages[chatId] || [];
            const existingIndex = chatMessages.findIndex(
              (m) => m.messageId === message.messageId
            );

            let updatedMessages;
            if (existingIndex >= 0) {
              // Update existing message
              updatedMessages = [...chatMessages];
              updatedMessages[existingIndex] = message;
            } else {
              // Add new message in chronological order
              updatedMessages = [...chatMessages, message].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            }

            return {
              messages: { ...state.messages, [chatId]: updatedMessages },
            };
          },
          false,
          'addMessageToChat'
        ),

      updateMessage: (messageId, updates) =>
        set(
          (state) => {
            const newMessages = { ...state.messages };
            let messageFound = false;

            // Find and update the message across all chats
            Object.keys(newMessages).forEach((chatId) => {
              const chatMessages = newMessages[chatId];
              const messageIndex = chatMessages.findIndex(
                (m) => m.messageId === messageId
              );

              if (messageIndex >= 0) {
                newMessages[chatId] = [...chatMessages];
                newMessages[chatId][messageIndex] = {
                  ...chatMessages[messageIndex],
                  ...updates,
                };
                messageFound = true;
              }
            });

            return messageFound ? { messages: newMessages } : state;
          },
          false,
          'updateMessage'
        ),

      removeMessage: (chatId, messageId) =>
        set(
          (state) => {
            const chatMessages = state.messages[chatId];
            if (!chatMessages) return state;

            return {
              messages: {
                ...state.messages,
                [chatId]: chatMessages.filter((m) => m.messageId !== messageId),
              },
            };
          },
          false,
          'removeMessage'
        ),

      markMessageAsRead: (messageId, userId) =>
        set(
          (state) => {
            const newMessages = { ...state.messages };
            let messageFound = false;

            Object.keys(newMessages).forEach((chatId) => {
              const chatMessages = newMessages[chatId];
              const messageIndex = chatMessages.findIndex(
                (m) => m.messageId === messageId
              );

              if (messageIndex >= 0) {
                newMessages[chatId] = [...chatMessages];
                newMessages[chatId][messageIndex] = {
                  ...chatMessages[messageIndex],
                  readBy: {
                    ...chatMessages[messageIndex].readBy,
                    [userId]: new Date().toISOString(),
                  },
                };
                messageFound = true;
              }
            });

            return messageFound ? { messages: newMessages } : state;
          },
          false,
          'markMessageAsRead'
        ),

      markMessageAsReadWithDetails: (chatId, messageId, userId, timestamp) =>
        set(
          (state) => {
            const chatMessages = state.messages[chatId];
            if (!chatMessages) return state;

            const messageIndex = chatMessages.findIndex(
              (m) => m.messageId === messageId
            );

            if (messageIndex >= 0) {
              const updatedMessages = [...chatMessages];
              updatedMessages[messageIndex] = {
                ...chatMessages[messageIndex],
                readBy: {
                  ...chatMessages[messageIndex].readBy,
                  [userId]: timestamp,
                },
              };

              return {
                messages: { ...state.messages, [chatId]: updatedMessages },
              };
            }

            return state;
          },
          false,
          'markMessageAsReadWithDetails'
        ),

      addReaction: (messageId, emoji, userId) =>
        set(
          (state) => {
            const newMessages = { ...state.messages };
            let messageFound = false;

            Object.keys(newMessages).forEach((chatId) => {
              const chatMessages = newMessages[chatId];
              const messageIndex = chatMessages.findIndex(
                (m) => m.messageId === messageId
              );

              if (messageIndex >= 0) {
                const message = chatMessages[messageIndex];
                const currentReactions = message.reactions[emoji] || [];

                if (!currentReactions.includes(userId)) {
                  newMessages[chatId] = [...chatMessages];
                  newMessages[chatId][messageIndex] = {
                    ...message,
                    reactions: {
                      ...message.reactions,
                      [emoji]: [...currentReactions, userId],
                    },
                  };
                  messageFound = true;
                }
              }
            });

            return messageFound ? { messages: newMessages } : state;
          },
          false,
          'addReaction'
        ),

      removeReaction: (messageId, emoji, userId) =>
        set(
          (state) => {
            const newMessages = { ...state.messages };
            let messageFound = false;

            Object.keys(newMessages).forEach((chatId) => {
              const chatMessages = newMessages[chatId];
              const messageIndex = chatMessages.findIndex(
                (m) => m.messageId === messageId
              );

              if (messageIndex >= 0) {
                const message = chatMessages[messageIndex];
                const currentReactions = message.reactions[emoji] || [];
                const updatedReactions = currentReactions.filter((id) => id !== userId);

                newMessages[chatId] = [...chatMessages];
                if (updatedReactions.length === 0) {
                  const { [emoji]: removed, ...remainingReactions } = message.reactions;
                  newMessages[chatId][messageIndex] = {
                    ...message,
                    reactions: remainingReactions,
                  };
                } else {
                  newMessages[chatId][messageIndex] = {
                    ...message,
                    reactions: {
                      ...message.reactions,
                      [emoji]: updatedReactions,
                    },
                  };
                }
                messageFound = true;
              }
            });

            return messageFound ? { messages: newMessages } : state;
          },
          false,
          'removeReaction'
        ),

      setTypingUsers: (chatId, userId, isTyping) =>
        set(
          (state) => {
            const currentTyping = state.typingUsers[chatId] || [];
            let updatedTyping;
            
            if (isTyping) {
              updatedTyping = currentTyping.includes(userId) 
                ? currentTyping 
                : [...currentTyping, userId];
            } else {
              updatedTyping = currentTyping.filter(id => id !== userId);
            }
            
            return {
              typingUsers: { ...state.typingUsers, [chatId]: updatedTyping },
            };
          },
          false,
          'setTypingUsers'
        ),

      addTypingUser: (chatId, userId) =>
        set(
          (state) => {
            const currentTyping = state.typingUsers[chatId] || [];
            if (currentTyping.includes(userId)) return state;

            return {
              typingUsers: {
                ...state.typingUsers,
                [chatId]: [...currentTyping, userId],
              },
            };
          },
          false,
          'addTypingUser'
        ),

      removeTypingUser: (chatId, userId) =>
        set(
          (state) => {
            const currentTyping = state.typingUsers[chatId] || [];
            const updatedTyping = currentTyping.filter((id) => id !== userId);

            return {
              typingUsers: {
                ...state.typingUsers,
                [chatId]: updatedTyping,
              },
            };
          },
          false,
          'removeTypingUser'
        ),

      updateMessageStatus: (messageId, status) =>
        set(
          (state) => {
            const newMessages = { ...state.messages };
            let messageFound = false;

            Object.keys(newMessages).forEach((chatId) => {
              const chatMessages = newMessages[chatId];
              const messageIndex = chatMessages.findIndex(
                (m) => m.messageId === messageId
              );

              if (messageIndex >= 0) {
                newMessages[chatId] = [...chatMessages];
                newMessages[chatId][messageIndex] = {
                  ...chatMessages[messageIndex],
                  status,
                };
                messageFound = true;
              }
            });

            return messageFound ? { messages: newMessages } : state;
          },
          false,
          'updateMessageStatus'
        ),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      clearMessages: (chatId) =>
        set(
          (state) => {
            if (chatId) {
              const { [chatId]: removed, ...remainingMessages } = state.messages;
              return { messages: remainingMessages };
            }
            return { messages: {}, typingUsers: {}, error: null };
          },
          false,
          'clearMessages'
        ),
    }),
    { name: 'MessageStore' }
  )
);

// Selectors
export const selectMessagesByChatId = (chatId: UUID) => (state: MessageStore) =>
  state.messages[chatId] || [];
export const selectMessageById = (messageId: UUID) => (state: MessageStore) => {
  for (const chatMessages of Object.values(state.messages)) {
    const message = chatMessages.find((m) => m.messageId === messageId);
    if (message) return message;
  }
  return null;
};
export const selectTypingUsersByChatId = (chatId: UUID) => (state: MessageStore) =>
  state.typingUsers[chatId] || [];
export const selectUnreadMessages = (chatId: UUID, userId: UUID) => (state: MessageStore) => {
  const messages = state.messages[chatId] || [];
  return messages.filter((message) => !message.readBy[userId]);
};
export const selectLastMessage = (chatId: UUID) => (state: MessageStore) => {
  const messages = state.messages[chatId] || [];
  return messages.length > 0 ? messages[messages.length - 1] : null;
};