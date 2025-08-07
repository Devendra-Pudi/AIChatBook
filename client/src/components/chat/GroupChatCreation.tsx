import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close,
  Group,
  Search,
  PhotoCamera,
} from '@mui/icons-material';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { useSupabaseChats } from '../../hooks/useSupabaseChats';
import { useUserStore } from '../../store';
import type { UUID } from '../../types';

interface GroupChatCreationProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: (chatId: UUID) => void;
}

export const GroupChatCreation: React.FC<GroupChatCreationProps> = ({
  open,
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UUID[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { searchUsers, loading: usersLoading } = useSupabaseUsers();
  const { createChat } = useSupabaseChats();
  const { currentUser, users } = useUserStore();
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setAvailableUsers([]);
    }
  }, [open]);

  // Search for users when query changes
  useEffect(() => {
    const searchForUsers = async () => {
      if (searchQuery.trim()) {
        const result = await searchUsers(searchQuery);
        if (result.success) {
          setAvailableUsers(result.data || []);
        }
      } else {
        setAvailableUsers([]);
      }
    };

    const timeoutId = setTimeout(searchForUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const filteredUsers = availableUsers.filter(
    (user: any) => user.uid !== currentUser?.uid
  );

  const handleUserToggle = (userId: UUID) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createChat('group', selectedUsers, {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        photoURL: groupPhoto || undefined,
        settings: {
          allowMemberInvites: true,
          allowMediaSharing: true,
          muteNotifications: false,
          disappearingMessages: false,
        },
      });

      if (result.success && result.data) {
        onGroupCreated?.(result.data.chatId);
        handleClose();
      } else {
        setError(result.error || 'Failed to create group');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedUsers([]);
    setSearchQuery('');
    setGroupPhoto('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Group />
          </Avatar>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Create Group Chat
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Group Info Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Group Information
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'grey.200',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.300' },
              }}
              src={groupPhoto}
            >
              <PhotoCamera />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                variant="outlined"
                size="small"
                required
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Description (Optional)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="What's this group about?"
            variant="outlined"
            size="small"
            multiline
            rows={2}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Member Selection Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Add Members ({selectedUsers.length} selected)
          </Typography>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map((userId) => {
                  const user = users[userId];
                  return (
                    <Chip
                      key={userId}
                      label={user?.displayName || 'Unknown'}
                      onDelete={() => handleUserToggle(userId)}
                      avatar={<Avatar src={user?.photoURL}>{user?.displayName[0]}</Avatar>}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />

          {/* User List */}
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {filteredUsers.map((user: any) => (
                <ListItem
                  key={user.uid}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.photoURL} sx={{ width: 40, height: 40 }}>
                      {user.displayName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.displayName}
                    secondary={user.email}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      checked={selectedUsers.includes(user.uid)}
                      onChange={() => handleUserToggle(user.uid)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {filteredUsers.length === 0 && !usersLoading && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  {searchQuery ? 'No users found' : 'Start typing to search for users'}
                </Typography>
              )}
            </List>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleCreateGroup}
          variant="contained"
          disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
          sx={{ minWidth: 100 }}
        >
          {isCreating ? 'Creating...' : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};