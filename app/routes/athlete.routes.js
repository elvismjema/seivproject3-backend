import express from "express";
import * as AthleteController from "../controllers/athlete.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Workout routes
router.post("/workouts", AthleteController.recordWorkout);
router.get("/workouts/history", AthleteController.getWorkoutHistory);
router.get("/workouts/today", AthleteController.getTodayWorkout);
router.get("/stats/weekly", AthleteController.getWeeklyStats);

// Goal routes
router.get("/goals", AthleteController.getAthleteGoals);

// Coach routes
router.get("/coaches", AthleteController.getAthleteCoaches);

// Plan routes
router.get("/plans", AthleteController.getAssignedPlans);

export default router;
