# ChatAI - Modern Chat Application with AI Integration

A modern, real-time chat application built with React, TypeScript, and AI integration capabilities.

## 🚀 Features

- **Real-time messaging** with Socket.io
- **AI-powered chat** with Together AI integration
- **User authentication** with Firebase Auth
- **Modern UI** with Material-UI and Tailwind CSS
- **TypeScript** for type safety
- **Responsive design** for all devices

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Material-UI** - React component library
- **Zustand** - State management
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time communication
- **Firebase Admin** - Authentication and database

### Services
- **Firebase** - Authentication and Firestore database
- **Together AI** - AI chat capabilities

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── chat/       # Chat-related components
│   │   │   ├── layout/     # Layout components
│   │   │   └── ui/         # Generic UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and external services
│   │   │   ├── ai/         # AI service integration
│   │   │   ├── firebase/   # Firebase configuration
│   │   │   └── socket/     # Socket.io client
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Environment configuration
│   └── ...
├── server/                 # Backend Node.js application
└── ...
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project
- Together AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Devendra-Pudi/AIChatBook.git
   cd AIChatBook
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   - Firebase configuration
   - Together AI API key
   - Socket.io server URL

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Available Scripts

In the client directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the client directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Together AI Configuration
VITE_TOGETHER_AI_API_KEY=your_together_ai_api_key

# Socket.io Configuration
VITE_SOCKET_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=ChatAI
VITE_APP_VERSION=1.0.0
```

## 🎨 Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for Git hooks
- **lint-staged** for pre-commit checks
- **TypeScript** for type checking

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.