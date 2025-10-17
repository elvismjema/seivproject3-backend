import db from "../models/index.js";

const ExerciseResult = db.exerciseResult;
const Goal = db.goal;
const AthletePlan = db.athletePlan;
const Exercise = db.exercise;
const ExercisePlan = db.exercisePlan;
const PlanExercise = db.planExercise;
const User = db.user;
const AthleteCoach = db.athleteCoach;
const { Op } = db.Sequelize;

// Record a workout result
export const recordWorkout = async (req, res) => {
  try {
    const athleteId = req.userId; // From auth middleware
    const { exerciseId, performedDate, sets, reps, weight, duration, distance, notes } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ message: "Exercise ID is required" });
    }

    // Verify exercise exists
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Create workout result
    const result = await ExerciseResult.create({
      athleteId,
      exerciseId,
      performedDate: performedDate || new Date(),
      sets,
      reps,
      weight,
      duration,
      distance,
      notes
    });

    res.status(201).json({
      message: "Workout recorded successfully",
      data: result
    });
  } catch (error) {
    console.error("Error recording workout:", error);
    res.status(500).json({ message: "Failed to record workout", error: error.message });
  }
};

// Get workout history
export const getWorkoutHistory = async (req, res) => {
  try {
    const athleteId = req.userId;
    const { limit = 50, offset = 0, exerciseId, startDate, endDate } = req.query;

    const whereClause = { athleteId };

    if (exerciseId) {
      whereClause.exerciseId = exerciseId;
    }

    if (startDate || endDate) {
      whereClause.performedDate = {};
      if (startDate) whereClause.performedDate[Op.gte] = startDate;
      if (endDate) whereClause.performedDate[Op.lte] = endDate;
    }

    const results = await ExerciseResult.findAll({
      where: whereClause,
      include: [{
        model: Exercise,
        as: 'exercise',
        attributes: ['id', 'name', 'category']
      }],
      order: [['performedDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({ data: results });
  } catch (error) {
    console.error("Error fetching workout history:", error);
    res.status(500).json({ message: "Failed to fetch workout history", error: error.message });
  }
};

// Get weekly stats
export const getWeeklyStats = async (req, res) => {
  try {
    const athleteId = req.userId;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Count workouts this week
    const workoutsThisWeek = await ExerciseResult.count({
      where: {
        athleteId,
        performedDate: {
          [Op.gte]: oneWeekAgo
        }
      },
      distinct: true,
      col: 'performedDate'
    });

    // Get personal records (simplified - would need more complex logic for real PRs)
    const personalRecords = await ExerciseResult.count({
      where: {
        athleteId,
        performedDate: {
          [Op.gte]: oneWeekAgo
        },
        notes: {
          [Op.like]: '%PR%'
        }
      }
    });

    res.status(200).json({
      data: {
        workoutsThisWeek,
        personalRecords
      }
    });
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    res.status(500).json({ message: "Failed to fetch weekly stats", error: error.message });
  }
};

// Get today's workout from assigned plan
export const getTodayWorkout = async (req, res) => {
  try {
    const athleteId = req.userId;
    const today = new Date().toISOString().split('T')[0];

    // Find active plans for this athlete
    const activePlans = await AthletePlan.findAll({
      where: {
        athleteId,
        startDate: {
          [Op.lte]: today
        },
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: today } }
        ]
      },
      include: [{
        model: ExercisePlan,
        as: 'plan',
        include: [{
          model: PlanExercise,
          as: 'planExercises',
          include: [{
            model: Exercise,
            as: 'exercise'
          }]
        }]
      }],
      limit: 1
    });

    if (activePlans.length === 0) {
      return res.status(200).json({ data: null });
    }

    // Return exercises from the plan
    const planExercises = activePlans[0].plan.planExercises.map(pe => ({
      id: pe.exercise.id,
      name: pe.exercise.name,
      sets: pe.sets,
      reps: pe.reps,
      weight: pe.weight,
      duration: pe.duration,
      completed: false
    }));

    res.status(200).json({ data: planExercises });
  } catch (error) {
    console.error("Error fetching today's workout:", error);
    res.status(500).json({ message: "Failed to fetch today's workout", error: error.message });
  }
};

// Get athlete's goals
export const getAthleteGoals = async (req, res) => {
  try {
    const athleteId = req.userId;

    const goals = await Goal.findAll({
      where: {
        athleteId,
        status: 'active'
      },
      include: [{
        model: Exercise,
        as: 'exercise',
        attributes: ['id', 'name', 'category']
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'fName', 'lName']
      }],
      order: [['targetDate', 'ASC']]
    });

    // Calculate progress for each goal
    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      // Get best result for this exercise
      const bestResult = await ExerciseResult.findOne({
        where: {
          athleteId,
          exerciseId: goal.exerciseId
        },
        order: getOrderByUnit(goal.targetUnit),
        limit: 1
      });

      let progress = 0;
      if (bestResult) {
        const currentValue = getValueByUnit(bestResult, goal.targetUnit);
        progress = Math.min(100, Math.round((currentValue / goal.targetValue) * 100));
      }

      return {
        id: goal.id,
        name: `${goal.exercise.name} - ${goal.targetValue} ${goal.targetUnit}`,
        targetValue: goal.targetValue,
        targetUnit: goal.targetUnit,
        targetDate: goal.targetDate,
        exercise: goal.exercise,
        creator: goal.creator,
        progress
      };
    }));

    res.status(200).json({ data: goalsWithProgress });
  } catch (error) {
    console.error("Error fetching athlete goals:", error);
    res.status(500).json({ message: "Failed to fetch goals", error: error.message });
  }
};

// Get athlete's coaches
export const getAthleteCoaches = async (req, res) => {
  try {
    const athleteId = req.userId;

    const coaches = await AthleteCoach.findAll({
      where: {
        athleteId,
        endDate: null // Active relationships only
      },
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'fName', 'lName', 'email']
      }]
    });

    res.status(200).json({
      data: coaches.map(ac => ({
        id: ac.id,
        coach: ac.coach,
        startDate: ac.startDate
      }))
    });
  } catch (error) {
    console.error("Error fetching athlete coaches:", error);
    res.status(500).json({ message: "Failed to fetch coaches", error: error.message });
  }
};

// Get athlete's assigned plans
export const getAssignedPlans = async (req, res) => {
  try {
    const athleteId = req.userId;

    const plans = await AthletePlan.findAll({
      where: {
        athleteId
      },
      include: [{
        model: ExercisePlan,
        as: 'plan',
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'fName', 'lName']
        }]
      }, {
        model: User,
        as: 'assignedByUser',
        attributes: ['id', 'fName', 'lName']
      }],
      order: [['startDate', 'DESC']]
    });

    res.status(200).json({ data: plans });
  } catch (error) {
    console.error("Error fetching assigned plans:", error);
    res.status(500).json({ message: "Failed to fetch assigned plans", error: error.message });
  }
};

// Helper functions
function getOrderByUnit(unit) {
  switch (unit) {
    case 'reps':
      return [['reps', 'DESC']];
    case 'weight_lbs':
    case 'weight_kg':
      return [['weight', 'DESC']];
    case 'time_seconds':
      return [['duration', 'ASC']]; // Lower is better for time
    case 'distance_meters':
      return [['distance', 'DESC']];
    default:
      return [['createdAt', 'DESC']];
  }
}

function getValueByUnit(result, unit) {
  switch (unit) {
    case 'reps':
      return result.reps || 0;
    case 'weight_lbs':
    case 'weight_kg':
      return result.weight || 0;
    case 'time_seconds':
      return result.duration || 0;
    case 'distance_meters':
      return result.distance || 0;
    default:
      return 0;
  }
}
