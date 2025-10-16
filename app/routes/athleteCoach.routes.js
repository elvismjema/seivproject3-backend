import { Router } from "express";
import athleteCoachController from "../controllers/athleteCoach.controller.js";
import { verifyToken, isAdmin } from "../middleware/authRole.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Coach endpoints
router.post("/request-connection", athleteCoachController.requestConnection);
router.get("/my-athletes", athleteCoachController.getMyAthletes);

// Athlete endpoints
router.get("/my-coaches", athleteCoachController.getMyCoaches);

// Shared endpoint (coach or athlete can end relationship)
router.put("/end-relationship/:relationshipId", athleteCoachController.endRelationship);

// Admin endpoints
router.put("/update-role", isAdmin, athleteCoachController.updateUserRole);
router.get("/all-users", isAdmin, athleteCoachController.getAllUsers);

export default router;