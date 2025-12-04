const db = require("../models");
const Message = db.message;
const User = db.user;

// Create and Save a new Message
exports.create = async (req, res) => {
  try {
    if (!req.body.content || !req.body.receiverId) {
      return res.status(400).send({
        message: "Content and receiverId are required!"
      });
    }

    const message = {
      senderId: req.userId,
      receiverId: req.body.receiverId,
      content: req.body.content,
      isRead: false
    };

    const createdMessage = await Message.create(message);
    
    // Populate sender info
    const messageWithSender = await Message.findByPk(createdMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fName', 'lName', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fName', 'lName', 'email']
        }
      ]
    });

    res.send(messageWithSender);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the message."
    });
  }
};

// Retrieve all messages between the current user and another user
exports.findConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.userId;

    if (!otherUserId) {
      return res.status(400).send({
        message: "User ID is required!"
      });
    }

    const messages = await Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          {
            senderId: currentUserId,
            receiverId: otherUserId
          },
          {
            senderId: otherUserId,
            receiverId: currentUserId
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fName', 'lName', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fName', 'lName', 'email']
        }
      ],
      order: [
        ['createdAt', 'ASC']
      ]
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          isRead: false
        }
      }
    );

    res.send(messages);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving messages."
    });
  }
};

// Get all conversations for the current user
exports.findAllConversations = async (req, res) => {
  try {
    const currentUserId = req.userId;

    // Get the last message from each conversation
    const conversations = await Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fName', 'lName', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fName', 'lName', 'email']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    // Group messages by conversation
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUserId = message.senderId === currentUserId 
        ? message.receiverId 
        : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, message);
      }
    });

    // Convert map to array and sort by most recent message
    const result = Array.from(conversationMap.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(conversation => ({
        otherUser: conversation.senderId === currentUserId 
          ? conversation.receiver 
          : conversation.sender,
        lastMessage: {
          id: conversation.id,
          content: conversation.content,
          isRead: conversation.isRead,
          createdAt: conversation.createdAt
        },
        unreadCount: 0 // Will be populated by the client if needed
      }));

    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving conversations."
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        receiverId: req.userId,
        isRead: false
      }
    });
    
    res.send({ count });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving unread count."
    });
  }
};
