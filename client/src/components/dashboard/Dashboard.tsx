import React from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import { Logout, Settings, Chat } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth';

const Dashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h4" component="h1">
            ChatAI Dashboard
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              size="small"
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={handleSignOut}
              size="small"
            >
              Sign Out
            </Button>
          </Box>
        </Box>

        {/* User Profile Card */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              src={userProfile?.photoURL || currentUser?.photoURL || undefined}
              sx={{ width: 80, height: 80 }}
            >
              {userProfile?.displayName?.[0] || currentUser?.displayName?.[0] || 'U'}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" gutterBottom>
                Welcome, {userProfile?.displayName || currentUser?.displayName || 'User'}!
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentUser?.email}
              </Typography>
              <Box display="flex" gap={1} mt={2}>
                <Chip
                  label={userProfile?.status || 'online'}
                  color={userProfile?.status === 'online' ? 'success' : 'default'}
                  size="small"
                />
                <Chip
                  label={currentUser?.emailVerified ? 'Verified' : 'Unverified'}
                  color={currentUser?.emailVerified ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Chat />}
              size="large"
            >
              Start New Chat
            </Button>
            <Button
              variant="outlined"
              size="large"
            >
              Chat with AI
            </Button>
            <Button
              variant="outlined"
              size="large"
            >
              Create Group
            </Button>
          </Box>
        </Paper>

        {/* Status */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">
              🚀 Firebase Authentication: Connected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🔥 Firestore Database: Connected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📁 Firebase Storage: Connected
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={2}>
              Ready for the next development phase!
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;