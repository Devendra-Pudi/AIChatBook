import { useEffect, useState } from 'react';
import { useMessageStore, useUserStore } from '../store';
import { supabase } from '../config/supabase';
import type { Message, MessageContent, UUID } from '../types';

export const useSupabaseMessages = (chatId?: UUID) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserStore();
  const { 
    setMessages, 
    addMessage, 
    updateMessage, 
    removeMessage,
    markMessageAsRead,
    updateMessageStatus 
  } = useMessageStore();

  // Fetch messages for a specific chat
  const fetchMessages = async (targetChatId: UUID, limit = 50, offset = 0) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', targetChatId)
        .order('timestamp', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        setError(error.message);
        return;
      }

      const messages: Message[] = data.map((messageData) => ({
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
      }));

      if (offset === 0) {
        setMessages(targetChatId, messages);
      } else {
        // Append to existing messages for pagination
        messages.forEach(message => addMessage(message));
      }

      return { success: true, data: messages };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (
    targetChatId: UUID,
    content: MessageContent,
    replyTo?: UUID
  ) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const messageId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        messageId,
        chatId: targetChatId,
        sender: currentUser.uid,
        content,
        timestamp,
        readBy: { [currentUser.uid]: timestamp },
        edited: false,
        replyTo,
        reactions: {},
        type: 'user',
        status: 'sending',
      };

      // Add to store immediately for optimistic UI
      addMessage(optimisticMessage);

      const messageData = {
        message_id: messageId,
        chat_id: targetChatId,
        sender: currentUser.uid,
        content,
        timestamp,
        read_by: { [currentUser.uid]: timestamp },
        edited: false,
        reply_to: replyTo,
        reactions: {},
        type: 'user',
        status: 'sent',
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        // Update message status to failed
        updateMessageStatus(messageId, 'failed');
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Update message status to sent
      updateMessageStatus(messageId, 'sent');

      // Update chat's last message and updated_at
      await supabase
        .from('chats')
        .update({
          updated_at: timestamp,
        })
        .eq('chat_id', targetChatId);

      return { success: true, data: optimisticMessage };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Edit a message
  const editMessage = async (messageId: UUID, newContent: MessageContent) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const editedAt = new Date().toISOString();

      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          edited: true,
          edited_at: editedAt,
        })
        .eq('message_id', messageId)
        .eq('sender', currentUser.uid); // Only allow editing own messages

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      updateMessage(messageId, {
        content: newContent,
        edited: true,
        editedAt,
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: UUID, targetChatId: UUID, deleteForEveryone = false) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      if (deleteForEveryone) {
        // Delete from database
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('message_id', messageId)
          .eq('sender', currentUser.uid); // Only allow deleting own messages

        if (error) {
          setError(error.message);
          return { success: false, error: error.message };
        }

        removeMessage(targetChatId, messageId);
      } else {
        // Mark as deleted for current user only (soft delete)
        const { error } = await supabase
          .from('message_deletions')
          .insert([{
            message_id: messageId,
            user_id: currentUser.uid,
            deleted_at: new Date().toISOString(),
          }]);

        if (error) {
          setError(error.message);
          return { success: false, error: error.message };
        }

        // Remove from local store
        removeMessage(targetChatId, messageId);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: UUID) => {
    if (!currentUser) return;

    try {
      const timestamp = new Date().toISOString();

      const { error } = await supabase
        .from('messages')
        .update({
          read_by: {
            [currentUser.uid]: timestamp,
          },
        })
        .eq('message_id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      markMessageAsRead(messageId, currentUser.uid);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: UUID, emoji: string) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      // Get current reactions
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('message_id', messageId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return { success: false, error: fetchError.message };
      }

      const currentReactions = messageData.reactions || {};
      const emojiReactions = currentReactions[emoji] || [];

      // Toggle reaction
      let updatedReactions;
      if (emojiReactions.includes(currentUser.uid)) {
        // Remove reaction
        const filteredReactions = emojiReactions.filter((id: UUID) => id !== currentUser.uid);
        if (filteredReactions.length === 0) {
          const { [emoji]: removed, ...remainingReactions } = currentReactions;
          updatedReactions = remainingReactions;
        } else {
          updatedReactions = { ...currentReactions, [emoji]: filteredReactions };
        }
      } else {
        // Add reaction
        updatedReactions = { ...currentReactions, [emoji]: [...emojiReactions, currentUser.uid] };
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('message_id', messageId);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      updateMessage(messageId, { reactions: updatedReactions });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reaction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Search messages
  const searchMessages = async (query: string, targetChatId?: UUID) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      let queryBuilder = supabase
        .from('messages')
        .select('*')
        .textSearch('content', query);

      if (targetChatId) {
        queryBuilder = queryBuilder.eq('chat_id', targetChatId);
      }

      const { data, error } = await queryBuilder
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      const messages: Message[] = data.map((messageData) => ({
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
      }));

      return { success: true, data: messages };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search messages';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Initialize messages for current chat
  useEffect(() => {
    if (chatId && currentUser) {
      fetchMessages(chatId);
    }
  }, [chatId, currentUser]);

  return {
    loading,
    error,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    addReaction,
    searchMessages,
  };
};