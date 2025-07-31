import React from 'react';
import { Avatar as MuiAvatar, Badge } from '@mui/material';
import type { AvatarProps as MuiAvatarProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface AvatarProps extends MuiAvatarProps {
  online?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const StyledAvatar = styled(MuiAvatar)<{ size?: string }>(({ size }) => {
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 56,
  };
  
  const avatarSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
  
  return {
    width: avatarSize,
    height: avatarSize,
    fontSize: avatarSize * 0.4,
    fontWeight: 500,
  };
});

const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

export const Avatar: React.FC<AvatarProps> = ({ 
  online = false, 
  size = 'medium',
  children,
  ...props 
}) => {
  const avatar = (
    <StyledAvatar size={size} {...props}>
      {children}
    </StyledAvatar>
  );

  if (online) {
    return (
      <OnlineBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
      >
        {avatar}
      </OnlineBadge>
    );
  }

  return avatar;
};