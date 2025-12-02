import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const User = SequelizeInstance.define("user", {

  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: Sequelize.ENUM('admin', 'coach', 'athlete'),
    allowNull: false,
    defaultValue: 'athlete',
  },
  profileImage: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
});

// Define associations
User.associate = function(models) {
  // A coach can have many athletes
  User.belongsToMany(User, {
    as: 'athletes',
    through: 'athleteCoaches',
    foreignKey: 'coachId',
    otherKey: 'athleteId'
  });

  // An athlete can have many coaches
  User.belongsToMany(User, {
    as: 'coaches',
    through: 'athleteCoaches',
    foreignKey: 'athleteId',
    otherKey: 'coachId'
  });
};

export default User;

