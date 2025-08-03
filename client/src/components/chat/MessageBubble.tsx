import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert,
  Reply,
  Edit,
  Delete,
  ContentCopy,
  EmojiEmotions,
  Done,
  DoneAll,
  Schedule,
  Error,
  Download,
  Forward,
} from '@mui/icons-material';
import { Avatar, AudioPlayer } from '../ui';
import { useResponsive, useMessageManagement } from '../../hooks';
import { useUserStore } from '../../store';
import { MessageEditDialog } from './MessageEditDialog';
import { MessageDeleteDialog } from './MessageDeleteDialog';
import { MessageForwardDialog } from './MessageForwardDialog';
import { MessageReplyContext } from './MessageReplyContext';
import { EmojiPicker } from './EmojiPicker';
import type { Message, UUID } from '../../types';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (messageId: UUID) => void;
  getUserDisplayName?: (userId: UUID) => string;
  getUserAvatar?: (userId: UUID) => string | undefined;
}



export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  getUserDisplayName,
  getUserAvatar,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  
  const { currentUser } = useUserStore();
  const { isMobile, getSpacing } = useResponsive();
  const { editMessage, deleteMessage, forwardMessage, toggleReaction } = useMessageManagement(message.chatId);

  const isOwnMessage = currentUser?.uid === message.sender;
  const senderName = getUserDisplayName?.(message.sender) || 'Unknown User';
  const senderAvatar = getUserAvatar?.(message.sender);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'sent':
        return <Done sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'delivered':
        return <DoneAll sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'read':
        return <DoneAll sx={{ fontSize: 14, color: 'primary.main' }} />;
      case 'failed':
        return <Error sx={{ fontSize: 14, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getReadByCount = () => {
    return Object.keys(message.readBy).length;
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleReactionClick = (event: React.MouseEvent<HTMLElement>) => {
    setReactionAnchor(event.currentTarget);
  };

  const handleReactionClose = () => {
    setReactionAnchor(null);
  };

  const handleQuickReaction = async (emoji: string) => {
    await toggleReaction(message.messageId, emoji);
    handleReactionClose();
  };

  const handleCopyMessage = () => {
    if (message.content.text) {
      navigator.clipboard.writeText(message.content.text);
    }
    handleMenuClose();
  };

  const renderMessageContent = () => {
    if (message.content.text) {
      // Simple markdown-like formatting
      let text = message.content.text;

      // Bold text
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Italic text
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Code text
      text = text.replace(/`(.*?)`/g, '<code style="background-color: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');

      return (
        <Typography
          variant="body2"
          sx={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }

    // Handle media content
    if (message.content.media) {
      const { media } = message.content;
      switch (media.type) {
        case 'image':
          return (
            <Box>
              <img
                src={media.url}
                alt="Shared image"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  objectFit: 'cover',
                }}
              />
              {message.content.text && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {message.content.text}
                </Typography>
              )}
            </Box>
          );
        case 'video':
          return (
            <Box>
              <video
                src={media.url}
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                }}
              />
              {message.content.text && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {message.content.text}
                </Typography>
              )}
            </Box>
          );
        case 'audio':
          return (
            <Box>
              <AudioPlayer
                src={media.url}
                fileName={media.fileName}
                duration={media.duration}
                compact={true}
                showDownload={true}
              />
              {message.content.text && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {message.content.text}
                </Typography>
              )}
            </Box>
          );
      }
    }

    // Handle file content
    if (message.content.file) {
      const { file } = message.content;
      const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
      };

      return (
        <Box>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
            onClick={() => window.open(file.url, '_blank')}
          >
            <Typography variant="body2" sx={{ flex: 1 }} noWrap>
              📎 {file.fileName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(file.size)}
            </Typography>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}>
              <Download fontSize="small" />
            </IconButton>
          </Paper>
          {message.content.text && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {message.content.text}
            </Typography>
          )}
        </Box>
      );
    }

    return null;
  };

  const renderReactions = () => {
    const reactions = Object.entries(message.reactions);
    if (reactions.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
        {reactions.map(([emoji, userIds]) => (
          <Chip
            key={emoji}
            label={`${emoji} ${userIds.length}`}
            size="small"
            variant={userIds.includes(currentUser?.uid || '') ? 'filled' : 'outlined'}
            color={userIds.includes(currentUser?.uid || '') ? 'primary' : 'default'}
            onClick={() => toggleReaction(message.messageId, emoji)}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 1,
        mb: getSpacing(1, 1.5),
        '&:hover .message-actions': {
          opacity: 1,
        },
      }}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && showAvatar && (
        <Avatar
          src={senderAvatar}
          size="small"
          sx={{ mb: 0.5 }}
        >
          {senderName[0]}
        </Avatar>
      )}

      {/* Message Content */}
      <Box
        sx={{
          maxWidth: isMobile ? '85%' : '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Sender name for group chats */}
        {!isOwnMessage && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, px: 1 }}
          >
            {senderName}
          </Typography>
        )}

        {/* Reply context */}
        {message.replyTo && (
          <MessageReplyContext
            replyToId={message.replyTo}
            getUserDisplayName={getUserDisplayName}
          />
        )}

        {/* Message bubble */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
              color: isOwnMessage ? 'white' : 'text.primary',
              borderRadius: 2,
              borderBottomRightRadius: isOwnMessage ? 0.5 : 2,
              borderBottomLeftRadius: isOwnMessage ? 2 : 0.5,
              position: 'relative',
              minWidth: 60,
            }}
          >
            {renderMessageContent()}

            {/* Message edited indicator */}
            {message.edited && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  opacity: 0.7,
                  fontSize: '0.7rem',
                }}
              >
                (edited)
              </Typography>
            )}

            {/* Forwarded indicator */}
            {message.forwardedFrom && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  opacity: 0.7,
                  fontSize: '0.7rem',
                  fontStyle: 'italic',
                }}
              >
                Forwarded
              </Typography>
            )}
          </Paper>

          {/* Message actions */}
          <Box
            className="message-actions"
            sx={{
              opacity: 0,
              transition: 'opacity 0.2s',
              display: 'flex',
              gap: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={handleReactionClick}
              sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            >
              <EmojiEmotions fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Reactions */}
        {renderReactions()}

        {/* Timestamp and status */}
        {showTimestamp && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(message.timestamp)}
            </Typography>
            {isOwnMessage && getStatusIcon()}
            {isOwnMessage && getReadByCount() > 1 && (
              <Tooltip title={`Read by ${getReadByCount()} people`}>
                <Typography variant="caption" color="text.secondary">
                  • {getReadByCount()}
                </Typography>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* Avatar for own messages */}
      {isOwnMessage && showAvatar && (
        <Avatar
          src={currentUser?.photoURL}
          size="small"
          sx={{ mb: 0.5 }}
        >
          {currentUser?.displayName?.[0] || 'Y'}
        </Avatar>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem onClick={() => { onReply?.(message.messageId); handleMenuClose(); }}>
          <ListItemIcon>
            <Reply fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { setForwardDialogOpen(true); handleMenuClose(); }}>
          <ListItemIcon>
            <Forward fontSize="small" />
          </ListItemIcon>
          <ListItemText>Forward</ListItemText>
        </MenuItem>

        {isOwnMessage && (
          <>
            <Divider />
            <MenuItem onClick={() => { setEditDialogOpen(true); handleMenuClose(); }}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Enhanced Emoji Picker */}
      <EmojiPicker
        anchorEl={reactionAnchor}
        open={Boolean(reactionAnchor)}
        onClose={handleReactionClose}
        onEmojiSelect={handleQuickReaction}
      />

      {/* Message Management Dialogs */}
      <MessageEditDialog
        open={editDialogOpen}
        message={message}
        onClose={() => setEditDialogOpen(false)}
        onSave={editMessage}
      />

      <MessageDeleteDialog
        open={deleteDialogOpen}
        message={message}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={deleteMessage}
      />

      <MessageForwardDialog
        open={forwardDialogOpen}
        message={message}
        onClose={() => setForwardDialogOpen(false)}
        onForward={forwardMessage}
      />
    </Box>
  );
};