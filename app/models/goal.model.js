import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Goal = SequelizeInstance.define("goal", {
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
  exerciseId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'exercises',
      key: 'id',
    },
  },
  targetValue: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Target numeric value',
  },
  targetUnit: {
    type: Sequelize.ENUM('reps', 'weight_lbs', 'weight_kg', 'time_seconds', 'distance_meters'),
    allowNull: false,
  },
  targetDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
    comment: 'Target completion date',
  },
  status: {
    type: Sequelize.ENUM('active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
  },
  createdBy: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Who created the goal (coach or athlete)',
  },
});

export default Goal;