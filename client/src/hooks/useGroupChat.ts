import { useState, useCallback } from 'react';
import { useSupabaseChats } from './useSupabaseChats';
import { useChatStore, useUserStore } from '../store';
import type { UUID, Chat, GroupInfo } from '../types';

export const useGroupChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createChat, updateChatInfo, addParticipant, removeParticipant, deleteChat } = useSupabaseChats();
  const { removeChat } = useChatStore();
  const { currentUser } = useUserStore();

  // Create a new group chat
  const createGroupChat = useCallback(async (
    name: string,
    participants: UUID[],
    description?: string,
    photoURL?: string
  ) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    try {
      const groupInfo: Partial<GroupInfo> = {
        name,
        description,
        photoURL,
        settings: {
          allowMemberInvites: true,
          allowMediaSharing: true,
          muteNotifications: false,
          disappearingMessages: false,
        },
      };

      const result = await createChat('group', participants, groupInfo);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to create group chat');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group chat';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUser, createChat]);

  // Update group information
  const updateGroupInfo = useCallback(async (
    chatId: UUID,
    updates: Partial<GroupInfo>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateChatInfo(chatId, { groupInfo: updates as GroupInfo });
      
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Failed to update group info');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group info';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [updateChatInfo]);

  // Add member to group
  const addGroupMember = useCallback(async (chatId: UUID, userId: UUID) => {
    setLoading(true);
    setError(null);

    try {
      const result = await addParticipant(chatId, userId);
      
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Failed to add member');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [addParticipant]);

  // Remove member from group
  const removeGroupMember = useCallback(async (chatId: UUID, userId: UUID) => {
    setLoading(true);
    setError(null);

    try {
      const result = await removeParticipant(chatId, userId);
      
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Failed to remove member');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [removeParticipant]);

  // Leave group (remove current user)
  const leaveGroup = useCallback(async (chatId: UUID) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await removeParticipant(chatId, currentUser.uid);
      
      if (result.success) {
        // Remove chat from local store since user is no longer a participant
        removeChat(chatId);
        return { success: true };
      } else {
        setError(result.error || 'Failed to leave group');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave group';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUser, removeParticipant, removeChat]);

  // Delete group (admin only)
  const deleteGroup = useCallback(async (chatId: UUID) => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteChat(chatId);
      
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Failed to delete group');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [deleteChat]);

  // Make user admin (transfer admin rights)
  const makeAdmin = useCallback(async (chatId: UUID, userId: UUID) => {
    setLoading(true);
    setError(null);

    try {
      // Update group info to change admin
      const result = await updateChatInfo(chatId, {
        groupInfo: { admin: userId } as GroupInfo,
      });
      
      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Failed to make user admin');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make user admin';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [updateChatInfo]);

  // Check if current user is admin of a group
  const isGroupAdmin = useCallback((chat: Chat) => {
    return chat.type === 'group' && chat.groupInfo?.admin === currentUser?.uid;
  }, [currentUser]);

  // Check if current user can invite members
  const canInviteMembers = useCallback((chat: Chat) => {
    if (chat.type !== 'group' || !chat.groupInfo) return false;
    
    // Admin can always invite
    if (chat.groupInfo.admin === currentUser?.uid) return true;
    
    // Regular members can invite if setting allows
    return chat.groupInfo.settings.allowMemberInvites;
  }, [currentUser]);

  return {
    loading,
    error,
    createGroupChat,
    updateGroupInfo,
    addGroupMember,
    removeGroupMember,
    leaveGroup,
    deleteGroup,
    makeAdmin,
    isGroupAdmin,
    canInviteMembers,
  };
};