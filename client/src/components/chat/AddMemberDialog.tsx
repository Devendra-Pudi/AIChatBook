import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  InputAdornment,
  Alert,
  Chip,
} from '@mui/material';
import {
  Close,
  Search,
  PersonAdd,
} from '@mui/icons-material';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { useSupabaseChats } from '../../hooks/useSupabaseChats';
import { useUserStore } from '../../store';
import type { Chat, UUID } from '../../types';

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  chat: Chat;
  onMembersAdded?: (memberIds: UUID[]) => void;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onClose,
  chat,
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UUID[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { searchUsers, loading: usersLoading } = useSupabaseUsers();
  const { addParticipant } = useSupabaseChats();
  const { currentUser, users } = useUserStore();
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedUsers([]);
      setSearchQuery('');
      setError(null);
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

  // Filter users who are not already in the group
  const filteredUsers = availableUsers.filter(
    (user: any) =>
      user.uid !== currentUser?.uid &&
      !chat.participants.includes(user.uid)
  );

  const handleUserToggle = (userId: UUID) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one member to add');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const results = await Promise.all(
        selectedUsers.map(userId => addParticipant(chat.chatId, userId))
      );

      const failedAdditions = results.filter(result => !result.success);
      
      if (failedAdditions.length > 0) {
        setError(`Failed to add ${failedAdditions.length} member(s)`);
      } else {
        onMembersAdded?.(selectedUsers);
        handleClose();
      }
    } catch (err) {
      setError('An unexpected error occurred while adding members');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
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
            <PersonAdd />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              Add Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add people to {chat.groupInfo?.name || 'this group'}
            </Typography>
          </Box>
          <Button onClick={handleClose} size="small">
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Selected ({selectedUsers.length})
            </Typography>
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
          placeholder="Search people to add..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Available Users List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
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
                  <Avatar
                    src={user.photoURL}
                    sx={{
                      width: 40,
                      height: 40,
                      border: user.status === 'online' ? '2px solid #4caf50' : 'none',
                    }}
                  >
                    {user.displayName[0]}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.displayName}
                      </Typography>
                      {user.status === 'online' && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      {user.bio && (
                        <Typography variant="caption" color="text.secondary">
                          {user.bio}
                        </Typography>
                      )}
                    </Box>
                  }
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
                sx={{ textAlign: 'center', py: 4 }}
              >
                {searchQuery ? 'No users found matching your search' : 'Start typing to search for users'}
              </Typography>
            )}
            
            {usersLoading && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                Loading users...
              </Typography>
            )}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleAddMembers}
          variant="contained"
          disabled={selectedUsers.length === 0 || isAdding}
          sx={{ minWidth: 120 }}
        >
          {isAdding ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};