export default (sequelize, Sequelize) => {
  const Message = sequelize.define("message", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users', 
        key: 'id'
      }
    },
    receiverId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    isRead: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Message;
};
