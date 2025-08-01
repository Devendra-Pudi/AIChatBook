import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { useUserStore, useChatStore, useMessageStore } from '../store';
import type { Message, Chat, User, RealtimePayload, UUID } from '../types';

export const useSupabaseRealtime = () => {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const { currentUser, updateUser } = useUserStore();
  const { addChat, updateChat, removeChat } = useChatStore();
  const { 
    addMessage, 
    updateMessage, 
    removeMessage, 
    addTypingUser, 
    removeTypingUser,
    markMessageAsRead 
  } = useMessageStore();

  // Subscribe to user presence updates
  const subscribeToUserPresence = () => {
    if (!currentUser) return;

    const channelName = 'user-presence';
    
    // Remove existing channel if it exists
    const existingChannel = channelsRef.current.get(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
      channelsRef.current.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Handle presence state changes
        Object.entries(state).forEach(([userId, presence]) => {
          if (userId !== currentUser.uid && presence.length > 0) {
            const userPresence = presence[0] as { status: User['status']; last_seen: string };
            updateUser(userId, {
              status: userPresence.status,
              lastSeen: userPresence.last_seen,
            });
          }
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== currentUser.uid && newPresences.length > 0) {
          const userPresence = newPresences[0] as { status: User['status']; last_seen: string };
          updateUser(key, {
            status: userPresence.status,
            lastSeen: userPresence.last_seen,
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== currentUser.uid) {
          updateUser(key, {
            status: 'offline',
            lastSeen: new Date().toISOString(),
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: currentUser.uid,
            status: currentUser.status,
            last_seen: new Date().toISOString(),
          });
        }
      });

    channelsRef.current.set(channelName, channel);
  };

  // Subscribe to chat updates
  const subscribeToChats = () => {
    if (!currentUser) return;

    const channelName = 'chats';
    
    // Remove existing channel if it exists
    const existingChannel = channelsRef.current.get(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
      channelsRef.current.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${currentUser.uid}}`,
        },
        (payload: RealtimePayload<any>) => {
          const chatData = payload.new;
          const newChat: Chat = {
            chatId: chatData.chat_id,
            type: chatData.type,
            participants: chatData.participants,
            createdAt: chatData.created_at,
            updatedAt: chatData.updated_at,
            unreadCount: 0,
            groupInfo: chatData.group_info ? {
              name: chatData.group_info.name,
              description: chatData.group_info.description,
              admin: chatData.group_info.admin,
              photoURL: chatData.group_info.photo_url,
              settings: chatData.group_info.settings,
            } : undefined,
          };
          addChat(newChat);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${currentUser.uid}}`,
        },
        (payload: RealtimePayload<any>) => {
          const chatData = payload.new;
          const updates: Partial<Chat> = {
            type: chatData.type,
            participants: chatData.participants,
            updatedAt: chatData.updated_at,
            groupInfo: chatData.group_info ? {
              name: chatData.group_info.name,
              description: chatData.group_info.description,
              admin: chatData.group_info.admin,
              photoURL: chatData.group_info.photo_url,
              settings: chatData.group_info.settings,
            } : undefined,
          };
          updateChat(chatData.chat_id, updates);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
        },
        (payload: RealtimePayload<any>) => {
          removeChat(payload.old.chat_id);
        }
      )
      .subscribe();

    channelsRef.current.set(channelName, channel);
  };

  // Subscribe to messages for a specific chat
  const subscribeToMessages = (chatId: UUID) => {
    if (!currentUser) return;

    const channelName = `messages-${chatId}`;
    
    // Remove existing channel if it exists
    const existingChannel = channelsRef.current.get(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
      channelsRef.current.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePayload<any>) => {
          const messageData = payload.new;
          const newMessage: Message = {
            messageId: messageData.message_id,
            chatId: messageData.chat_id,
            sender: messageData.sender,
            content: messageData.content,
            timestamp: messageData.timestamp,
            readBy: messageData.read_by || {},
            edited: messageData.edited || false,
            editedAt: messageData.edited_at,
            replyTo: messageData.reply_to,
            reactions: messageData.reactions || {},
            type: messageData.type,
            status: messageData.status || 'sent',
          };
          addMessage(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePayload<any>) => {
          const messageData = payload.new;
          const updates: Partial<Message> = {
            content: messageData.content,
            readBy: messageData.read_by || {},
            edited: messageData.edited || false,
            editedAt: messageData.edited_at,
            reactions: messageData.reactions || {},
            status: messageData.status || 'sent',
          };
          updateMessage(messageData.message_id, updates);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePayload<any>) => {
          removeMessage(chatId, payload.old.message_id);
        }
      )
      .subscribe();

    channelsRef.current.set(channelName, channel);
  };

  // Subscribe to typing indicators for a specific chat
  const subscribeToTyping = (chatId: UUID) => {
    if (!currentUser) return;

    const channelName = `typing-${chatId}`;
    
    // Remove existing channel if it exists
    const existingChannel = channelsRef.current.get(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
      channelsRef.current.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, is_typing } = payload.payload;
        if (user_id !== currentUser.uid) {
          if (is_typing) {
            addTypingUser(chatId, user_id);
          } else {
            removeTypingUser(chatId, user_id);
          }
        }
      })
      .subscribe();

    channelsRef.current.set(channelName, channel);
  };

  // Send typing indicator
  const sendTypingIndicator = (chatId: UUID, isTyping: boolean) => {
    if (!currentUser) return;

    const channelName = `typing-${chatId}`;
    const channel = channelsRef.current.get(channelName);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.uid,
          is_typing: isTyping,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  // Subscribe to message read receipts
  const subscribeToReadReceipts = (chatId: UUID) => {
    if (!currentUser) return;

    const channelName = `read-receipts-${chatId}`;
    
    // Remove existing channel if it exists
    const existingChannel = channelsRef.current.get(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
      channelsRef.current.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message_read' }, (payload) => {
        const { message_id, user_id, timestamp } = payload.payload;
        if (user_id !== currentUser.uid) {
          markMessageAsRead(message_id, user_id);
        }
      })
      .subscribe();

    channelsRef.current.set(channelName, channel);
  };

  // Send read receipt
  const sendReadReceipt = (chatId: UUID, messageId: UUID) => {
    if (!currentUser) return;

    const channelName = `read-receipts-${chatId}`;
    const channel = channelsRef.current.get(channelName);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'message_read',
        payload: {
          message_id: messageId,
          user_id: currentUser.uid,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  // Unsubscribe from a specific channel
  const unsubscribeFromChannel = (channelName: string) => {
    const channel = channelsRef.current.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelName);
    }
  };

  // Unsubscribe from all channels
  const unsubscribeFromAll = () => {
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
  };

  // Initialize subscriptions when user is authenticated
  useEffect(() => {
    if (currentUser) {
      subscribeToUserPresence();
      subscribeToChats();
    } else {
      unsubscribeFromAll();
    }

    return () => {
      unsubscribeFromAll();
    };
  }, [currentUser]);

  return {
    subscribeToMessages,
    subscribeToTyping,
    subscribeToReadReceipts,
    sendTypingIndicator,
    sendReadReceipt,
    unsubscribeFromChannel,
    unsubscribeFromAll,
  };
};