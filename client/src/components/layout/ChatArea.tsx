import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  MoreVert,
  Phone,
  VideoCall,
  Search,
  Group,
  Settings,
  ExitToApp,
  PersonAdd,
} from '@mui/icons-material';
import { Avatar, Dropdown } from '../ui';
import { MessageList, MessageInput, MessageSearch, GroupSettings, GroupMemberList, AddMemberDialog } from '../chat';
import { useResponsive, useGroupChat } from '../../hooks';
import { useSupabaseMessages } from '../../hooks/useSupabaseMessages';
import { useChatStore, useUserStore, useMessageStore } from '../../store';
import { selectActiveChat } from '../../store/chatStore';
import type { MessageContent, UUID } from '../../types';

const ChatArea: React.FC = () => {
  const [replyTo, setReplyTo] = useState<{
    messageId: UUID;
    content: string;
    sender: string;
  } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  
  const { isMobile, getSpacing } = useResponsive();
  const activeChat = useChatStore(selectActiveChat);
  const { users, currentUser } = useUserStore();
  const { sendMessage } = useSupabaseMessages(activeChat?.chatId);
  const { leaveGroup, deleteGroup, isGroupAdmin, canInviteMembers } = useGroupChat();

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: MessageContent, replyToId?: UUID) => {
    if (!activeChat || !currentUser) return;

    try {
      await sendMessage(activeChat.chatId, content, replyToId);
      setReplyTo(null); // Clear reply after sending
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [activeChat, currentUser, sendMessage]);

  // Handle message reply
  const handleReply = useCallback((messageId: UUID) => {
    if (!activeChat) return;
    
    const messages = useMessageStore.getState().messages[activeChat.chatId] || [];
    const message = messages.find(m => m.messageId === messageId);
    
    if (message) {
      const senderName = users[message.sender]?.displayName || 'Unknown User';
      setReplyTo({
        messageId,
        content: message.content.text || 'Media message',
        sender: senderName,
      });
    }
  }, [activeChat, users]);



  // Handle search message selection
  const handleSearchMessageSelect = useCallback((message: any) => {
    // This would typically scroll to the message in the chat
    console.log('Navigate to message:', message);
  }, []);

  // Handle group actions
  const handleLeaveGroup = useCallback(async () => {
    if (!activeChat) return;
    
    try {
      await leaveGroup(activeChat.chatId);
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  }, [activeChat, leaveGroup]);

  const handleDeleteGroup = useCallback(async () => {
    if (!activeChat) return;
    
    try {
      await deleteGroup(activeChat.chatId);
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  }, [activeChat, deleteGroup]);

  // Get chat participant info
  const getChatInfo = useCallback(() => {
    if (!activeChat) return null;

    if (activeChat.type === 'ai') {
      return {
        name: 'AI Assistant',
        status: 'Online',
        avatar: undefined,
        isOnline: true,
      };
    }

    if (activeChat.type === 'group') {
      return {
        name: activeChat.groupInfo?.name || 'Group Chat',
        status: `${activeChat.participants.length} members`,
        avatar: activeChat.groupInfo?.photoURL,
        isOnline: true,
      };
    }

    // Private chat - get other participant
    const otherParticipant = activeChat.participants.find(p => p !== currentUser?.uid);
    const otherUser = otherParticipant ? users[otherParticipant] : null;

    return {
      name: otherUser?.displayName || 'Unknown User',
      status: otherUser?.status === 'online' ? 'Online' : 'Offline',
      avatar: otherUser?.photoURL,
      isOnline: otherUser?.status === 'online',
    };
  }, [activeChat, currentUser, users]);

  const chatInfo = getChatInfo();

  // Show empty state if no active chat
  if (!activeChat) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Welcome to ChatAI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a chat to start messaging
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: getSpacing(1.5, 2),
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: getSpacing(1, 2) }}>
            <Avatar 
              src={chatInfo?.avatar}
              online={chatInfo?.isOnline} 
              size={isMobile ? "small" : "medium"}
            >
              {chatInfo?.name?.[0] || 'C'}
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "body1" : "subtitle1"} 
                fontWeight={600}
                noWrap
              >
                {chatInfo?.name || 'Chat'}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                {chatInfo?.status || 'Unknown'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              size={isMobile ? "small" : "medium"}
              onClick={() => setShowSearch(true)}
              title="Search messages"
            >
              <Search />
            </IconButton>
            
            {!isMobile && activeChat.type === 'private' && (
              <>
                <IconButton color="primary" size="medium" title="Voice call">
                  <Phone />
                </IconButton>
                <IconButton color="primary" size="medium" title="Video call">
                  <VideoCall />
                </IconButton>
              </>
            )}
            
            <Dropdown
              trigger={
                <IconButton size={isMobile ? "small" : "medium"}>
                  <MoreVert />
                </IconButton>
              }
              items={[
                ...(activeChat.type === 'private' ? [
                  { id: 'call', label: 'Voice Call', icon: <Phone /> },
                  { id: 'video', label: 'Video Call', icon: <VideoCall /> },
                ] : []),
                { id: 'search', label: 'Search Messages', icon: <Search /> },
                ...(activeChat.type === 'group' ? [
                  { id: 'members', label: 'Group Members', icon: <Group /> },
                  ...(canInviteMembers(activeChat) ? [
                    { id: 'addMember', label: 'Add Member', icon: <PersonAdd /> },
                  ] : []),
                  ...(isGroupAdmin(activeChat) ? [
                    { id: 'settings', label: 'Group Settings', icon: <Settings /> },
                  ] : []),
                  { id: 'leave', label: 'Leave Group', icon: <ExitToApp /> },
                ] : [
                  { id: 'info', label: 'Chat Info' },
                ]),
                { id: 'mute', label: 'Mute Notifications' },
                ...(activeChat.type === 'private' ? [
                  { id: 'block', label: 'Block Contact' },
                ] : []),
              ]}
              onItemClick={(itemId) => {
                switch (itemId) {
                  case 'search':
                    setShowSearch(true);
                    break;
                  case 'members':
                    setShowGroupMembers(true);
                    break;
                  case 'addMember':
                    setShowAddMember(true);
                    break;
                  case 'settings':
                    setShowGroupSettings(true);
                    break;
                  case 'leave':
                    handleLeaveGroup();
                    break;
                  default:
                    break;
                }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <MessageList
        chatId={activeChat.chatId}
        onReply={handleReply}
      />

      <Divider />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        replyTo={replyTo || undefined}
        onCancelReply={() => setReplyTo(null)}
        placeholder={
          activeChat.type === 'ai' 
            ? 'Ask the AI assistant...' 
            : 'Type a message...'
        }
      />

      {/* Message Search Dialog */}
      <MessageSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onMessageSelect={handleSearchMessageSelect}
        chatId={activeChat.chatId}
      />

      {/* Group Dialogs */}
      {activeChat.type === 'group' && (
        <>
          <GroupSettings
            open={showGroupSettings}
            onClose={() => setShowGroupSettings(false)}
            chat={activeChat}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
          
          <GroupMemberList
            open={showGroupMembers}
            onClose={() => setShowGroupMembers(false)}
            chat={activeChat}
            onAddMember={() => {
              setShowGroupMembers(false);
              setShowAddMember(true);
            }}
          />
          
          <AddMemberDialog
            open={showAddMember}
            onClose={() => setShowAddMember(false)}
            chat={activeChat}
            onMembersAdded={() => setShowAddMember(false)}
          />
        </>
      )}
    </Box>
  );
};

export default ChatArea;