import express from "express";
import * as AdminController from "../controllers/admin.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Dashboard stats
router.get("/stats", AdminController.getDashboardStats);

// Plan management routes
router.get("/plans", AdminController.getAllPlans);
router.post("/plans", AdminController.createStandardPlan);
router.put("/plans/:planId", AdminController.updatePlan);
router.delete("/plans/:planId", AdminController.deletePlan);

export default router;