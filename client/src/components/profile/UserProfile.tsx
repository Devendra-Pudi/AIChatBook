import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
} from '@mui/material';
import {
  Edit,
  Email,
  CalendarToday,
  Notifications,
  Palette,
} from '@mui/icons-material';
import { Avatar, Button, Modal } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ open, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const userInfo = {
    displayName: userProfile?.displayName || currentUser?.displayName || 'User',
    email: currentUser?.email || '',
    photoURL: userProfile?.photoURL || currentUser?.photoURL,
    bio: userProfile?.bio || 'Hey there! I am using ChatAI.',
    status: userProfile?.status || 'online',
    joinDate: currentUser?.createdAt || new Date().toISOString(),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'away':
        return 'warning';
      case 'busy':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profile"
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={userInfo.photoURL || undefined}
              size="large"
              online={userInfo.status === 'online'}
              sx={{ width: 80, height: 80 }}
            >
              {userInfo.displayName[0]}
            </Avatar>
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {userInfo.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {userInfo.bio}
            </Typography>
            <Chip
              label={userInfo.status}
              color={getStatusColor(userInfo.status) as any}
              size="small"
            />
          </Box>
        </Box>

        <Divider />

        {/* Contact Information */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            Contact Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Email color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={userInfo.email}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CalendarToday color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Joined"
                secondary={new Date(userInfo.joinDate).toLocaleDateString()}
              />
            </ListItem>
          </List>
        </Box>

        <Divider />

        {/* Settings */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            Settings
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Notifications color="action" />
              </ListItemIcon>
              <ListItemText primary="Notifications" />
              <Switch
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Palette color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Dark Mode"
                secondary={`Currently ${mode} mode`}
              />
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
              />
            </ListItem>
          </List>
        </Box>

        <Divider />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button variant="contained">
            Edit Profile
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserProfile;