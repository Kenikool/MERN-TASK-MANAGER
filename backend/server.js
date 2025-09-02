import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
// dotenv loaded via dotenv/config
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { socketAuthMiddleware } from './middleware/socketAuth.js'

import authRoute from "./routes/auth.route.js";
import tasksRoute from "./routes/tasks.route.js";
import projectsRoute from "./routes/projects.route.js";
import usersRoute from "./routes/users.route.js";
import uploadRoute from "./routes/upload.route.js";
import timeTrackingRoute from "./routes/timeTracking.route.js";
import notificationsRoute from "./routes/notifications.route.js";
import reportsRoute from "./routes/reports.route.js";
import analyticsRoute from "./routes/analytics.route.js";
import subscriptionRoute from "./routes/subscription.route.js";
import paymentRoute from "./routes/payment.route.js";
import cleanupRoute from "./routes/cleanup.route.js";
import connectDB from "./config/database.js";

// (dotenv.config called at top) REMOVE

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Variables Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing');
console.log('- PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? 'Set' : 'Missing');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Use authentication middleware
io.use(socketAuthMiddleware);

// middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(compression());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Serve mock uploads for development
app.use('/uploads', express.static('uploads'));
app.get('/uploads/mock-*', (req, res) => {
  // Serve a placeholder image for mock uploads
  res.redirect('https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Mock+Image');
});
// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || [ 'http://localhost:5173', 'http://localhost:5174' ],
  credentials: true
}));

// Body parsing middleware (duplicate removed)

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                process.env.CLOUDINARY_API_KEY && 
                                process.env.CLOUDINARY_API_SECRET;
  
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: 'connected',
      cloudinary: isCloudinaryConfigured ? 'configured' : 'not configured (using mock uploads)',
      socketIO: {
        enabled: true,
        connectedClients: io.engine.clientsCount || 0
      }
    }
  });
});

// Socket.IO health check endpoint
app.get('/api/socket/health', (req, res) => {
  res.json({
    success: true,
    message: 'Socket.IO server is running',
    connectedClients: io.engine.clientsCount || 0,
    connectedUsers: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Routes
try {
  app.use("/api/auth", authRoute);
  app.use("/api/tasks", tasksRoute);
  app.use("/api/projects", projectsRoute);
  app.use("/api/users", usersRoute);
  app.use("/api/upload", uploadRoute);
  app.use("/api/time", timeTrackingRoute);
  app.use("/api/notifications", notificationsRoute);
  app.use("/api/reports", reportsRoute);
  app.use("/api/analytics", analyticsRoute);
  app.use("/api/subscription", subscriptionRoute);
  app.use("/api/payment", paymentRoute);
  app.use("/api/cleanup", cleanupRoute);
  
  console.log('✅ All routes loaded successfully');
  console.log('✅ Subscription routes available at /api/subscription/*');
  console.log('✅ Payment routes available at /api/payment/*');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});
// Socket.IO connection handling
const connectedUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user authentication
  socket.on('authenticate', (data) => {
    if (data.userId) {
      connectedUsers.set(socket.id, {
        userId: data.userId,
        userName: data.userName,
        socketId: socket.id,
        connectedAt: new Date()
      });
      userSockets.set(data.userId, socket.id);
      
      // Join user to their personal room
      socket.join(`user_${data.userId}`);
      
      // Broadcast updated online users list
      const onlineUsers = Array.from(connectedUsers.values());
      io.emit('onlineUsers', onlineUsers);
      
      // Notify others that user joined
      socket.broadcast.emit('userJoined', {
        id: data.userId,
        name: data.userName,
        connectedAt: new Date()
      });
      
      console.log(`✅ User authenticated: ${data.userName} (${data.userId})`);
    }
  });

  // Handle project room management
  socket.on('join-project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`📁 User joined project room: ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project_${projectId}`);
    console.log(`📁 User left project room: ${projectId}`);
  });

  // Handle task room management
  socket.on('join-task', (taskId) => {
    socket.join(`task_${taskId}`);
    console.log(`📝 User joined task room: ${taskId}`);
  });

  socket.on('leave-task', (taskId) => {
    socket.leave(`task_${taskId}`);
    console.log(`📝 User left task room: ${taskId}`);
  });

  // Handle real-time updates
  socket.on('taskUpdate', (data) => {
    socket.to(`task_${data.taskId}`).emit('taskUpdate', data);
    socket.to(`project_${data.projectId}`).emit('taskUpdate', data);
    console.log(`📝 Task update broadcasted: ${data.taskId}`);
  });

  socket.on('projectUpdate', (data) => {
    socket.to(`project_${data.projectId}`).emit('projectUpdate', data);
    console.log(`📁 Project update broadcasted: ${data.projectId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.to(`task_${data.taskId}`).emit('user-typing', {
        taskId: data.taskId,
        userId: user.userId,
        userName: user.userName
      });
    }
  });

  socket.on('typing-stop', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.to(`task_${data.taskId}`).emit('user-stopped-typing', {
        taskId: data.taskId,
        userId: user.userId,
        userName: user.userName
      });
    }
  });

  // Handle timer events
  socket.on('timer-start', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.to(`task_${data.taskId}`).emit('timer-started', {
        taskId: data.taskId,
        taskTitle: data.taskTitle,
        userId: user.userId,
        userName: user.userName,
        startedAt: new Date()
      });
    }
  });

  socket.on('timer-stop', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.to(`task_${data.taskId}`).emit('timer-stopped', {
        taskId: data.taskId,
        taskTitle: data.taskTitle,
        userId: user.userId,
        userName: user.userName,
        duration: data.duration,
        stoppedAt: new Date()
      });
    }
  });

  // Handle notifications
  socket.on('send-notification', (data) => {
    if (data.targetUserId) {
      // Send to specific user
      io.to(`user_${data.targetUserId}`).emit('notification', data.notification);
    } else if (data.projectId) {
      // Send to all users in project
      io.to(`project_${data.projectId}`).emit('notification', data.notification);
    } else {
      // Broadcast to all users
      io.emit('notification', data.notification);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      userSockets.delete(user.userId);
      
      // Broadcast updated online users list
      const onlineUsers = Array.from(connectedUsers.values());
      io.emit('onlineUsers', onlineUsers);
      
      // Notify others that user left
      socket.broadcast.emit('userLeft', {
        id: user.userId,
        name: user.userName
      });
      
      console.log(`❌ User disconnected: ${user.userName} (${reason})`);
    } else {
      console.log(`❌ Unknown user disconnected: ${socket.id} (${reason})`);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`🔌 Socket error for ${socket.id}:`, error);
  });
});

// Helper function to send notification to specific user
export const sendNotificationToUser = (userId, notification) => {
  io.to(`user_${userId}`).emit('notification', notification);
};

// Helper function to send notification to project members
export const sendNotificationToProject = (projectId, notification) => {
  io.to(`project_${projectId}`).emit('notification', notification);
};

// Helper function to broadcast task updates
export const broadcastTaskUpdate = (taskId, projectId, updateData) => {
  io.to(`task_${taskId}`).emit('taskUpdate', updateData);
  io.to(`project_${projectId}`).emit('taskUpdate', updateData);
};

// Helper function to broadcast project updates
export const broadcastProjectUpdate = (projectId, updateData) => {
  io.to(`project_${projectId}`).emit('projectUpdate', updateData);
};

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`🔌 Socket.IO server ready`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });