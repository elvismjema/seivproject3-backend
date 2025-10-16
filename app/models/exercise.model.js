import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Exercise = SequelizeInstance.define("exercise", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  category: {
    type: Sequelize.ENUM('strength', 'cardio', 'flexibility', 'balance', 'sport-specific'),
    allowNull: false,
  },
  muscleGroups: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Array of targeted muscle groups',
  },
  equipment: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  isStandard: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: 'True if admin-created standard exercise',
  },
  createdBy: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
});

export default Exercise;