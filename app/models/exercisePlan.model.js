import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ExercisePlan = SequelizeInstance.define("exercisePlan", {
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
    comment: 'Plan description and goals',
  },
  duration: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: 'Duration in weeks',
  },
  isStandard: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: 'True if admin-created',
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

export default ExercisePlan;