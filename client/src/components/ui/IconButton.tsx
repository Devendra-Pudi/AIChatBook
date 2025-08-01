import React from 'react';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';
import type { IconButtonProps as MuiIconButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface IconButtonProps extends MuiIconButtonProps {
  tooltip?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

const StyledIconButton = styled(MuiIconButton)<{ variant?: string }>(
  ({ theme, variant }) => ({
    borderRadius: theme.spacing(1),
    transition: 'all 0.2s ease-in-out',
    
    ...(variant === 'primary' && {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        transform: 'scale(1.05)',
      },
    }),
    
    ...(variant === 'secondary' && {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
        transform: 'scale(1.05)',
      },
    }),
    
    '&:hover': {
      transform: 'scale(1.05)',
    },
  })
);

export const IconButton: React.FC<IconButtonProps> = ({
  tooltip,
  variant = 'default',
  children,
  ...props
}) => {
  const button = (
    <StyledIconButton variant={variant} {...props}>
      {children}
    </StyledIconButton>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};