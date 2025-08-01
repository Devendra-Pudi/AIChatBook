import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  keyframes,
} from '@mui/material';
import { Avatar } from '../ui';
import { useResponsive } from '../../hooks';

interface TypingUser {
  userId: string;
  displayName: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  maxDisplayUsers?: number;
}

// Typing animation keyframes
const typingAnimation = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingDots: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
        ml: 1,
      }}
    >
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: `${typingAnimation} 1.4s infinite ease-in-out`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </Box>
  );
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  maxDisplayUsers = 3,
}) => {
  const { isMobile, getSpacing } = useResponsive();
  const theme = useTheme();

  if (typingUsers.length === 0) {
    return null;
  }

  const displayUsers = typingUsers.slice(0, maxDisplayUsers);
  const remainingCount = typingUsers.length - maxDisplayUsers;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${displayUsers[0].displayName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${displayUsers[0].displayName} and ${displayUsers[1].displayName} are typing`;
    } else if (typingUsers.length <= maxDisplayUsers) {
      const names = displayUsers.slice(0, -1).map(user => user.displayName).join(', ');
      const lastName = displayUsers[displayUsers.length - 1].displayName;
      return `${names}, and ${lastName} are typing`;
    } else {
      const names = displayUsers.map(user => user.displayName).join(', ');
      return `${names} and ${remainingCount} other${remainingCount > 1 ? 's' : ''} are typing`;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        mb: getSpacing(1, 1.5),
        opacity: 0.8,
      }}
    >
      {/* Avatars */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {displayUsers.map((user, index) => (
          <Avatar
            key={user.userId}
            src={user.avatar}
            size="small"
            sx={{
              width: 24,
              height: 24,
              fontSize: '0.7rem',
              ml: index > 0 ? -0.5 : 0,
              border: `2px solid ${theme.palette.background.default}`,
              zIndex: displayUsers.length - index,
            }}
          >
            {user.displayName[0]}
          </Avatar>
        ))}
      </Box>

      {/* Typing bubble */}
      <Box
        sx={{
          maxWidth: isMobile ? '75%' : '60%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            bgcolor: 'background.paper',
            borderRadius: 2,
            borderBottomLeftRadius: 0.5,
            display: 'flex',
            alignItems: 'center',
            minHeight: 40,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: -8,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 8px 8px 0',
              borderColor: `transparent ${theme.palette.background.paper} transparent transparent`,
            },
          }}
        >
          <TypingDots />
        </Paper>

        {/* Typing text */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.5,
            px: 1,
            fontSize: isMobile ? '0.7rem' : '0.75rem',
          }}
        >
          {getTypingText()}
        </Typography>
      </Box>
    </Box>
  );
};