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

// Get coach's athletes
export const getCoachAthletes = async (req, res) => {
  try {
    const coachId = req.userId;

    const athletes = await AthleteCoach.findAll({
      where: {
        coachId,
        endDate: null // Active relationships only
      },
      include: [{
        model: User,
        as: 'athlete',
        attributes: ['id', 'fName', 'lName', 'email']
      }]
    });

    // Get current plan for each athlete
    const athletesWithPlans = await Promise.all(athletes.map(async (ac) => {
      const today = new Date().toISOString().split('T')[0];

      const activePlan = await AthletePlan.findOne({
        where: {
          athleteId: ac.athlete.id,
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
          attributes: ['id', 'name']
        }]
      });

      return {
        id: ac.athlete.id,
        name: `${ac.athlete.fName} ${ac.athlete.lName}`,
        email: ac.athlete.email,
        startDate: ac.startDate,
        currentPlan: activePlan ? activePlan.plan.name : null
      };
    }));

    res.status(200).json({ data: athletesWithPlans });
  } catch (error) {
    console.error("Error fetching coach athletes:", error);
    res.status(500).json({ message: "Failed to fetch athletes", error: error.message });
  }
};

// Add athlete to coach
export const addAthlete = async (req, res) => {
  try {
    const coachId = req.userId;
    const { athleteId, athleteEmail } = req.body;

    let targetAthleteId = athleteId;

    // If email provided, find athlete by email
    if (!targetAthleteId && athleteEmail) {
      const athlete = await User.findOne({
        where: {
          email: athleteEmail,
          role: 'athlete'
        }
      });

      if (!athlete) {
        return res.status(404).json({ message: "Athlete not found with that email" });
      }

      targetAthleteId = athlete.id;
    }

    if (!targetAthleteId) {
      return res.status(400).json({ message: "Athlete ID or email is required" });
    }

    // Check if relationship already exists
    const existing = await AthleteCoach.findOne({
      where: {
        athleteId: targetAthleteId,
        coachId,
        endDate: null
      }
    });

    if (existing) {
      return res.status(400).json({ message: "This athlete is already assigned to you" });
    }

    // Create relationship
    const relationship = await AthleteCoach.create({
      athleteId: targetAthleteId,
      coachId,
      startDate: new Date()
    });

    res.status(201).json({
      message: "Athlete added successfully",
      data: relationship
    });
  } catch (error) {
    console.error("Error adding athlete:", error);
    res.status(500).json({ message: "Failed to add athlete", error: error.message });
  }
};

// Remove athlete from coach
export const removeAthlete = async (req, res) => {
  try {
    const coachId = req.userId;
    const { athleteId } = req.params;

    const relationship = await AthleteCoach.findOne({
      where: {
        athleteId,
        coachId,
        endDate: null
      }
    });

    if (!relationship) {
      return res.status(404).json({ message: "Athlete relationship not found" });
    }

    // Set end date instead of deleting
    relationship.endDate = new Date();
    await relationship.save();

    res.status(200).json({ message: "Athlete removed successfully" });
  } catch (error) {
    console.error("Error removing athlete:", error);
    res.status(500).json({ message: "Failed to remove athlete", error: error.message });
  }
};

// Create training plan
export const createPlan = async (req, res) => {
  try {
    const coachId = req.userId;
    const { name, description, duration, exercises } = req.body;

    if (!name || !duration) {
      return res.status(400).json({ message: "Name and duration are required" });
    }

    // Create plan
    const plan = await ExercisePlan.create({
      name,
      description,
      duration,
      isStandard: false,
      createdBy: coachId
    });

    // Add exercises to plan if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const planExercises = exercises.map((ex, index) => ({
        planId: plan.id,
        exerciseId: ex.exerciseId,
        dayNumber: ex.dayNumber || 1,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        duration: ex.duration,
        restPeriod: ex.restPeriod,
        orderIndex: index
      }));

      await PlanExercise.bulkCreate(planExercises);
    }

    res.status(201).json({
      message: "Training plan created successfully",
      data: plan
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Failed to create plan", error: error.message });
  }
};

// Get coach's plans
export const getCoachPlans = async (req, res) => {
  try {
    const coachId = req.userId;

    const plans = await ExercisePlan.findAll({
      where: {
        createdBy: coachId
      },
      include: [{
        model: PlanExercise,
        as: 'planExercises',
        include: [{
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name', 'category']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ data: plans });
  } catch (error) {
    console.error("Error fetching coach plans:", error);
    res.status(500).json({ message: "Failed to fetch plans", error: error.message });
  }
};

// Assign plan to athlete
export const assignPlan = async (req, res) => {
  try {
    const coachId = req.userId;
    const { athleteId, planId, startDate, endDate } = req.body;

    if (!athleteId || !planId) {
      return res.status(400).json({ message: "Athlete ID and Plan ID are required" });
    }

    // Verify coach-athlete relationship
    const relationship = await AthleteCoach.findOne({
      where: {
        athleteId,
        coachId,
        endDate: null
      }
    });

    if (!relationship) {
      return res.status(403).json({ message: "You don't have permission to assign plans to this athlete" });
    }

    // Verify plan exists and belongs to coach
    const plan = await ExercisePlan.findOne({
      where: {
        id: planId,
        createdBy: coachId
      }
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found or you don't have permission" });
    }

    // Create assignment
    const assignment = await AthletePlan.create({
      athleteId,
      planId,
      assignedBy: coachId,
      startDate: startDate || new Date(),
      endDate: endDate || null
    });

    res.status(201).json({
      message: "Plan assigned successfully",
      data: assignment
    });
  } catch (error) {
    console.error("Error assigning plan:", error);
    res.status(500).json({ message: "Failed to assign plan", error: error.message });
  }
};

// Create goal for athlete
export const createGoal = async (req, res) => {
  try {
    const coachId = req.userId;
    const { athleteId, exerciseId, targetValue, targetUnit, targetDate } = req.body;

    if (!athleteId || !exerciseId || !targetValue || !targetUnit || !targetDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify coach-athlete relationship
    const relationship = await AthleteCoach.findOne({
      where: {
        athleteId,
        coachId,
        endDate: null
      }
    });

    if (!relationship) {
      return res.status(403).json({ message: "You don't have permission to set goals for this athlete" });
    }

    // Create goal
    const goal = await Goal.create({
      athleteId,
      exerciseId,
      targetValue,
      targetUnit,
      targetDate,
      status: 'active',
      createdBy: coachId
    });

    res.status(201).json({
      message: "Goal created successfully",
      data: goal
    });
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ message: "Failed to create goal", error: error.message });
  }
};

// Get recent athlete results for coach
export const getCoachRecentResults = async (req, res) => {
  try {
    const coachId = req.userId;
    const { limit = 20 } = req.query;

    // Get all athlete IDs for this coach
    const athleteRelations = await AthleteCoach.findAll({
      where: {
        coachId,
        endDate: null
      },
      attributes: ['athleteId']
    });

    const athleteIds = athleteRelations.map(ar => ar.athleteId);

    if (athleteIds.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Get recent results
    const results = await ExerciseResult.findAll({
      where: {
        athleteId: {
          [Op.in]: athleteIds
        }
      },
      include: [{
        model: User,
        as: 'athlete',
        attributes: ['id', 'fName', 'lName']
      }, {
        model: Exercise,
        as: 'exercise',
        attributes: ['id', 'name']
      }],
      order: [['performedDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Format results
    const formattedResults = results.map(r => ({
      id: r.id,
      athleteName: `${r.athlete.fName} ${r.athlete.lName}`,
      exercise: r.exercise.name,
      performance: formatPerformance(r),
      date: r.performedDate
    }));

    res.status(200).json({ data: formattedResults });
  } catch (error) {
    console.error("Error fetching recent results:", error);
    res.status(500).json({ message: "Failed to fetch recent results", error: error.message });
  }
};

// Get athlete's progress
export const getAthleteProgress = async (req, res) => {
  try {
    const coachId = req.userId;
    const { athleteId } = req.params;
    const { exerciseId, days = 30 } = req.query;

    // Verify coach-athlete relationship
    const relationship = await AthleteCoach.findOne({
      where: {
        athleteId,
        coachId,
        endDate: null
      }
    });

    if (!relationship) {
      return res.status(403).json({ message: "You don't have permission to view this athlete's progress" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const whereClause = {
      athleteId,
      performedDate: {
        [Op.gte]: startDate
      }
    };

    if (exerciseId) {
      whereClause.exerciseId = exerciseId;
    }

    const results = await ExerciseResult.findAll({
      where: whereClause,
      include: [{
        model: Exercise,
        as: 'exercise',
        attributes: ['id', 'name', 'category']
      }],
      order: [['performedDate', 'ASC']]
    });

    res.status(200).json({ data: results });
  } catch (error) {
    console.error("Error fetching athlete progress:", error);
    res.status(500).json({ message: "Failed to fetch athlete progress", error: error.message });
  }
};

// Helper function
function formatPerformance(result) {
  const parts = [];
  if (result.sets && result.reps) {
    parts.push(`${result.sets}×${result.reps}`);
  }
  if (result.weight) {
    parts.push(`${result.weight} lbs`);
  }
  if (result.duration) {
    parts.push(`${result.duration}s`);
  }
  if (result.distance) {
    parts.push(`${result.distance}m`);
  }
  return parts.join(' @ ') || 'Completed';
}
