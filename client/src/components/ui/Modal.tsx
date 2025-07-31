import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(1),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
}) => {
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      {title && (
        <StyledDialogTitle>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </StyledDialogTitle>
      )}
      
      <DialogContent sx={{ padding: 3 }}>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ padding: 3, paddingTop: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {actions}
          </Box>
        </DialogActions>
      )}
    </StyledDialog>
  );
};