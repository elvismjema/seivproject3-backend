const db = require("../models");
const Message = db.message;
const { Op } = db.Sequelize;

// Start or get existing conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participant1Id, participant2Id } = req.body;
    
    if (!participant1Id || !participant2Id) {
      return res.status(400).send({
        message: "Both participant IDs are required!"
      });
    }

    // Check if conversation already exists
    const existingMessages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: participant1Id,
            receiverId: participant2Id
          },
          {
            senderId: participant2Id,
            receiverId: participant1Id
          }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).send({
      messages: existingMessages,
      participant1Id,
      participant2Id
    });
    
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Error retrieving conversation."
    });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).send({
        message: "Sender ID, receiver ID, and content are required!"
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content,
      isRead: false
    });

    return res.status(201).send(message);
    
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Error sending message."
    });
  }
};

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get all unique user IDs that the current user has messaged with
    const sentMessages = await Message.findAll({
      where: { senderId: userId },
      attributes: ['receiverId'],
      group: ['receiverId']
    });
    
    const receivedMessages = await Message.findAll({
      where: { receiverId: userId },
      attributes: ['senderId'],
      group: ['senderId']
    });
    
    // Combine and dedupe user IDs
    const participantIds = [
      ...new Set([
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId)
      ])
    ];
    
    // Get the most recent message for each conversation
    const conversations = await Promise.all(
      participantIds.map(async (participantId) => {
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: userId, receiverId: participantId },
              { senderId: participantId, receiverId: userId }
            ]
          },
          order: [['createdAt', 'DESC']],
          include: [
            { model: db.user, as: 'sender' },
            { model: db.user, as: 'receiver' }
          ]
        });
        
        return lastMessage;
      })
    );
    
    return res.status(200).send(conversations.filter(c => c !== null));
    
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Error retrieving conversations."
    });
  }
};
