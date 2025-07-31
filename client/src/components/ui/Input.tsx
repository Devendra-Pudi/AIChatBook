import React from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark' ? '#374151' : '#d1d5db',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
  },
}));

export const Input: React.FC<TextFieldProps> = (props) => {
  return <StyledTextField {...props} />;
};