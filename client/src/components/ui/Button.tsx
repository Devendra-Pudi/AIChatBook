import React from 'react';
import { Button as MuiButton } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

const StyledButton = styled(MuiButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  fontWeight: 500,
  textTransform: 'none',
  '&.MuiButton-containedPrimary': {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    '&:hover': {
      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    },
  },
}));

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  loading = false, 
  disabled,
  ...props 
}) => {
  return (
    <StyledButton
      {...props}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : children}
    </StyledButton>
  );
};