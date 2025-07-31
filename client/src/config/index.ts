// Environment validation
export const validateEnv = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables: ${missingVars.join(', ')}. Please check your .env file.`
    );
  }
};

// App configuration
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'AIChatBook',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  togetherAiApiKey: import.meta.env.VITE_TOGETHER_AI_API_KEY,
};

export * from './firebase';