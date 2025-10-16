import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const AthletePlan = SequelizeInstance.define("athletePlan", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  athleteId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  planId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'exercisePlans',
      key: 'id',
    },
  },
  assignedBy: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Coach who assigned the plan',
  },
  startDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
    comment: 'Plan end date',
  },
  status: {
    type: Sequelize.ENUM('active', 'completed', 'paused'),
    allowNull: false,
    defaultValue: 'active',
  },
});

export default AthletePlan;