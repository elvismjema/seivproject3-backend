import { Router } from "express";
const router = Router();

// Import routes
import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import TutorialRoutes from "./tutorial.routes.js";
import LessonRoutes from "./lesson.routes.js";
import ExerciseRoutes from "./exercise.routes.js";
import ExerciseResultRoutes from "./exerciseResult.routes.js";
import AthleteCoachRoutes from "./athleteCoach.routes.js";
import AthleteRoutes from "./athlete.routes.js";
import CoachRoutes from "./coach.routes.js";
import AdminRoutes from "./admin.routes.js";
import MessageRoutes from "./message.routes.js";

// Use routes
router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/tutorials", TutorialRoutes);
router.use("/tutorials", LessonRoutes);

// Exercise Tracker routes
router.use("/exercises", ExerciseRoutes);
router.use("/exercise-results", ExerciseResultRoutes);
router.use("/athlete-coach", AthleteCoachRoutes);
router.use("/athlete", AthleteRoutes);
router.use("/coach", CoachRoutes);
router.use("/admin", AdminRoutes);
router.use("/api", MessageRoutes);

export default router;
