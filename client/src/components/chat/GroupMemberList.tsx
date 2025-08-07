import React, { useState } from 'react';
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
  IconButton,
  Menu,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Close,
  Search,
  MoreVert,
  PersonAdd,
  AdminPanelSettings,
  Person,
  Message,
} from '@mui/icons-material';
import { useUserStore } from '../../store';
import type { Chat, UUID } from '../../types';

interface GroupMemberListProps {
  open: boolean;
  onClose: () => void;
  chat: Chat;
  onAddMember?: () => void;
  onRemoveMember?: (memberId: UUID) => void;
  onMakeAdmin?: (memberId: UUID) => void;
  onStartPrivateChat?: (memberId: UUID) => void;
}

export const GroupMemberList: React.FC<GroupMemberListProps> = ({
  open,
  onClose,
  chat,
  onAddMember,
  onRemoveMember,
  onMakeAdmin,
  onStartPrivateChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<UUID | null>(null);

  const { currentUser, users } = useUserStore();

  const isAdmin = chat.groupInfo?.admin === currentUser?.uid;
  const members = chat.participants
    .map(id => users[id])
    .filter(Boolean)
    .filter(member => 
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleMemberMenuOpen = (event: React.MouseEvent<HTMLElement>, memberId: UUID) => {
    setMemberMenuAnchor(event.currentTarget);
    setSelectedMember(memberId);
  };

  const handleMemberMenuClose = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  const handleRemoveMember = () => {
    if (selectedMember) {
      onRemoveMember?.(selectedMember);
    }
    handleMemberMenuClose();
  };

  const handleMakeAdmin = () => {
    if (selectedMember) {
      onMakeAdmin?.(selectedMember);
    }
    handleMemberMenuClose();
  };

  const handleStartPrivateChat = () => {
    if (selectedMember) {
      onStartPrivateChat?.(selectedMember);
    }
    handleMemberMenuClose();
  };

  // const selectedMemberData = selectedMember ? users[selectedMember] : null;
  const canManageMember = isAdmin && selectedMember !== currentUser?.uid;
  const canMakeAdmin = canManageMember && selectedMember !== chat.groupInfo?.admin;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <Avatar src={chat.groupInfo?.photoURL} sx={{ bgcolor: 'primary.main' }}>
            {chat.groupInfo?.name?.[0] || 'G'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {chat.groupInfo?.name || 'Group Chat'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {members.length} members
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* Search and Add Member */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search members..."
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

          {isAdmin && (
            <Button
              startIcon={<PersonAdd />}
              variant="outlined"
              onClick={onAddMember}
              fullWidth
            >
              Add Member
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Members List */}
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
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
                <Avatar
                  src={member.photoURL}
                  sx={{
                    width: 48,
                    height: 48,
                    border: member.status === 'online' ? '2px solid #4caf50' : 'none',
                  }}
                >
                  {member.displayName[0]}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {member.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {member.status === 'online' ? 'Online' : `Last seen ${member.lastSeen}`}
                    </Typography>
                  </Box>
                }
              />
              
              {member.uid !== currentUser?.uid && (
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
          
          {members.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 4 }}
            >
              No members found
            </Typography>
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Close
        </Button>
      </DialogActions>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleMemberMenuClose}
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        <MenuItem onClick={handleStartPrivateChat}>
          <Message sx={{ mr: 2 }} />
          Send Message
        </MenuItem>
        
        {canMakeAdmin && (
          <MenuItem onClick={handleMakeAdmin}>
            <AdminPanelSettings sx={{ mr: 2 }} />
            Make Admin
          </MenuItem>
        )}
        
        {canManageMember && (
          <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
            <Person sx={{ mr: 2 }} />
            Remove from Group
          </MenuItem>
        )}
      </Menu>
    </Dialog>
  );
};