const { Router } = require("express");
const router = Router();

// Import routes
const AuthRoutes = require("./auth.routes");
const UserRoutes = require("./user.routes");
const TutorialRoutes = require("./tutorial.routes");
const LessonRoutes = require("./lesson.routes");
const ExerciseRoutes = require("./exercise.routes");
const ExerciseResultRoutes = require("./exerciseResult.routes");
const AthleteCoachRoutes = require("./athleteCoach.routes");
const AthleteRoutes = require("./athlete.routes");
const CoachRoutes = require("./coach.routes");
const AdminRoutes = require("./admin.routes");
const MessageRoutes = require("./message.routes");

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

module.exports = router;
