import { Router } from "express";
import exerciseController from "../controllers/exercise.controller.js";
import { verifyToken, isCoachOrAdmin } from "../middleware/authRole.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Create new exercise (coaches and admins only)
router.post("/", isCoachOrAdmin, exerciseController.create);

// Get all exercises (filtered based on user role)
router.get("/", exerciseController.findAll);

// Get single exercise
router.get("/:id", exerciseController.findOne);

// Update exercise (coaches can update their own, admins can update any)
router.put("/:id", isCoachOrAdmin, exerciseController.update);

// Delete exercise (coaches can delete their own, admins can delete any)
router.delete("/:id", isCoachOrAdmin, exerciseController.remove);

export default router;