import { useEffect, useState } from 'react';
import { useChatStore, useUserStore } from '../store';
import { supabase } from '../config/supabase';
import type { Chat, GroupInfo, UUID } from '../types';

export const useSupabaseChats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserStore();
  const { setChats, addChat, updateChat, removeChat } = useChatStore();

  // Fetch user's chats
  const fetchChats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants!inner(user_id),
          messages(
            message_id,
            content,
            sender,
            timestamp,
            type
          )
        `)
        .contains('participants', [currentUser.uid])
        .order('updated_at', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      const chats: Chat[] = data.map((chatData) => ({
        chatId: chatData.chat_id,
        type: chatData.type,
        participants: chatData.participants,
        createdAt: chatData.created_at,
        updatedAt: chatData.updated_at,
        unreadCount: 0, // Will be calculated separately
        groupInfo: chatData.group_info ? {
          name: chatData.group_info.name,
          description: chatData.group_info.description,
          admin: chatData.group_info.admin,
          photoURL: chatData.group_info.photo_url,
          settings: chatData.group_info.settings,
        } : undefined,
        lastMessage: chatData.messages?.[0] ? {
          messageId: chatData.messages[0].message_id,
          content: chatData.messages[0].content.text || 'Media',
          sender: chatData.messages[0].sender,
          timestamp: chatData.messages[0].timestamp,
          type: chatData.messages[0].type,
        } : undefined,
      }));

      setChats(chats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat
  const createChat = async (
    type: Chat['type'],
    participants: UUID[],
    groupInfo?: Partial<GroupInfo>
  ) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const chatData = {
        type,
        participants: [currentUser.uid, ...participants],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        group_info: type === 'group' ? {
          name: groupInfo?.name || 'New Group',
          description: groupInfo?.description,
          admin: currentUser.uid,
          photo_url: groupInfo?.photoURL,
          settings: groupInfo?.settings || {
            allowMemberInvites: true,
            allowMediaSharing: true,
            muteNotifications: false,
            disappearingMessages: false,
          },
        } : null,
      };

      const { data, error } = await supabase
        .from('chats')
        .insert([chatData])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Add participants to chat_participants table
      const participantInserts = [currentUser.uid, ...participants].map((userId) => ({
        chat_id: data.chat_id,
        user_id: userId,
        joined_at: new Date().toISOString(),
      }));

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantError) {
        console.error('Error adding participants:', participantError);
      }

      const newChat: Chat = {
        chatId: data.chat_id,
        type: data.type,
        participants: data.participants,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        unreadCount: 0,
        groupInfo: data.group_info ? {
          name: data.group_info.name,
          description: data.group_info.description,
          admin: data.group_info.admin,
          photoURL: data.group_info.photo_url,
          settings: data.group_info.settings,
        } : undefined,
      };

      addChat(newChat);
      return { success: true, data: newChat };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update chat information
  const updateChatInfo = async (chatId: UUID, updates: Partial<Chat>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('chats')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      updateChat(chatId, updates);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Add participant to chat
  const addParticipant = async (chatId: UUID, userId: UUID) => {
    try {
      setLoading(true);
      setError(null);

      // Add to chat_participants table
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([{
          chat_id: chatId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        }]);

      if (participantError) {
        setError(participantError.message);
        return { success: false, error: participantError.message };
      }

      // Update participants array in chats table
      const { data: chatData, error: fetchError } = await supabase
        .from('chats')
        .select('participants')
        .eq('chat_id', chatId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return { success: false, error: fetchError.message };
      }

      const updatedParticipants = [...chatData.participants, userId];

      const { error: updateError } = await supabase
        .from('chats')
        .update({
          participants: updatedParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId);

      if (updateError) {
        setError(updateError.message);
        return { success: false, error: updateError.message };
      }

      updateChat(chatId, { participants: updatedParticipants });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Remove participant from chat
  const removeParticipant = async (chatId: UUID, userId: UUID) => {
    try {
      setLoading(true);
      setError(null);

      // Remove from chat_participants table
      const { error: participantError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (participantError) {
        setError(participantError.message);
        return { success: false, error: participantError.message };
      }

      // Update participants array in chats table
      const { data: chatData, error: fetchError } = await supabase
        .from('chats')
        .select('participants')
        .eq('chat_id', chatId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return { success: false, error: fetchError.message };
      }

      const updatedParticipants = chatData.participants.filter((id: UUID) => id !== userId);

      const { error: updateError } = await supabase
        .from('chats')
        .update({
          participants: updatedParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId);

      if (updateError) {
        setError(updateError.message);
        return { success: false, error: updateError.message };
      }

      updateChat(chatId, { participants: updatedParticipants });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete chat
  const deleteChat = async (chatId: UUID) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('chat_id', chatId);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      removeChat(chatId);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Initialize chats on mount
  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser]);

  return {
    loading,
    error,
    fetchChats,
    createChat,
    updateChatInfo,
    addParticipant,
    removeParticipant,
    deleteChat,
  };
};