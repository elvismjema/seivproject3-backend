import { Sequelize } from 'sequelize';
import sequelize from '../config/sequelizeInstance.js';

// Import model functions
import userModel from './user.model.js';
import sessionModel from './session.model.js';
import exerciseModel from './exercise.model.js';
import exercisePlanModel from './exercisePlan.model.js';
import planExerciseModel from './planExercise.model.js';
import athleteCoachModel from './athleteCoach.model.js';
import goalModel from './goal.model.js';
import exerciseResultModel from './exerciseResult.model.js';
import athletePlanModel from './athletePlan.model.js';
import messageModel from './message.model.js';

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

// Run all model associations (before adding lowercase aliases to avoid duplicates)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add lowercase aliases for backward compatibility AFTER associations
db.user = User;
db.session = Session;
db.exercise = Exercise;
db.exercisePlan = ExercisePlan;
db.planExercise = PlanExercise;
db.athleteCoach = AthleteCoach;
db.goal = Goal;
db.exerciseResult = ExerciseResult;
db.athletePlan = AthletePlan;
db.message = Message;

// Export the db object with all models
export default db;
