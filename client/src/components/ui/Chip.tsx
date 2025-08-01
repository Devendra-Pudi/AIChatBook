import React from 'react';
import { Chip as MuiChip } from '@mui/material';
import type { ChipProps as MuiChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ChipProps extends MuiChipProps {
  status?: 'online' | 'away' | 'busy' | 'offline';
}

const StyledChip = styled(MuiChip)<{ status?: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return {
          backgroundColor: '#10b981',
          color: 'white',
        };
      case 'away':
        return {
          backgroundColor: '#f59e0b',
          color: 'white',
        };
      case 'busy':
        return {
          backgroundColor: '#ef4444',
          color: 'white',
        };
      case 'offline':
        return {
          backgroundColor: theme.palette.grey[500],
          color: 'white',
        };
      default:
        return {};
    }
  };

  return {
    borderRadius: theme.spacing(1),
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    ...getStatusColor(),
  };
});

export const Chip: React.FC<ChipProps> = ({ status, ...props }) => {
  return <StyledChip status={status} {...props} />;
};