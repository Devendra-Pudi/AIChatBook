import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
  Fade,
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
import { IconButton } from '../ui';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const DRAWER_WIDTH = 320;
const MOBILE_DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  const drawerWidth = isMobile ? MOBILE_DRAWER_WIDTH : DRAWER_WIDTH;

  // Handle responsive drawer behavior
  const handleDrawerClose = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={isMobile ? 2 : 1}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(8px)',
          backgroundColor: mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            tooltip="Open menu"
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              background: mode === 'dark' 
                ? 'linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)'
                : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ChatAI
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              tooltip={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Fade in={true} timeout={300}>
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </Fade>
            </IconButton>
            
            <IconButton 
              color="inherit" 
              onClick={() => setShowSettings(true)}
              tooltip="Settings"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Settings />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
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
              width: drawerWidth,
              backgroundImage: 'none',
              borderRight: `1px solid ${muiTheme.palette.divider}`,
              backgroundColor: 'background.paper',
            },
          }}
        >
          <Sidebar 
            onMobileClose={handleDrawerClose} 
            onProfileClick={() => setShowProfile(true)}
            isMobile={true}
          />
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundImage: 'none',
              borderRight: `1px solid ${muiTheme.palette.divider}`,
              backgroundColor: 'background.paper',
            },
          }}
          open
        >
          <Sidebar 
            onProfileClick={() => setShowProfile(true)}
            isMobile={false}
          />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} /> {/* Spacer for AppBar */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {children || <ChatArea />}
        </Box>
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