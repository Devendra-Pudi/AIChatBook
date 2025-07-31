// Environment configuration
export const env = {
  // Firebase
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },

  // Together AI
  togetherAI: {
    apiKey: import.meta.env.VITE_TOGETHER_AI_API_KEY,
  },

  // Socket.io
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  },

  // App
  app: {
    name: import.meta.env.VITE_APP_NAME || 'ChatAI',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Missing environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  return missing.length === 0;
};
