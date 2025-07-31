import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode,
  LightMode,
  Settings,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { UserProfile } from '../profile';
import { SettingsModal } from '../settings';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const DRAWER_WIDTH = 320;

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { mode, toggleTheme } = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ChatAI
          </Typography>
          
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          
          <IconButton color="inherit" onClick={() => setShowSettings(true)}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <Sidebar 
            onMobileClose={() => setMobileOpen(false)} 
            onProfileClick={() => setShowProfile(true)}
          />
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          <Sidebar onProfileClick={() => setShowProfile(true)} />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children || <ChatArea />}
      </Box>

      {/* Modals */}
      <UserProfile
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />
      
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Box>
  );
};

export default MainLayout;