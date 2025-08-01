import React from 'react';
import { Badge as MuiBadge, styled } from '@mui/material';
import type { BadgeProps as MuiBadgeProps } from '@mui/material';

interface BadgeProps extends MuiBadgeProps {
  size?: 'small' | 'medium' | 'large';
  pulse?: boolean;
}

const StyledBadge = styled(MuiBadge)<{ size?: string; pulse?: boolean }>(
  ({ theme, size = 'medium', pulse }) => {
    const sizeMap = {
      small: {
        width: 16,
        height: 16,
        fontSize: '0.6rem',
      },
      medium: {
        width: 20,
        height: 20,
        fontSize: '0.75rem',
      },
      large: {
        width: 24,
        height: 24,
        fontSize: '0.875rem',
      },
    };

    const badgeSize = sizeMap[size as keyof typeof sizeMap];

    return {
      '& .MuiBadge-badge': {
        ...badgeSize,
        minWidth: badgeSize.width,
        borderRadius: badgeSize.width / 2,
        fontWeight: 600,
        border: `2px solid ${theme.palette.background.paper}`,
        ...(pulse && {
          animation: 'pulse 2s infinite',
        }),
      },
      '@keyframes pulse': {
        '0%': {
          transform: 'scale(1)',
          opacity: 1,
        },
        '50%': {
          transform: 'scale(1.1)',
          opacity: 0.8,
        },
        '100%': {
          transform: 'scale(1)',
          opacity: 1,
        },
      },
    };
  }
);

export const Badge: React.FC<BadgeProps> = ({
  size = 'medium',
  pulse = false,
  children,
  ...props
}) => {
  return (
    <StyledBadge size={size} pulse={pulse} {...props}>
      {children}
    </StyledBadge>
  );
};

// Status badge component for online/offline indicators
interface StatusBadgeProps {
  status: 'online' | 'away' | 'busy' | 'offline';
  children: React.ReactNode;
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  showPulse = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#44b700';
      case 'away':
        return '#ff9800';
      case 'busy':
        return '#f44336';
      case 'offline':
      default:
        return '#9e9e9e';
    }
  };

  return (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      pulse={showPulse && status === 'online'}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: getStatusColor(status),
          color: getStatusColor(status),
          '&::after': showPulse && status === 'online' ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
          } : undefined,
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
      }}
    >
      {children}
    </StyledBadge>
  );
};