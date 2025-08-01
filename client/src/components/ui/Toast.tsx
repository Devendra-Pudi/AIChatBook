import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  type SlideProps,
} from '@mui/material';
import type { AlertColor } from '@mui/material';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  title?: string;
  severity?: AlertColor;
  duration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  onClose,
  message,
  title,
  severity = 'info',
  duration = 6000,
  position = { vertical: 'bottom', horizontal: 'left' },
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={SlideTransition}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          borderRadius: 2,
          '& .MuiAlert-message': {
            padding: 0,
          },
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};