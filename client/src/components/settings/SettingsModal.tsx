import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControl,
  Select,
  MenuItem,
  Slider,
  Paper,
} from '@mui/material';
import {
  Notifications,
  Security,
  Palette,
  Language,
  VolumeUp,
  Chat,
  SmartToy,
  Storage,
} from '@mui/icons-material';
import { Modal, Button } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { mode, toggleTheme } = useTheme();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      sound: true,
      desktop: true,
      email: false,
    },
    chat: {
      enterToSend: true,
      readReceipts: true,
      typingIndicators: true,
      messagePreview: true,
    },
    ai: {
      enabled: true,
      personality: 'friendly',
      responseLength: 'medium',
    },
    privacy: {
      onlineStatus: true,
      lastSeen: true,
      profilePhoto: 'everyone',
    },
    appearance: {
      fontSize: 14,
      language: 'en',
    },
    sound: {
      volume: 70,
      messageSound: true,
      callSound: true,
    },
  });

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  const SettingSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <Paper elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 0 }}>
        {children}
      </Box>
    </Paper>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      maxWidth="md"
      actions={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onClose}>
            Save Changes
          </Button>
        </>
      }
    >
      <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        {/* Appearance Settings */}
        <SettingSection
          title="Appearance"
          icon={<Palette />}
        >
          <List>
            <ListItem>
              <ListItemIcon>
                <Palette color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Dark Mode"
                secondary={`Currently using ${mode} theme`}
              />
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Language color="action" />
              </ListItemIcon>
              <ListItemText primary="Language" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={settings.appearance.language}
                  onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="action">Aa</Typography>
              </ListItemIcon>
              <ListItemText primary="Font Size" />
              <Box sx={{ width: 120, ml: 2 }}>
                <Slider
                  value={settings.appearance.fontSize}
                  onChange={(_, value) => handleSettingChange('appearance', 'fontSize', value)}
                  min={12}
                  max={18}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            </ListItem>
          </List>
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection
          title="Notifications"
          icon={<Notifications />}
        >
          <List>
            <ListItem>
              <ListItemIcon>
                <Notifications color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Enable Notifications"
                secondary="Receive notifications for new messages"
              />
              <Switch
                checked={settings.notifications.enabled}
                onChange={(e) => handleSettingChange('notifications', 'enabled', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <VolumeUp color="action" />
              </ListItemIcon>
              <ListItemText primary="Sound Notifications" />
              <Switch
                checked={settings.notifications.sound}
                onChange={(e) => handleSettingChange('notifications', 'sound', e.target.checked)}
                disabled={!settings.notifications.enabled}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Storage color="action" />
              </ListItemIcon>
              <ListItemText primary="Desktop Notifications" />
              <Switch
                checked={settings.notifications.desktop}
                onChange={(e) => handleSettingChange('notifications', 'desktop', e.target.checked)}
                disabled={!settings.notifications.enabled}
              />
            </ListItem>
          </List>
        </SettingSection>

        {/* Chat Settings */}
        <SettingSection
          title="Chat"
          icon={<Chat />}
        >
          <List>
            <ListItem>
              <ListItemIcon>
                <Chat color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Enter to Send"
                secondary="Press Enter to send messages"
              />
              <Switch
                checked={settings.chat.enterToSend}
                onChange={(e) => handleSettingChange('chat', 'enterToSend', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="action">✓✓</Typography>
              </ListItemIcon>
              <ListItemText primary="Read Receipts" />
              <Switch
                checked={settings.chat.readReceipts}
                onChange={(e) => handleSettingChange('chat', 'readReceipts', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="action">...</Typography>
              </ListItemIcon>
              <ListItemText primary="Typing Indicators" />
              <Switch
                checked={settings.chat.typingIndicators}
                onChange={(e) => handleSettingChange('chat', 'typingIndicators', e.target.checked)}
              />
            </ListItem>
          </List>
        </SettingSection>

        {/* AI Settings */}
        <SettingSection
          title="AI Assistant"
          icon={<SmartToy />}
        >
          <List>
            <ListItem>
              <ListItemIcon>
                <SmartToy color="action" />
              </ListItemIcon>
              <ListItemText primary="AI Personality" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={settings.ai.personality}
                  onChange={(e) => handleSettingChange('ai', 'personality', e.target.value)}
                >
                  <MenuItem value="friendly">Friendly</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="creative">Creative</MenuItem>
                </Select>
              </FormControl>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="action">📝</Typography>
              </ListItemIcon>
              <ListItemText primary="Response Length" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={settings.ai.responseLength}
                  onChange={(e) => handleSettingChange('ai', 'responseLength', e.target.value)}
                >
                  <MenuItem value="short">Short</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="long">Long</MenuItem>
                </Select>
              </FormControl>
            </ListItem>
          </List>
        </SettingSection>

        {/* Privacy Settings */}
        <SettingSection
          title="Privacy & Security"
          icon={<Security />}
        >
          <List>
            <ListItem>
              <ListItemIcon>
                <Security color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Show Online Status"
                secondary="Let others see when you're online"
              />
              <Switch
                checked={settings.privacy.onlineStatus}
                onChange={(e) => handleSettingChange('privacy', 'onlineStatus', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="action">👁</Typography>
              </ListItemIcon>
              <ListItemText primary="Show Last Seen" />
              <Switch
                checked={settings.privacy.lastSeen}
                onChange={(e) => handleSettingChange('privacy', 'lastSeen', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="action">📷</Typography>
              </ListItemIcon>
              <ListItemText primary="Profile Photo Visibility" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={settings.privacy.profilePhoto}
                  onChange={(e) => handleSettingChange('privacy', 'profilePhoto', e.target.value)}
                >
                  <MenuItem value="everyone">Everyone</MenuItem>
                  <MenuItem value="contacts">Contacts Only</MenuItem>
                  <MenuItem value="nobody">Nobody</MenuItem>
                </Select>
              </FormControl>
            </ListItem>
          </List>
        </SettingSection>
      </Box>
    </Modal>
  );
};

export default SettingsModal;