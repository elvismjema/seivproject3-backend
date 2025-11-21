import express from "express";
import * as CoachController from "../controllers/coach.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Athlete management routes
router.get("/athletes", CoachController.getCoachAthletes);
router.post("/athletes", CoachController.addAthlete);
router.delete("/athletes/:athleteId", CoachController.removeAthlete);
router.get("/athletes/:athleteId/progress", CoachController.getAthleteProgress);

// Training plan routes
router.post("/plans", CoachController.createPlan);
router.get("/plans", CoachController.getCoachPlans);
router.put("/plans/:planId", CoachController.updatePlan);
router.delete("/plans/:planId", CoachController.deletePlan);
router.post("/plans/assign", CoachController.assignPlan);
router.post("/plans/unassign", CoachController.unassignPlan);

// Goal routes
router.post("/goals", CoachController.createGoal);
router.get("/goals", CoachController.getCoachGoals);

// Results routes
router.get("/results/recent", CoachController.getCoachRecentResults);
router.get("/results/weekly/count", CoachController.getWeeklyResultsCount);
router.post("/results", CoachController.recordWorkoutResult);

// Exercise routes
router.get("/exercises", CoachController.getExercises);
router.post("/exercises", CoachController.createExercise);
router.put("/exercises/:exerciseId", CoachController.updateExercise);
router.delete("/exercises/:exerciseId", CoachController.deleteExercise);
router.get("/exercises/custom/count", CoachController.getCustomExercisesCount);

// Goals count route
router.get("/goals/active/count", CoachController.getActiveGoalsCount);

export default router;
