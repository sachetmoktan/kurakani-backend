import http from 'node:http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import connectMongoDB from './config/connect_db.js';
import sessionMiddleware from './config/session.js';

import { handleCreateUser, handleLoginUser, handleLogoutUser, handleSessionValidCheck } from './controllers/user.controller.js';

import checkAuth, { requiredRoles } from './middlewares/auth.middleware.js';

import { globalErrorHandler } from './middlewares/error.middleware.js';
import { validate } from './middlewares/validate.middleware.js';

import userRouter from './routes/user.route.js';

import { signupSchema } from './schema/user.schema.js';

import { initializeSocket } from './socket/index.js';

import path from 'node:path';
import conversationRouter from './routes/conversation.route.js';
import { ROLES } from './utils/index.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Database
connectMongoDB(process.env.MONGODB_URL!);

// Middleware
app.use(cors({ origin: [process.env.CLIENT_URL!], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve('./public')));
app.use(cookieParser());

app.use(sessionMiddleware);

// Routes
app.get('/', (req, res) => {
  return res.json({
    message: 'Hello world!',
  });
});

// Public routes
app.post('/signup', validate(signupSchema), handleCreateUser);
app.post('/login', handleLoginUser);
app.post('/logout', handleLogoutUser);
app.get('/me', handleSessionValidCheck);

// Protected routes
app.use(checkAuth);
app.use(requiredRoles(ROLES.ADMIN));

app.use('/users', userRouter);
app.use('/conversations', conversationRouter);

// Global error handler
app.use(globalErrorHandler);

// HTTP server
const server = http.createServer(app);

// Socket.IO
initializeSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});
