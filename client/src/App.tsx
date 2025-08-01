import { useEffect } from 'react';
import { validateEnv } from './config';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import AppRouter from './components/layout/AppRouter';

function App() {
  useEffect(() => {
    // Validate environment variables on app start
    validateEnv();
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
