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
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Close,
  PhotoCamera,
  MoreVert,
  PersonAdd,
  ExitToApp,
  Delete,
  AdminPanelSettings,
  Person,
} from '@mui/icons-material';
import { useSupabaseChats } from '../../hooks/useSupabaseChats';
import { useUserStore } from '../../store';
import type { Chat, GroupInfo, UUID } from '../../types';

interface GroupSettingsProps {
  open: boolean;
  onClose: () => void;
  chat: Chat;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({
  open,
  onClose,
  chat,
  onLeaveGroup,
  onDeleteGroup,
}) => {
  const [groupName, setGroupName] = useState(chat.groupInfo?.name || '');
  const [groupDescription, setGroupDescription] = useState(chat.groupInfo?.description || '');
  const [groupPhoto, setGroupPhoto] = useState(chat.groupInfo?.photoURL || '');
  const [settings, setSettings] = useState(chat.groupInfo?.settings || {
    allowMemberInvites: true,
    allowMediaSharing: true,
    muteNotifications: false,
    disappearingMessages: false,
    disappearingMessagesDuration: 24,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<UUID | null>(null);

  const { updateChatInfo, removeParticipant } = useSupabaseChats();
  const { currentUser, users } = useUserStore();

  const isAdmin = chat.groupInfo?.admin === currentUser?.uid;
  const members = chat.participants.map(id => users[id]).filter(Boolean);

  useEffect(() => {
    if (open && chat.groupInfo) {
      setGroupName(chat.groupInfo.name);
      setGroupDescription(chat.groupInfo.description || '');
      setGroupPhoto(chat.groupInfo.photoURL || '');
      setSettings(chat.groupInfo.settings);
    }
  }, [open, chat.groupInfo]);

  const handleSaveSettings = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const updatedGroupInfo: GroupInfo = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        admin: chat.groupInfo!.admin,
        photoURL: groupPhoto || undefined,
        settings,
      };

      const result = await updateChatInfo(chat.chatId, {
        groupInfo: updatedGroupInfo,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to update group settings');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMemberMenuOpen = (event: React.MouseEvent<HTMLElement>, memberId: UUID) => {
    setMemberMenuAnchor(event.currentTarget);
    setSelectedMember(memberId);
  };

  const handleMemberMenuClose = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  const handleRemoveMember = async (memberId: UUID) => {
    if (!isAdmin) return;

    try {
      const result = await removeParticipant(chat.chatId, memberId);
      if (!result.success) {
        setError(result.error || 'Failed to remove member');
      }
    } catch (err) {
      setError('Failed to remove member');
    }
    handleMemberMenuClose();
  };

  const handleLeaveGroup = () => {
    onLeaveGroup?.();
    onClose();
  };

  const handleDeleteGroup = () => {
    onDeleteGroup?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={groupPhoto} sx={{ bgcolor: 'primary.main' }}>
            {groupName[0] || 'G'}
          </Avatar>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Group Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
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
                cursor: isAdmin ? 'pointer' : 'default',
                '&:hover': isAdmin ? { bgcolor: 'grey.300' } : {},
              }}
              src={groupPhoto}
            >
              {isAdmin ? <PhotoCamera /> : (groupName[0] || 'G')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                variant="outlined"
                size="small"
                disabled={!isAdmin}
                required
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="What's this group about?"
            variant="outlined"
            size="small"
            multiline
            rows={2}
            disabled={!isAdmin}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Group Settings */}
        {isAdmin && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Group Settings
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowMemberInvites}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        allowMemberInvites: e.target.checked
                      }))}
                    />
                  }
                  label="Allow members to invite others"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowMediaSharing}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        allowMediaSharing: e.target.checked
                      }))}
                    />
                  }
                  label="Allow media sharing"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.muteNotifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        muteNotifications: e.target.checked
                      }))}
                    />
                  }
                  label="Mute notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.disappearingMessages}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        disappearingMessages: e.target.checked
                      }))}
                    />
                  }
                  label="Disappearing messages"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Members Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Members ({members.length})
            </Typography>
            {isAdmin && (
              <Button
                startIcon={<PersonAdd />}
                size="small"
                variant="outlined"
              >
                Add Member
              </Button>
            )}
          </Box>

          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {members.map((member) => (
              <ListItem
                key={member.uid}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={member.photoURL} sx={{ width: 40, height: 40 }}>
                    {member.displayName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {member.displayName}
                      </Typography>
                      {member.uid === chat.groupInfo?.admin && (
                        <Chip
                          label="Admin"
                          size="small"
                          color="primary"
                          icon={<AdminPanelSettings />}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {member.uid === currentUser?.uid && (
                        <Chip
                          label="You"
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={member.email}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {isAdmin && member.uid !== currentUser?.uid && (
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMemberMenuOpen(e, member.uid)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Danger Zone */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'error.main' }}>
            Danger Zone
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<ExitToApp />}
              color="error"
              variant="outlined"
              onClick={handleLeaveGroup}
              fullWidth
            >
              Leave Group
            </Button>
            
            {isAdmin && (
              <Button
                startIcon={<Delete />}
                color="error"
                variant="contained"
                onClick={handleDeleteGroup}
                fullWidth
              >
                Delete Group
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {isAdmin && (
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={!groupName.trim() || isUpdating}
            sx={{ minWidth: 100 }}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </DialogActions>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleMemberMenuClose}
      >
        <MenuItem onClick={() => selectedMember && handleRemoveMember(selectedMember)}>
          <Person sx={{ mr: 1 }} />
          Remove from Group
        </MenuItem>
      </Menu>
    </Dialog>
  );
};