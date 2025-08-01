import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { SocketService } from './services/socketService.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io setup with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize socket service
const socketService = new SocketService(io);

// Handle socket connections
io.on('connection', (socket) => {
  socketService.handleConnection(socket);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    onlineUsers: socketService.getOnlineUsersCount()
  });
});

// Basic API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    server: 'ChatAI Socket Server',
    version: '1.0.0',
    status: 'running',
    onlineUsers: socketService.getOnlineUsersCount()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${corsOptions.origin}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;