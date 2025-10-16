import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import User from "./user.model.js";
import Session from "./session.model.js";
import Exercise from "./exercise.model.js";
import ExercisePlan from "./exercisePlan.model.js";
import PlanExercise from "./planExercise.model.js";
import AthleteCoach from "./athleteCoach.model.js";
import Goal from "./goal.model.js";
import ExerciseResult from "./exerciseResult.model.js";
import AthletePlan from "./athletePlan.model.js";

// Keep old models temporarily for migration
import Tutorial from "./tutorial.model.js";
import Lesson from "./lesson.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Model assignments
db.user = User;
db.session = Session;
db.exercise = Exercise;
db.exercisePlan = ExercisePlan;
db.planExercise = PlanExercise;
db.athleteCoach = AthleteCoach;
db.goal = Goal;
db.exerciseResult = ExerciseResult;
db.athletePlan = AthletePlan;

// Keep old models temporarily
db.tutorial = Tutorial;
db.lesson = Lesson;

// ===== User Relationships =====
// Session relationship
db.user.hasMany(db.session, {
  as: "sessions",
  foreignKey: "userId",
  onDelete: "CASCADE"
});
db.session.belongsTo(db.user, {
  as: "user",
  foreignKey: "userId"
});

// ===== Exercise Relationships =====
// User creates exercises
db.user.hasMany(db.exercise, {
  as: "createdExercises",
  foreignKey: "createdBy",
  onDelete: "RESTRICT"
});
db.exercise.belongsTo(db.user, {
  as: "creator",
  foreignKey: "createdBy"
});

// ===== Exercise Plan Relationships =====
// User creates exercise plans
db.user.hasMany(db.exercisePlan, {
  as: "createdPlans",
  foreignKey: "createdBy",
  onDelete: "RESTRICT"
});
db.exercisePlan.belongsTo(db.user, {
  as: "creator",
  foreignKey: "createdBy"
});

// Plan contains exercises (many-to-many through PlanExercise)
db.exercisePlan.belongsToMany(db.exercise, {
  through: db.planExercise,
  as: "exercises",
  foreignKey: "planId",
  otherKey: "exerciseId"
});
db.exercise.belongsToMany(db.exercisePlan, {
  through: db.planExercise,
  as: "plans",
  foreignKey: "exerciseId",
  otherKey: "planId"
});

// Direct associations for PlanExercise
db.exercisePlan.hasMany(db.planExercise, {
  as: "planExercises",
  foreignKey: "planId",
  onDelete: "CASCADE"
});
db.planExercise.belongsTo(db.exercisePlan, {
  as: "plan",
  foreignKey: "planId"
});

db.exercise.hasMany(db.planExercise, {
  as: "exercisePlans",
  foreignKey: "exerciseId",
  onDelete: "CASCADE"
});
db.planExercise.belongsTo(db.exercise, {
  as: "exercise",
  foreignKey: "exerciseId"
});

// ===== Athlete-Coach Relationships =====
// Athletes have coaches (many-to-many through AthleteCoach)
db.user.belongsToMany(db.user, {
  through: db.athleteCoach,
  as: "coaches",
  foreignKey: "athleteId",
  otherKey: "coachId"
});
db.user.belongsToMany(db.user, {
  through: db.athleteCoach,
  as: "athletes",
  foreignKey: "coachId",
  otherKey: "athleteId"
});

// Direct associations for AthleteCoach
db.user.hasMany(db.athleteCoach, {
  as: "athleteRelations",
  foreignKey: "athleteId",
  onDelete: "CASCADE"
});
db.user.hasMany(db.athleteCoach, {
  as: "coachRelations",
  foreignKey: "coachId",
  onDelete: "CASCADE"
});
db.athleteCoach.belongsTo(db.user, {
  as: "athlete",
  foreignKey: "athleteId"
});
db.athleteCoach.belongsTo(db.user, {
  as: "coach",
  foreignKey: "coachId"
});

// ===== Goal Relationships =====
// Athlete has goals
db.user.hasMany(db.goal, {
  as: "goals",
  foreignKey: "athleteId",
  onDelete: "CASCADE"
});
db.goal.belongsTo(db.user, {
  as: "athlete",
  foreignKey: "athleteId"
});

// Goal creator (coach or athlete)
db.user.hasMany(db.goal, {
  as: "createdGoals",
  foreignKey: "createdBy",
  onDelete: "RESTRICT"
});
db.goal.belongsTo(db.user, {
  as: "creator",
  foreignKey: "createdBy"
});

// Goal targets an exercise
db.exercise.hasMany(db.goal, {
  as: "goals",
  foreignKey: "exerciseId",
  onDelete: "RESTRICT"
});
db.goal.belongsTo(db.exercise, {
  as: "exercise",
  foreignKey: "exerciseId"
});

// ===== Exercise Result Relationships =====
// Athlete records results
db.user.hasMany(db.exerciseResult, {
  as: "exerciseResults",
  foreignKey: "athleteId",
  onDelete: "CASCADE"
});
db.exerciseResult.belongsTo(db.user, {
  as: "athlete",
  foreignKey: "athleteId"
});

// Result for an exercise
db.exercise.hasMany(db.exerciseResult, {
  as: "results",
  foreignKey: "exerciseId",
  onDelete: "RESTRICT"
});
db.exerciseResult.belongsTo(db.exercise, {
  as: "exercise",
  foreignKey: "exerciseId"
});

// ===== Athlete Plan Relationships =====
// Athlete is assigned plans
db.user.hasMany(db.athletePlan, {
  as: "assignedPlans",
  foreignKey: "athleteId",
  onDelete: "CASCADE"
});
db.athletePlan.belongsTo(db.user, {
  as: "athlete",
  foreignKey: "athleteId"
});

// Coach assigns plans
db.user.hasMany(db.athletePlan, {
  as: "assignedByCoach",
  foreignKey: "assignedBy",
  onDelete: "RESTRICT"
});
db.athletePlan.belongsTo(db.user, {
  as: "assignedByUser",
  foreignKey: "assignedBy"
});

// Plan is assigned
db.exercisePlan.hasMany(db.athletePlan, {
  as: "athleteAssignments",
  foreignKey: "planId",
  onDelete: "RESTRICT"
});
db.athletePlan.belongsTo(db.exercisePlan, {
  as: "plan",
  foreignKey: "planId"
});

// ===== Old Tutorial Relationships (keep temporarily) =====
db.user.hasMany(db.tutorial, {
  as: "tutorial",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE"
});
db.tutorial.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE"
});

db.tutorial.hasMany(db.lesson, {
  as: "lesson",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE"
});
db.lesson.belongsTo(db.tutorial, {
  as: "tutorial",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE"
});

export default db;
