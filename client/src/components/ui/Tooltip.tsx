import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';
import type { TooltipProps as MuiTooltipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTooltip = styled(MuiTooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    fontSize: '0.75rem',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    maxWidth: 200,
  },
  '& .MuiTooltip-arrow': {
    color: theme.palette.grey[900],
  },
}));

export const Tooltip: React.FC<MuiTooltipProps> = (props) => {
  return <StyledTooltip arrow {...props} />;
};