import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import TutorialRoutes from "./tutorial.routes.js";
import LessonRoutes from "./lesson.routes.js";
import ExerciseRoutes from "./exercise.routes.js";
import ExerciseResultRoutes from "./exerciseResult.routes.js";
import AthleteCoachRoutes from "./athleteCoach.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/tutorials", TutorialRoutes);
router.use("/tutorials", LessonRoutes);

// Exercise Tracker routes
router.use("/exercises", ExerciseRoutes);
router.use("/exercise-results", ExerciseResultRoutes);
router.use("/athlete-coach", AthleteCoachRoutes);

export default router;
