import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AlertColor } from '@mui/material';
import { Toast } from '../components/ui';

interface ToastMessage {
  id: string;
  message: string;
  title?: string;
  severity?: AlertColor;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    options?: {
      title?: string;
      severity?: AlertColor;
      duration?: number;
    }
  ) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    options: {
      title?: string;
      severity?: AlertColor;
      duration?: number;
    } = {}
  ) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      id,
      message,
      title: options.title,
      severity: options.severity || 'info',
      duration: options.duration || 6000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }, [removeToast]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'success', title });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'error', title });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'warning', title });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'info', title });
  }, [showToast]);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={true}
          onClose={() => removeToast(toast.id)}
          message={toast.message}
          title={toast.title}
          severity={toast.severity}
          duration={toast.duration}
        />
      ))}
    </ToastContext.Provider>
  );
};