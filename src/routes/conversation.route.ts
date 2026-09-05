import { Router } from 'express';
import { handleGetAllConversationsByUser, handleGetAllMessagesByConversationId } from '../controllers/conversation.controller.js';

const conversationRouter = Router();

conversationRouter.get('/:conversationId/messages', handleGetAllMessagesByConversationId);
conversationRouter.get('/user/:userId', handleGetAllConversationsByUser);

export default conversationRouter;
