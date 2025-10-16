import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const PlanExercise = SequelizeInstance.define("planExercise", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  planId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'exercisePlans',
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
  dayOfWeek: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 7,
    },
    comment: 'Day of week (1=Monday, 7=Sunday)',
  },
  sets: {
    type: Sequelize.INTEGER,
    allowNull: true,
    comment: 'Number of sets',
  },
  reps: {
    type: Sequelize.INTEGER,
    allowNull: true,
    comment: 'Number of reps per set',
  },
  duration: {
    type: Sequelize.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds',
  },
  restTime: {
    type: Sequelize.INTEGER,
    allowNull: true,
    comment: 'Rest between sets in seconds',
  },
  order: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: 'Exercise order in the day',
  },
});

export default PlanExercise;