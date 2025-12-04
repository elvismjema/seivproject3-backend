import { authJwt } from "../middleware/index.js";
import * as controller from "../controllers/message.controller.js";
import express from 'express';

const router = express.Router();

export default (app) => {
  // CORS headers
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new message
  router.post(
    "/",
    [authJwt.verifyToken],
    controller.create
  );

  // Get conversation between current user and another user
  router.get(
    "/conversation/:userId",
    [authJwt.verifyToken],
    controller.findConversation
  );

  // Get all conversations for the current user
  router.get(
    "/conversations",
    [authJwt.verifyToken],
    controller.findAllConversations
  );

  // Get unread message count
  router.get(
    "/unread-count",
    [authJwt.verifyToken],
    controller.getUnreadCount
  );

  // Find or create a conversation with a coach (athlete only)
  router.post(
    "/conversations",
    [authJwt.verifyToken, authJwt.isAthlete],
    controller.findOrCreateConversation
  );

  // Mount the router
  app.use('/api/messages', router);
};
