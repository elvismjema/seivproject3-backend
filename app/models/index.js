import { Sequelize } from 'sequelize';
import sequelize from '../config/sequelizeInstance.js';

// Import model functions
const userModel = require('./user.model.js');
const sessionModel = require('./session.model.js');
const exerciseModel = require('./exercise.model.js');
const exercisePlanModel = require('./exercisePlan.model.js');
const planExerciseModel = require('./planExercise.model.js');
const athleteCoachModel = require('./athleteCoach.model.js');
const goalModel = require('./goal.model.js');
const exerciseResultModel = require('./exerciseResult.model.js');
const athletePlanModel = require('./athletePlan.model.js');
const messageModel = require('./message.model.js');

// Initialize models
const User = userModel(sequelize, Sequelize);
const Session = sessionModel(sequelize, Sequelize);
const Exercise = exerciseModel(sequelize, Sequelize);
const ExercisePlan = exercisePlanModel(sequelize, Sequelize);
const PlanExercise = planExerciseModel(sequelize, Sequelize);
const AthleteCoach = athleteCoachModel(sequelize, Sequelize);
const Goal = goalModel(sequelize, Sequelize);
const ExerciseResult = exerciseResultModel(sequelize, Sequelize);
const AthletePlan = athletePlanModel(sequelize, Sequelize);
const Message = messageModel(sequelize, Sequelize);

const db = {
  Sequelize,
  sequelize,
  User,
  Session,
  Exercise,
  ExercisePlan,
  PlanExercise,
  AthleteCoach,
  Goal,
  ExerciseResult,
  AthletePlan,
  Message
};

// Run all model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export the db object with all models
module.exports = db;
