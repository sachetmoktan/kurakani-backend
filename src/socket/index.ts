import dotenv from 'dotenv';
import mongoose from 'mongoose';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { AppError } from '../utils/AppError.js';

import sessionMiddleware from '../config/session.js';

dotenv.config();

const wrap = (middleware: any) => (socket: any, next: any) => {
  middleware(socket.request, {}, next);
};

export async function getOrCreateConversation(userId1: string, userId2: string) {
  // Prevent chatting with yourself
  if (userId1 === userId2) {
    throw new AppError('Cannot create conversation with yourself');
  }

  const user1 = new mongoose.Types.ObjectId(userId1);
  const user2 = new mongoose.Types.ObjectId(userId2);

  let conversation = await Conversation.findOne({
    participants: {
      $all: [user1, user2],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [user1, user2],
    });
  }

  return conversation;
}

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL!,
      credentials: true,
    },
  });

  // Share Express session with Socket.IO
  io.use(wrap(sessionMiddleware));

  // Socket authentication
  io.use((socket, next) => {
    const session = socket.request?.session;

    console.log('User ID:', session?.userId);

    if (!session?.userId) {
      return next(new Error('Unauthorized bro'));
    }

    next();
  });

  io.on('connection', socket => {
    if (!socket.request.session) return;

    const userId = socket.request.session.userId!;
    // console.log('Authenticated user:', userId, 'SocketId: ', socket.id);

    socket.on('conversation:create', async ({ otherUserId }) => {
      const userId = socket.request.session?.userId;

      if (!userId) {
        return;
      }

      const conversation = await getOrCreateConversation(userId, otherUserId);

      socket.emit('conversation:created', {
        conversationId: conversation._id,
      });
    });

    socket.on('conversation:join', async ({ conversationId }) => {
      const userId = socket.request.session?.userId;

      if (!userId) {
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        socket.emit('conversation:error', {
          message: 'You are not a participant',
        });

        return;
      }

      const room = `conversation:${conversationId}`;

      socket.join(room);

      console.log(`${userId} joined room ${room}`);
    });

    socket.on('message:send', async ({ conversationId, content }) => {
      try {
        if (!conversationId || !content?.trim()) {
          return socket.emit('message:error', {
            message: 'conversationId and content are required',
          });
        }

        // Check that this user belongs to the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          return socket.emit('message:error', {
            message: 'You are not a participant in this conversation',
          });
        }

        // Save message to db
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content: content.trim(),
        });

        // 4. Emit message to the conversation room
        const room = `conversation:${conversationId}`;

        io.to(room).emit('message:new', {
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          text: message.content,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error('message:send error:', error);

        socket.emit('message:error', {
          message: 'Failed to send message',
        });
      }
    });

    socket.on('disconnect', reason => {
      console.log('Socket disconnected:', {
        socketId: socket.id,
        reason,
      });
    });
  });

  return io;
}
