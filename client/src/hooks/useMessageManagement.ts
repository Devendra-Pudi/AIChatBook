import { useState, useCallback, useEffect } from 'react';
import { useMessageStore, useUserStore, useUIStore } from '../store';
import { messageService, type MessageDraft, type ForwardMessageData } from '../services/supabase/messageService';
import type { MessageContent, UUID } from '../types';

export const useMessageManagement = (chatId?: UUID) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<MessageDraft | null>(null);
  
  const { currentUser } = useUserStore();
  const { addNotification } = useUIStore();
  const { updateMessage, removeMessage } = useMessageStore();

  // Edit message
  const editMessage = useCallback(async (messageId: UUID, newContent: MessageContent) => {
    if (!currentUser) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await messageService.editMessage(messageId, newContent, currentUser.uid);
      
      if (result.success) {
        // Update local store
        updateMessage(messageId, {
          content: newContent,
          edited: true,
          editedAt: new Date().toISOString(),
        });

        addNotification({
          type: 'success',
          title: 'Message Edited',
          message: 'Your message has been updated successfully.',
          read: false,
        });
      } else {
        setError(result.error || 'Failed to edit message');
        addNotification({
          type: 'error',
          title: 'Edit Failed',
          message: result.error || 'Failed to edit message',
          read: false,
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUser, updateMessage, addNotification]);

  // Delete message
  const deleteMessage = useCallback(async (
    messageId: UUID, 
    targetChatId: UUID, 
    deleteForEveryone = false
  ) => {
    if (!currentUser) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await messageService.deleteMessage(messageId, currentUser.uid, deleteForEveryone);
      
      if (result.success) {
        // Remove from local store
        removeMessage(targetChatId, messageId);

        addNotification({
          type: 'success',
          title: 'Message Deleted',
          message: deleteForEveryone 
            ? 'Message deleted for everyone' 
            : 'Message deleted for you',
          read: false,
        });
      } else {
        setError(result.error || 'Failed to delete message');
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: result.error || 'Failed to delete message',
          read: false,
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUser, removeMessage, addNotification]);

  // Forward message
  const forwardMessage = useCallback(async (data: ForwardMessageData) => {
    if (!currentUser) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await messageService.forwardMessage(data, currentUser.uid);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Message Forwarded',
          message: `Message forwarded to ${data.targetChatIds.length} chat${data.targetChatIds.length > 1 ? 's' : ''}`,
          read: false,
        });
      } else {
        setError(result.error || 'Failed to forward message');
        addNotification({
          type: 'error',
          title: 'Forward Failed',
          message: result.error || 'Failed to forward message',
          read: false,
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to forward message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUser, addNotification]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: UUID, emoji: string) => {
    if (!currentUser) {
      setError('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await messageService.toggleReaction(messageId, emoji, currentUser.uid);
      
      if (!result.success) {
        setError(result.error || 'Failed to toggle reaction');
        addNotification({
          type: 'error',
          title: 'Reaction Failed',
          message: result.error || 'Failed to toggle reaction',
          read: false,
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle reaction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUser, addNotification]);

  // Save draft
  const saveDraft = useCallback(async (content: string, replyTo?: UUID) => {
    if (!currentUser || !chatId) {
      return { success: false, error: 'User not authenticated or chat not selected' };
    }

    try {
      const draftData: MessageDraft = {
        chatId,
        content,
        replyTo,
        timestamp: new Date().toISOString(),
      };

      const result = await messageService.saveDraft(draftData, currentUser.uid);
      
      if (result.success) {
        setDraft(draftData);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      return { success: false, error: errorMessage };
    }
  }, [currentUser, chatId]);

  // Load draft
  const loadDraft = useCallback(async () => {
    if (!currentUser || !chatId) {
      return { success: false, error: 'User not authenticated or chat not selected' };
    }

    try {
      const result = await messageService.getDraft(chatId, currentUser.uid);
      
      if (result.success && result.data) {
        setDraft(result.data);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load draft';
      return { success: false, error: errorMessage };
    }
  }, [currentUser, chatId]);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!currentUser || !chatId) {
      return { success: false, error: 'User not authenticated or chat not selected' };
    }

    try {
      const result = await messageService.deleteDraft(chatId, currentUser.uid);
      
      if (result.success) {
        setDraft(null);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      return { success: false, error: errorMessage };
    }
  }, [currentUser, chatId]);

  // Auto-save draft with debouncing
  const autoSaveDraft = useCallback(async (content: string, replyTo?: UUID) => {
    if (!content.trim()) {
      // Delete draft if content is empty
      await deleteDraft();
      return;
    }

    // Debounce auto-save
    const timeoutId = setTimeout(() => {
      saveDraft(content, replyTo);
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [saveDraft, deleteDraft]);

  // Load draft on chat change
  useEffect(() => {
    if (chatId && currentUser) {
      loadDraft();
    } else {
      setDraft(null);
    }
  }, [chatId, currentUser, loadDraft]);

  return {
    loading,
    error,
    draft,
    editMessage,
    deleteMessage,
    forwardMessage,
    toggleReaction,
    saveDraft,
    loadDraft,
    deleteDraft,
    autoSaveDraft,
  };
};