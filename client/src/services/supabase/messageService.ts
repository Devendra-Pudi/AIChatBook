import { supabase } from '../../config/supabase';
import type {  MessageContent, UUID } from '../../types';

export interface MessageDraft {
  chatId: UUID;
  content: string;
  replyTo?: UUID;
  timestamp: string;
}

export interface ForwardMessageData {
  messageId: UUID;
  targetChatIds: UUID[];
  content?: MessageContent;
}

export class MessageService {
  // Edit message with time limit check
  async editMessage(messageId: UUID, newContent: MessageContent, userId: UUID): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the message to check if editing is allowed
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('timestamp, sender')
        .eq('message_id', messageId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Check if user owns the message
      if (messageData.sender !== userId) {
        return { success: false, error: 'You can only edit your own messages' };
      }

      // Check time limit (15 minutes)
      const messageTime = new Date(messageData.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - messageTime.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeDiff > fifteenMinutes) {
        return { success: false, error: 'Messages can only be edited within 15 minutes' };
      }

      const editedAt = new Date().toISOString();

      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          edited: true,
          edited_at: editedAt,
        })
        .eq('message_id', messageId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      return { success: false, error: errorMessage };
    }
  }

  // Delete message with options for self or everyone
  async deleteMessage(
    messageId: UUID, 
    userId: UUID, 
    deleteForEveryone = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the message to check ownership
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('sender, timestamp')
        .eq('message_id', messageId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Check if user owns the message
      if (messageData.sender !== userId) {
        return { success: false, error: 'You can only delete your own messages' };
      }

      if (deleteForEveryone) {
        // Check time limit for delete for everyone (1 hour)
        const messageTime = new Date(messageData.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - messageTime.getTime();
        const oneHour = 60 * 60 * 1000;

        if (timeDiff > oneHour) {
          return { success: false, error: 'Messages can only be deleted for everyone within 1 hour' };
        }

        // Delete from database completely
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('message_id', messageId);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Soft delete - add to message_deletions table
        const { error } = await supabase
          .from('message_deletions')
          .upsert([{
            message_id: messageId,
            user_id: userId,
            deleted_at: new Date().toISOString(),
          }]);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      return { success: false, error: errorMessage };
    }
  }

  // Forward message to multiple chats
  async forwardMessage(data: ForwardMessageData, userId: UUID): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the original message
      const { data: originalMessage, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('message_id', data.messageId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Create forwarded messages for each target chat
      const forwardedMessages = data.targetChatIds.map(chatId => {
        const messageId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        
        return {
          message_id: messageId,
          chat_id: chatId,
          sender: userId,
          content: data.content || originalMessage.content,
          timestamp,
          read_by: { [userId]: timestamp },
          edited: false,
          reply_to: null,
          reactions: {},
          type: 'user' as const,
          status: 'sent' as const,
          forwarded_from: data.messageId, // Track original message
        };
      });

      const { error } = await supabase
        .from('messages')
        .insert(forwardedMessages);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update last message for target chats
      const updatePromises = data.targetChatIds.map(chatId =>
        supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('chat_id', chatId)
      );

      await Promise.all(updatePromises);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to forward message';
      return { success: false, error: errorMessage };
    }
  }

  // Save message draft
  async saveDraft(draft: MessageDraft, userId: UUID): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('message_drafts')
        .upsert([{
          user_id: userId,
          chat_id: draft.chatId,
          content: draft.content,
          reply_to: draft.replyTo,
          created_at: draft.timestamp,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,chat_id'
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      return { success: false, error: errorMessage };
    }
  }

  // Get message draft
  async getDraft(chatId: UUID, userId: UUID): Promise<{ success: boolean; data?: MessageDraft; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('message_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: undefined };
      }

      const draft: MessageDraft = {
        chatId: data.chat_id,
        content: data.content,
        replyTo: data.reply_to,
        timestamp: data.updated_at,
      };

      return { success: true, data: draft };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get draft';
      return { success: false, error: errorMessage };
    }
  }

  // Delete message draft
  async deleteDraft(chatId: UUID, userId: UUID): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('message_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('chat_id', chatId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      return { success: false, error: errorMessage };
    }
  }

  // Toggle message reaction
  async toggleReaction(messageId: UUID, emoji: string, userId: UUID): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current reactions
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('message_id', messageId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      const currentReactions = messageData.reactions || {};
      const emojiReactions = currentReactions[emoji] || [];

      // Toggle reaction
      let updatedReactions;
      if (emojiReactions.includes(userId)) {
        // Remove reaction
        const filteredReactions = emojiReactions.filter((id: UUID) => id !== userId);
        if (filteredReactions.length === 0) {
          const { [emoji]: removed, ...remainingReactions } = currentReactions;
          updatedReactions = remainingReactions;
        } else {
          updatedReactions = { ...currentReactions, [emoji]: filteredReactions };
        }
      } else {
        // Add reaction
        updatedReactions = { ...currentReactions, [emoji]: [...emojiReactions, userId] };
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('message_id', messageId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle reaction';
      return { success: false, error: errorMessage };
    }
  }
}

export const messageService = new MessageService();