const { authJwt } = require("../middleware");
const controller = require("../controllers/message.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new message
  app.post(
    "/api/messages",
    [authJwt.verifyToken],
    controller.create
  );

  // Get conversation between current user and another user
  app.get(
    "/api/messages/conversation/:userId",
    [authJwt.verifyToken],
    controller.findConversation
  );

  // Get all conversations for the current user
  app.get(
    "/api/messages/conversations",
    [authJwt.verifyToken],
    controller.findAllConversations
  );

  // Get unread message count
  app.get(
    "/api/messages/unread-count",
    [authJwt.verifyToken],
    controller.getUnreadCount
  );
};
