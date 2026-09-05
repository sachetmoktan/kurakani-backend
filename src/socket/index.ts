import dotenv from 'dotenv';
import mongoose from 'mongoose';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { AppError } from '../utils/AppError.js';

import sessionMiddleware from '../config/session.js';
import User from '../models/user.model.js';

dotenv.config();

const wrap = (middleware: any) => (socket: any, next: any) => {
  middleware(socket.request, {}, next);
};

export async function checkUserExists(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)];
  const userObjectIds = uniqueUserIds.map(usrId => new mongoose.Types.ObjectId(usrId));
  const users = await User.find({
    _id: { $in: userObjectIds },
  }).select('_id');

  if (users.length !== uniqueUserIds.length) {
    throw new Error('One or more users do not exist');
  }
  return users.map(user => user._id);
}

export async function getOrCreateConversation(userId1: string, userId2: string) {
  let isNewConversation = false;
  // Prevent chatting with yourself
  if (userId1 === userId2) {
    throw new AppError('Cannot create conversation with yourself');
  }
  const usersList = await checkUserExists([userId1, userId2]);

  let conversation = await Conversation.findOne({
    participants: {
      $all: [...usersList],
    },
  });

  if (!conversation) {
    console.log('New conversation is forming for: ', usersList);
    conversation = await Conversation.create({
      participants: [...usersList],
    });
    isNewConversation = true;
  }

  return { conversation, isNewConversation };
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
    // console.log('User ID:', session?.userId);
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
      if (!otherUserId) throw new Error('Provide user id to create conversation with');
      const { conversation, isNewConversation } = await getOrCreateConversation(userId, otherUserId);

      socket.emit('conversation:created', {
        conversationId: conversation._id,
      });

      // After new conversation is formed, all the users in it should be able to populate new conversation data
      // privately for conversations update
      if (isNewConversation) {
        conversation.participants.forEach(participantId => {
          io.to(`to_user:${participantId}`).emit('conversation:update', {
            conversation,
          });
        });
      }
      // --
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

      // Creating a room and joining in it
      const room = `conversation:${conversationId}`;
      socket.join(room);
      // console.log(`${userId} joined room ${room}`);

      // After joining the room, if there were unseen messages, then those will be changed to read
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          [`unreadCount.${userId}`]: 0,
        },
      });

      // privately for conversations update
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== userId.toString()) return;
        io.to(`to_user:${participantId}`).emit('conversation:update', {
          conversationId: conversationId,
          unreadCount: {
            userId: `${participantId}`,
            count: 0,
          },
        });
      });
      // --
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

        // Increase the message unread count for another user
        // Also set the lastMessage
        const update: {
          $set: {
            lastMessageDetail: {
              content: string;
              senderId: mongoose.Types.ObjectId;
              createdAt: Date;
            };
          };
          $inc: Record<string, number>;
        } = {
          $set: {
            lastMessageDetail: {
              content: message.content,
              senderId: new mongoose.Types.ObjectId(message.senderId),
              createdAt: message.createdAt,
            },
          },
          $inc: {},
        };
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== message.senderId.toString()) {
            update.$inc[`unreadCount.${participantId}`] = 1;
          }
        });
        await Conversation.findByIdAndUpdate(conversationId, update);
        //--

        // Emit message to the conversation room
        const room = `conversation:${conversationId}`;

        io.to(room).emit('message:new', {
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        });

        // privately for conversations update
        conversation.participants.forEach(participantId => {
          if (participantId.toString() === message.senderId.toString()) return;
          io.to(`to_user:${participantId}`).emit('conversation:update', {
            conversationId: conversationId,
            unreadCount: {
              userId: `${participantId}`,
              count: (conversation!.unreadCount?.get(`${participantId}`) || 0) + 1,
            },
          });
        });
        // --
      } catch (error) {
        console.error('message:send error:', error);

        socket.emit('message:error', {
          message: 'Failed to send message',
        });
      }
    });

    // join own private room to update about conversations
    socket.on('private:join', async () => {
      const userId = socket.request.session?.userId;
      if (!userId) {
        return;
      }
      const room = `to_user:${userId}`;
      socket.join(room);
    });

    // to set unread message count to 0, if the user is currently opening the conversation
    socket.on('private:currentconversation', async ({ conversationId }) => {
      try {
        const userId = socket.request.session?.userId;
        if (!userId) {
          return;
        }
        if (!conversationId) {
          return socket.emit('currentconversation:error', {
            message: 'conversationId is required',
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

        await Conversation.findByIdAndUpdate(conversationId, {
          $set: {
            [`unreadCount.${userId}`]: 0,
          },
        });

        conversation.participants.forEach(participantId => {
          if (
            conversation?.lastMessageDetail?.senderId!.toString() &&
            participantId.toString() === conversation?.lastMessageDetail?.senderId!.toString()
          )
            return;
          io.to(`to_user:${userId}`).emit('currentconversation:active', {
            convId: conversationId,
            usrId: userId,
          });
        });
      } catch (error) {
        console.error('private:currentconversation error:', error);

        socket.emit('currentconversation:error', {
          message: 'Failed to update conversation unread count',
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
