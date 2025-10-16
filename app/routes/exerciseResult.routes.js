import { Router } from "express";
import exerciseResultController from "../controllers/exerciseResult.controller.js";
import { verifyToken } from "../middleware/authRole.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Create new exercise result
router.post("/", exerciseResultController.create);

// Get all exercise results (filtered based on user role)
router.get("/", exerciseResultController.findAll);

// Get statistics for an athlete
router.get("/statistics/:athleteId?", exerciseResultController.getStatistics);

// Get single exercise result
router.get("/:id", exerciseResultController.findOne);

// Update exercise result
router.put("/:id", exerciseResultController.update);

// Delete exercise result
router.delete("/:id", exerciseResultController.remove);

export default router;