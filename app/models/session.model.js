export default (sequelize, Sequelize) => {
  const Session = sequelize.define("sessions", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: Sequelize.STRING(3000),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expirationDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
  
  return Session;
};
