import db from "../models/index.js";
import { Op } from "sequelize";

const User = db.user;
const ExercisePlan = db.exercisePlan;
const PlanExercise = db.planExercise;
const Exercise = db.exercise;
const PlanAssignment = db.planAssignment;

// Get all plans (admin can see all plans)
export const getAllPlans = async (req, res) => {
  try {
    const plans = await ExercisePlan.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fName', 'lName', 'email', 'role']
        },
        {
          model: PlanExercise,
          as: 'planExercises',
          include: [{
            model: Exercise,
            as: 'exercise',
            attributes: ['id', 'name', 'category', 'equipment', 'muscleGroup']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ data: plans });
  } catch (error) {
    console.error("Error fetching all plans:", error);
    res.status(500).json({ message: "Failed to fetch plans", error: error.message });
  }
};

// Update any plan (admin privilege)
export const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, description, duration, exercises, isStandard } = req.body;

    // Find the plan
    const plan = await ExercisePlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Update plan basic info
    await plan.update({
      name: name || plan.name,
      description: description !== undefined ? description : plan.description,
      duration: duration || plan.duration,
      isStandard: isStandard !== undefined ? isStandard : plan.isStandard
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

// Delete any plan (admin privilege)
export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Find the plan
    const plan = await ExercisePlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Check if plan is assigned to any athletes
    const assignments = await PlanAssignment.count({
      where: { planId: plan.id }
    });

    if (assignments > 0) {
      return res.status(400).json({ 
        message: `Cannot delete plan that is assigned to ${assignments} athlete(s). Please unassign it first.` 
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

// Create a standard plan (admin only)
export const createStandardPlan = async (req, res) => {
  try {
    const adminId = req.userId;
    const { name, description, duration, dayCheck, exercises } = req.body;

    if (!name || !duration) {
      return res.status(400).json({ message: "Name and duration are required" });
    }

    // Create plan as standard
    const planData = {
      name,
      description,
      duration,
      dayCheck: 0,
      dayOpness: 0,
      isStandard: true,
      createdBy: adminId
    };
    
    const plan = await ExercisePlan.create(planData);

    // Add exercises to plan if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
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

    res.status(201).json({
      message: "Standard training plan created successfully",
      data: plan
    });
  } catch (error) {
    console.error("Error creating standard plan:", error);
    res.status(500).json({ message: "Failed to create plan", error: error.message });
  }
};

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalCoaches = await User.count({ where: { role: 'coach' } });
    const totalAthletes = await User.count({ where: { role: 'athlete' } });
    const totalPlans = await ExercisePlan.count();
    const totalStandardPlans = await ExercisePlan.count({ where: { isStandard: true } });
    const totalExercises = await Exercise.count();

    res.status(200).json({
      totalUsers,
      totalCoaches,
      totalAthletes,
      totalPlans,
      totalStandardPlans,
      totalExercises
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics", error: error.message });
  }
};

// Get all athletes for a specific coach
export const getCoachAthletes = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use the same query as in the coach controller
    const athletes = await db.athleteCoach.findAll({
      where: {
        coachId: id,
        endDate: null // Active relationships only
      },
      include: [{
        model: db.user,
        as: 'athlete',
        attributes: ['id', 'fName', 'lName', 'email']
      }]
    });

    // Get current plan for each athlete
    const athletesWithPlans = await Promise.all(athletes.map(async (ac) => {
      const today = new Date().toISOString().split('T')[0];

      const activePlan = await db.athletePlan.findOne({
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
          model: db.exercisePlan,
          as: 'plan',
          attributes: ['id', 'name']
        }]
      });

      return {
        id: ac.athlete.id,
        fName: ac.athlete.fName,
        lName: ac.athlete.lName,
        name: `${ac.athlete.fName} ${ac.athlete.lName}`,
        email: ac.athlete.email,
        startDate: ac.startDate,
        currentPlan: activePlan ? activePlan.plan?.name : null,
        currentPlanId: activePlan ? activePlan.plan?.id : null
      };
    }));

    res.status(200).json({ data: athletesWithPlans });
  } catch (error) {
    console.error('Error fetching coach athletes:', error);
    res.status(500).json({ message: 'Failed to fetch coach athletes', error: error.message });
  }
};

// Get athlete counts for all coaches
export const getCoachAthleteCounts = async (req, res) => {
  try {
    // Get all active coach-athlete relationships
    const athleteCounts = await db.athleteCoach.findAll({
      where: {
        endDate: null
      },
      attributes: [
        'coachId',
        [db.sequelize.fn('COUNT', db.sequelize.col('athleteId')), 'athleteCount']
      ],
      group: ['coachId'],
      raw: true
    });

    // Convert to a map of coachId -> athleteCount
    const countsMap = {};
    athleteCounts.forEach(item => {
      countsMap[item.coachId] = parseInt(item.athleteCount, 10);
    });

    res.status(200).json(countsMap);
  } catch (error) {
    console.error('Error fetching coach athlete counts:', error);
    res.status(500).json({ message: 'Failed to fetch coach athlete counts', error: error.message });
  }
};

// Remove an athlete from a coach
export const removeAthleteFromCoach = async (req, res) => {
  try {
    const { id, athleteId } = req.params;

    // Check if coach exists
    const coach = await User.findByPk(id);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Check if athlete exists
    const athlete = await User.findByPk(athleteId);
    if (!athlete || athlete.role !== 'athlete') {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    // Remove the association
    await coach.removeAthlete(athleteId);
    
    res.status(200).json({ message: 'Athlete removed from coach successfully' });
  } catch (error) {
    console.error('Error removing athlete from coach:', error);
    res.status(500).json({ message: 'Failed to remove athlete from coach', error: error.message });
  }
};

export default {
  getAllPlans,
  updatePlan,
  deletePlan,
  createStandardPlan,
  getDashboardStats,
  getCoachAthletes,
  removeAthleteFromCoach
};