import type { NextFunction, Request, Response } from 'express';
import Message from '../models/message.model.js';
import { successResponse } from '../utils/SuccessResponse.js';
import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';

export const handleGetAllMessagesByConversationId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    // const convId = new mongoose.Types.ObjectId(conversationId as string);
    if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        message: 'Invalid conversation ID',
      });
    }
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return successResponse(res, messages, 'Conversation Messages fetched successfully', 200);
  } catch (err) {
    next(err);
  }
};

export const handleGetAllConversationsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID',
      });
    }
    const messages = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId as string) })
      .populate('participants', 'name')
      .sort({ updatedAt: -1 });
    return successResponse(res, messages, 'Conversation Messages fetched successfully', 200);
  } catch (err) {
    next(err);
  }
};
