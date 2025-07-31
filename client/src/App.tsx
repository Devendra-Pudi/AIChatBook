import { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Container } from '@mui/material';
import { validateEnv } from './config';

// Create a basic theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0ea5e9',
    },
    secondary: {
      main: '#64748b',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
});

function App() {
  useEffect(() => {
    // Validate environment variables on app start
    validateEnv();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            ChatAI
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Modern Chat Application with AI Integration
          </Typography>
          <Box className="mt-8 p-6 bg-gray-50 rounded-lg">
            <Typography variant="body1">
              Project foundation is ready! 🚀
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-2">
              Vite + React + TypeScript + Tailwind CSS + Material-UI
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
