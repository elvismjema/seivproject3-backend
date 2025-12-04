import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller';
import { authJwt } from '../middleware';

const router = Router();

// Get or create conversation between two users
router.post(
  '/conversations',
  [authJwt.verifyToken],
  conversationController.getOrCreateConversation
);

// Send a new message
router.post(
  '/messages',
  [authJwt.verifyToken],
  conversationController.sendMessage
);

// Get all conversations for a user
router.get(
  '/users/:userId/conversations',
  [authJwt.verifyToken],
  conversationController.getUserConversations
);

export default router;
