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
    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: 'Coach ID is required'
      });
    }

    const athletes = await AthleteCoach.findAll({
      where: {
        coachId,
        endDate: null // Active relationships only
      },
      include: [{
        model: User,
        as: 'athlete',
        attributes: ['id', 'fName', 'lName', 'email', 'profileImage']
      }]
    });

    // Get current plan for each athlete
    const athletesWithPlans = await Promise.all(athletes.map(async (ac) => {
      if (!ac.athlete) return null; // Skip if no athlete data

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
        fName: ac.athlete.fName,
        lName: ac.athlete.lName,
        email: ac.athlete.email,
        profileImage: ac.athlete.profileImage,
        startDate: ac.startDate,
        currentPlan: activePlan?.plan?.name || null
      };
    }));

    // Filter out any null entries
    const filteredAthletes = athletesWithPlans.filter(athlete => athlete !== null);

    res.status(200).json({ 
      success: true,
      data: filteredAthletes 
    });
  } catch (error) {
    console.error("Error fetching coach athletes:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch athletes", 
      error: error.message 
    });
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

    // Check if active relationship already exists
    const activeRelationship = await AthleteCoach.findOne({
      where: {
        athleteId: targetAthleteId,
        coachId,
        endDate: null
      }
    });

    if (activeRelationship) {
      return res.status(400).json({ message: "This athlete is already assigned to you" });
    }

    // Check if there's an ended relationship that we can reactivate
    const endedRelationship = await AthleteCoach.findOne({
      where: {
        athleteId: targetAthleteId,
        coachId,
        endDate: { [Op.ne]: null }
      }
    });

    const today = new Date().toISOString().split('T')[0];

    if (endedRelationship) {
      // Reactivate the existing relationship
      endedRelationship.startDate = today;
      endedRelationship.endDate = null;
      await endedRelationship.save();

      return res.status(201).json({
        message: "Athlete added successfully",
        data: endedRelationship
      });
    }

    // Create new relationship - format date as YYYY-MM-DD for DATEONLY field
    const relationship = await AthleteCoach.create({
      athleteId: targetAthleteId,
      coachId,
      startDate: today,
      endDate: null
    });

    res.status(201).json({
      message: "Athlete added successfully",
      data: relationship
    });
  } catch (error) {
    console.error("Error adding athlete:", error);
    // Log Sequelize validation errors if they exist
    if (error.errors) {
      console.error("Validation errors:", error.errors.map(e => ({
        field: e.path,
        message: e.message,
        type: e.type
      })));
    }
    res.status(500).json({ 
      message: "Failed to add athlete", 
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : undefined
    });
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
    const { name, description, duration, dayCheck, exercises } = req.body;

    if (!name || !duration) {
      return res.status(400).json({ message: "Name and duration are required" });
    }

    // Create plan
    const planData = {
      name,
      description,
      duration,
      dayCheck: 0, // Set to 0 as default (appears to be a bitmask or number field)
      dayOpness: 0, // Add default value for dayOpness field
      isStandard: false,
      createdBy: coachId
    };
    
    console.log('Creating plan with data:', planData);
    
    const plan = await ExercisePlan.create(planData);

    // Add exercises to plan if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const planExercises = exercises.map((ex, index) => ({
        planId: plan.id,
        exerciseId: ex.exerciseId,
        dayOfWeek: ex.dayOfWeek || 1,  // Changed from dayNumber to dayOfWeek
        sets: ex.sets,
        reps: ex.reps,
        duration: ex.duration,
        restTime: ex.restTime || 60,  // Changed from restPeriod to restTime, default 60 seconds
        order: index + 1  // Changed from orderIndex to order, starting at 1
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
      return res.status(403).json({ 
        success: false,
        message: "You don't have permission to view this athlete's progress" 
      });
    }

    // Get athlete information
    const athlete = await User.findOne({
      where: { id: athleteId },
      attributes: ['id', 'fName', 'lName', 'email']
    });

    if (!athlete) {
      return res.status(404).json({ 
        success: false,
        message: "Athlete not found" 
      });
    }

    try {
      // Get current plan
      const today = new Date().toISOString().split('T')[0];
      const activePlan = await AthletePlan.findOne({
        where: { athleteId },
        include: [{
          model: ExercisePlan,
          as: 'plan',
          attributes: ['id', 'name', 'description']
        }],
        order: [['startDate', 'DESC']]
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get workout history
      const workoutHistory = await ExerciseResult.findAll({
        where: {
          athleteId,
          performedDate: { [Op.gte]: startDate }
        },
        include: [{
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name', 'category']
        }],
        order: [['performedDate', 'DESC']],
        limit: 50
      });

      // Get all-time workout count
      const totalWorkouts = await ExerciseResult.count({ where: { athleteId } });

      // Get this week's workout count
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const weeklyWorkouts = await ExerciseResult.count({
        where: {
          athleteId,
          performedDate: { [Op.gte]: startOfWeek }
        }
      });

      // Get active goals
      const goals = await Goal.findAll({
        where: { athleteId, status: 'active' },
        include: [{
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name']
        }],
        order: [['targetDate', 'ASC']]
      });

      // Calculate personal records
      const personalRecords = await ExerciseResult.count({
        where: { athleteId, isPersonalRecord: true }
      });

      // Calculate current streak
      const recentDays = await ExerciseResult.findAll({
        where: {
          athleteId,
          performedDate: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        attributes: ['performedDate'],
        order: [['performedDate', 'DESC']],
        limit: 30
      });

      let currentStreak = 0;
      if (recentDays.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < recentDays.length; i++) {
          const workoutDate = new Date(recentDays[i].performedDate);
          workoutDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);
          expectedDate.setHours(0, 0, 0, 0);
          
          if (workoutDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Format response
      const responseData = {
        success: true,
        data: {
          athlete: {
            id: athlete.id,
            name: `${athlete.fName} ${athlete.lName}`,
            email: athlete.email,
            currentPlan: activePlan?.plan?.name || null
          },
          workouts: workoutHistory.map(w => ({
            id: w.id,
            exercise: {
              id: w.exercise?.id,
              name: w.exercise?.name || 'Unknown Exercise',
              category: w.exercise?.category
            },
            performedDate: w.performedDate,
            sets: w.sets,
            reps: w.reps,
            weight: w.weight,
            duration: w.duration,
            distance: w.distance,
            notes: w.notes
          })) || [],
          goals: goals.map(g => ({
            id: g.id,
            title: g.exercise ? `${g.exercise.name} Goal` : 'Goal',
            description: `Target: ${g.targetValue} ${g.targetUnit}`,
            currentValue: g.currentValue || 0,
            targetValue: g.targetValue,
            targetDate: g.targetDate,
            metric: g.targetUnit,
            status: g.status
          })) || [],
          plans: activePlan ? [{
            id: activePlan.plan?.id,
            name: activePlan.plan?.name,
            description: activePlan.plan?.description,
            startDate: activePlan.startDate,
            endDate: activePlan.endDate
          }] : [],
          stats: {
            totalWorkouts,
            weeklyWorkouts,
            personalRecords: personalRecords || 0,
            currentStreak
          }
        }
      };

      return res.status(200).json(responseData);
    } catch (dbError) {
      console.error("Database error in getAthleteProgress:", dbError);
      // Return empty data structure on database errors
      return res.status(200).json({
        success: true,
        data: {
          athlete: {
            id: athlete.id,
            name: `${athlete.fName} ${athlete.lName}`,
            email: athlete.email,
            currentPlan: null
          },
          workouts: [],
          goals: [],
          plans: [],
          stats: {
            totalWorkouts: 0,
            weeklyWorkouts: 0,
            personalRecords: 0,
            currentStreak: 0
          }
        }
      });
    }
  } catch (error) {
    console.error("Error in getAthleteProgress:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while fetching athlete progress",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get weekly results count
export const getWeeklyResultsCount = async (req, res) => {
  try {
    const coachId = req.userId;
    
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
      return res.status(200).json({ count: 0 });
    }

    // Get start of current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Count results from this week
    const count = await ExerciseResult.count({
      where: {
        athleteId: {
          [Op.in]: athleteIds
        },
        performedDate: {
          [Op.gte]: startOfWeek
        }
      }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting weekly results count:", error);
    res.status(500).json({ message: "Failed to get weekly results count", error: error.message });
  }
};

// Get exercises
export const getExercises = async (req, res) => {
  try {
    const coachId = req.userId;

    const exercises = await Exercise.findAll({
      where: {
        [Op.or]: [
          { createdBy: coachId },
          { isStandard: true }
        ]
      },
      order: [['name', 'ASC']]
    });

    res.status(200).json({ data: exercises });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ message: "Failed to fetch exercises", error: error.message });
  }
};

// Create exercise
export const createExercise = async (req, res) => {
  try {
    const coachId = req.userId;
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const exercise = await Exercise.create({
      name,
      category,
      description,
      isStandard: false,
      createdBy: coachId
    });

    res.status(201).json({
      message: "Exercise created successfully",
      data: exercise
    });
  } catch (error) {
    console.error("Error creating exercise:", error);
    res.status(500).json({ message: "Failed to create exercise", error: error.message });
  }
};

// Update exercise
export const updateExercise = async (req, res) => {
  try {
    const coachId = req.userId;
    const { exerciseId } = req.params;
    const { name, category, description } = req.body;

    const exercise = await Exercise.findOne({
      where: {
        id: exerciseId,
        createdBy: coachId
      }
    });

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found or you don't have permission to edit it" });
    }

    await exercise.update({
      name: name || exercise.name,
      category: category || exercise.category,
      description: description || exercise.description
    });

    res.status(200).json({
      message: "Exercise updated successfully",
      data: exercise
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    res.status(500).json({ message: "Failed to update exercise", error: error.message });
  }
};

// Delete exercise
export const deleteExercise = async (req, res) => {
  try {
    const coachId = req.userId;
    const { exerciseId } = req.params;

    const exercise = await Exercise.findOne({
      where: {
        id: exerciseId,
        createdBy: coachId
      }
    });

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found or you don't have permission to delete it" });
    }

    await exercise.destroy();

    res.status(200).json({ message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ message: "Failed to delete exercise", error: error.message });
  }
};

// Get custom exercises count
export const getCustomExercisesCount = async (req, res) => {
  try {
    const coachId = req.userId;

    const count = await Exercise.count({
      where: {
        createdBy: coachId,
        isStandard: false
      }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting custom exercises count:", error);
    res.status(500).json({ message: "Failed to get custom exercises count", error: error.message });
  }
};

// Get coach's goals
export const getCoachGoals = async (req, res) => {
  try {
    const coachId = req.userId;

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

    // Fetch all goals for coach's athletes
    const goals = await Goal.findAll({
      where: {
        athleteId: {
          [Op.in]: athleteIds
        }
      },
      include: [
        {
          model: User,
          as: 'athlete',
          attributes: ['id', 'fName', 'lName']
        },
        {
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name', 'category']
        }
      ],
      order: [['targetDate', 'ASC']]
    });

    // Format goals for response
    const formattedGoals = goals.map(g => ({
      id: g.id,
      athleteId: g.athleteId,
      athleteName: `${g.athlete.fName} ${g.athlete.lName}`,
      exerciseId: g.exerciseId,
      exerciseName: g.exercise.name,
      targetValue: g.targetValue,
      targetUnit: g.targetUnit,
      targetDate: g.targetDate,
      status: g.status,
      createdAt: g.createdAt
    }));

    res.status(200).json({ data: formattedGoals });
  } catch (error) {
    console.error("Error fetching coach goals:", error);
    res.status(500).json({ message: "Failed to fetch goals", error: error.message });
  }
};

// Get active goals count
export const getActiveGoalsCount = async (req, res) => {
  try {
    const coachId = req.userId;

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
      return res.status(200).json({ count: 0 });
    }

    const count = await Goal.count({
      where: {
        athleteId: {
          [Op.in]: athleteIds
        },
        status: 'active'
      }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting active goals count:", error);
    res.status(500).json({ message: "Failed to get active goals count", error: error.message });
  }
};

// Record workout result for athlete (coach submitting on behalf of athlete)
export const recordWorkoutResult = async (req, res) => {
  try {
    const coachId = req.userId;
    const { athleteId, exerciseId, performedDate, sets, reps, weight, duration, distance, notes } = req.body;

    if (!athleteId || !exerciseId || !performedDate) {
      return res.status(400).json({ message: "Athlete ID, exercise ID, and date are required" });
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
      return res.status(403).json({ message: "You don't have permission to record results for this athlete" });
    }

    // Verify exercise exists
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Create the exercise result
    const result = await ExerciseResult.create({
      athleteId,
      exerciseId,
      performedDate,
      sets: sets || null,
      reps: reps || null,
      weight: weight || null,
      duration: duration || null,
      distance: distance || null,
      notes: notes || '',
      recordedBy: coachId
    });

    res.status(201).json({
      message: "Workout result recorded successfully",
      data: result
    });
  } catch (error) {
    console.error("Error recording workout result:", error);
    res.status(500).json({ message: "Failed to record workout result", error: error.message });
  }
};

// Update training plan
export const updatePlan = async (req, res) => {
  try {
    const coachId = req.userId;
    const { planId } = req.params;
    const { name, description, duration, exercises } = req.body;

    // Find the plan and verify ownership
    const plan = await ExercisePlan.findOne({
      where: {
        id: planId,
        createdBy: coachId
      }
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found or you don't have permission to update it" });
    }

    // Update plan basic info
    await plan.update({
      name: name || plan.name,
      description: description !== undefined ? description : plan.description,
      duration: duration || plan.duration
    });

    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      // Delete existing plan exercises
      await PlanExercise.destroy({
        where: { planId: plan.id }
      });

      // Create new plan exercises
      const planExercises = exercises.map((ex, index) => ({
        planId: plan.id,
        exerciseId: ex.exerciseId,
        dayOfWeek: ex.dayOfWeek || 1,
        sets: ex.sets,
        reps: ex.reps,
        duration: ex.duration,
        restTime: ex.restTime || 60,
        order: index + 1
      }));

      await PlanExercise.bulkCreate(planExercises);
    }

    // Fetch updated plan with exercises
    const updatedPlan = await ExercisePlan.findOne({
      where: { id: plan.id },
      include: [{
        model: PlanExercise,
        as: 'planExercises',
        include: [{
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name', 'category', 'equipment', 'muscleGroup']
        }]
      }]
    });

    res.status(200).json({
      message: "Training plan updated successfully",
      data: updatedPlan
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Failed to update plan", error: error.message });
  }
};

// Delete training plan
export const deletePlan = async (req, res) => {
  try {
    const coachId = req.userId;
    const { planId } = req.params;

    // Find the plan and verify ownership
    const plan = await ExercisePlan.findOne({
      where: {
        id: planId,
        createdBy: coachId
      }
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found or you don't have permission to delete it" });
    }

    // Check if plan is assigned to any athletes
    const assignments = await PlanAssignment.count({
      where: { planId: plan.id }
    });

    if (assignments > 0) {
      return res.status(400).json({ 
        message: "Cannot delete plan that is assigned to athletes. Please unassign it first." 
      });
    }

    // Delete plan exercises first (cascade)
    await PlanExercise.destroy({
      where: { planId: plan.id }
    });

    // Delete the plan
    await plan.destroy();

    res.status(200).json({
      message: "Training plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ message: "Failed to delete plan", error: error.message });
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
