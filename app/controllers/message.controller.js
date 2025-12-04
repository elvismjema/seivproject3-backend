import db from "../models/index.js";
const { message: Message, user: User, athleteCoach: AthleteCoach } = db;

// Create and Save a new Message
export const create = async (req, res) => {
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
export const findConversation = async (req, res) => {
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
export const findAllConversations = async (req, res) => {
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

// Find or create a conversation with a coach
export const findOrCreateConversation = async (req, res) => {
  try {
    const { coachId } = req.body;
    const athleteId = req.userId;

    if (!coachId) {
      return res.status(400).send({
        success: false,
        message: "Coach ID is required"
      });
    }

    // Check if the athlete is actually assigned to this coach
    const coachAssignment = await AthleteCoach.findOne({
      where: {
        athleteId,
        coachId,
        endDate: null // Active relationship only
      },
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'fName', 'lName', 'email', 'profileImage']
        },
        {
          model: User,
          as: 'athlete',
          attributes: ['id', 'fName', 'lName', 'email', 'profileImage']
        }
      ]
    });

    if (!coachAssignment) {
      return res.status(403).send({
        success: false,
        message: "You are not assigned to this coach"
      });
    }

    // Find existing messages between these users
    const existingMessages = await Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { senderId: athleteId, receiverId: coachId },
          { senderId: coachId, receiverId: athleteId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    // Get the last message timestamp if any messages exist
    const lastMessage = existingMessages.length > 0 
      ? existingMessages[existingMessages.length - 1].createdAt 
      : new Date();

    // Mark unread messages as read
    if (existingMessages.length > 0) {
      await Message.update(
        { isRead: true },
        {
          where: {
            senderId: coachId,
            receiverId: athleteId,
            isRead: false
          }
        }
      );
    }

    res.status(200).send({
      success: true,
      data: {
        id: `conversation_${athleteId}_${coachId}`,
        coach: coachAssignment.coach,
        athlete: coachAssignment.athlete,
        lastMessageAt: lastMessage,
        messages: existingMessages,
        isNew: existingMessages.length === 0
      }
    });

  } catch (err) {
    console.error("Error in findOrCreateConversation:", err);
    res.status(500).send({
      success: false,
      message: err.message || "Error finding or creating conversation"
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
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
