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
router.post("/plans/assign", CoachController.assignPlan);

// Goal routes
router.post("/goals", CoachController.createGoal);

// Results routes
router.get("/results/recent", CoachController.getCoachRecentResults);

export default router;
