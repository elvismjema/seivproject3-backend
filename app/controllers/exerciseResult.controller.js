import db from "../models/index.js";

const ExerciseResult = db.exerciseResult;
const Exercise = db.exercise;
const User = db.user;
const Goal = db.goal;
const Op = db.Sequelize.Op;

// Record a new exercise result
export const create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.exerciseId || !req.body.performedDate) {
      return res.status(400).send({
        message: "Exercise ID and performed date are required!"
      });
    }

    // Determine athleteId based on who is recording
    let athleteId = req.body.athleteId;

    if (req.userRole === 'athlete') {
      // Athletes can only record for themselves
      athleteId = req.userId;
    } else if (req.userRole === 'coach') {
      // Coaches can record for their athletes
      if (!athleteId) {
        return res.status(400).send({
          message: "Athlete ID required when coach is recording!"
        });
      }

      // Verify coach-athlete relationship
      const relationship = await db.athleteCoach.findOne({
        where: {
          coachId: req.userId,
          athleteId: athleteId,
          endDate: null
        }
      });

      if (!relationship) {
        return res.status(403).send({
          message: "You can only record results for your athletes!"
        });
      }
    }
    // Admin can record for anyone (no additional check needed)

    // Create exercise result
    const result = {
      athleteId: athleteId,
      exerciseId: req.body.exerciseId,
      performedDate: req.body.performedDate,
      sets: req.body.sets,
      reps: req.body.reps,
      weight: req.body.weight,
      duration: req.body.duration,
      distance: req.body.distance,
      notes: req.body.notes
    };

    const data = await ExerciseResult.create(result);

    // Check if this result achieves any goals
    await checkGoalProgress(athleteId, req.body.exerciseId);

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error recording exercise result."
    });
  }
};

// Get exercise results with filters
export const findAll = async (req, res) => {
  try {
    const { athleteId, exerciseId, startDate, endDate, limit } = req.query;
    let condition = {};

    // Build filter conditions based on user role
    if (req.userRole === 'athlete') {
      // Athletes can only see their own results
      condition.athleteId = req.userId;
    } else if (req.userRole === 'coach') {
      // Coaches can see their athletes' results
      if (athleteId) {
        // Verify coach-athlete relationship
        const relationship = await db.athleteCoach.findOne({
          where: {
            coachId: req.userId,
            athleteId: athleteId,
            endDate: null
          }
        });

        if (!relationship) {
          return res.status(403).send({
            message: "Access denied to this athlete's results!"
          });
        }
        condition.athleteId = athleteId;
      } else {
        // Get all athletes for this coach
        const athletes = await db.athleteCoach.findAll({
          where: {
            coachId: req.userId,
            endDate: null
          },
          attributes: ['athleteId']
        });

        const athleteIds = athletes.map(a => a.athleteId);
        condition.athleteId = { [Op.in]: athleteIds };
      }
    } else if (req.userRole === 'admin') {
      // Admins can see all results
      if (athleteId) {
        condition.athleteId = athleteId;
      }
    }

    // Add other filters
    if (exerciseId) {
      condition.exerciseId = exerciseId;
    }

    if (startDate && endDate) {
      condition.performedDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      condition.performedDate = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      condition.performedDate = {
        [Op.lte]: endDate
      };
    }

    const queryOptions = {
      where: condition,
      include: [
        {
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name', 'category']
        },
        {
          model: User,
          as: 'athlete',
          attributes: ['id', 'fName', 'lName', 'email']
        }
      ],
      order: [['performedDate', 'DESC'], ['createdAt', 'DESC']]
    };

    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    const data = await ExerciseResult.findAll(queryOptions);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving exercise results."
    });
  }
};

// Get single exercise result
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await ExerciseResult.findByPk(id, {
      include: [
        {
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'name', 'category']
        },
        {
          model: User,
          as: 'athlete',
          attributes: ['id', 'fName', 'lName', 'email']
        }
      ]
    });

    if (!data) {
      return res.status(404).send({
        message: `Exercise result not found with id=${id}`
      });
    }

    // Check access permissions
    if (req.userRole === 'athlete' && data.athleteId !== req.userId) {
      return res.status(403).send({
        message: "Access denied to this result!"
      });
    } else if (req.userRole === 'coach') {
      const relationship = await db.athleteCoach.findOne({
        where: {
          coachId: req.userId,
          athleteId: data.athleteId,
          endDate: null
        }
      });

      if (!relationship) {
        return res.status(403).send({
          message: "Access denied to this result!"
        });
      }
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving exercise result."
    });
  }
};

// Update exercise result
export const update = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await ExerciseResult.findByPk(id);

    if (!result) {
      return res.status(404).send({
        message: `Exercise result not found with id=${id}`
      });
    }

    // Check permissions
    if (req.userRole === 'athlete' && result.athleteId !== req.userId) {
      return res.status(403).send({
        message: "You can only update your own results!"
      });
    } else if (req.userRole === 'coach') {
      const relationship = await db.athleteCoach.findOne({
        where: {
          coachId: req.userId,
          athleteId: result.athleteId,
          endDate: null
        }
      });

      if (!relationship) {
        return res.status(403).send({
          message: "You can only update your athletes' results!"
        });
      }
    }

    // Don't allow changing athleteId or exerciseId
    delete req.body.athleteId;
    delete req.body.exerciseId;

    const [num] = await ExerciseResult.update(req.body, {
      where: { id: id }
    });

    if (num == 1) {
      // Check if updated result affects goals
      await checkGoalProgress(result.athleteId, result.exerciseId);

      res.send({
        message: "Exercise result updated successfully."
      });
    } else {
      res.send({
        message: "Cannot update exercise result."
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating exercise result."
    });
  }
};

// Delete exercise result
export const remove = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await ExerciseResult.findByPk(id);

    if (!result) {
      return res.status(404).send({
        message: `Exercise result not found with id=${id}`
      });
    }

    // Check permissions
    if (req.userRole === 'athlete' && result.athleteId !== req.userId) {
      return res.status(403).send({
        message: "You can only delete your own results!"
      });
    } else if (req.userRole === 'coach') {
      const relationship = await db.athleteCoach.findOne({
        where: {
          coachId: req.userId,
          athleteId: result.athleteId,
          endDate: null
        }
      });

      if (!relationship) {
        return res.status(403).send({
          message: "You can only delete your athletes' results!"
        });
      }
    }

    const num = await ExerciseResult.destroy({
      where: { id: id }
    });

    if (num == 1) {
      res.send({
        message: "Exercise result deleted successfully!"
      });
    } else {
      res.send({
        message: `Cannot delete exercise result with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete exercise result."
    });
  }
};

// Get statistics for an athlete
export const getStatistics = async (req, res) => {
  try {
    const athleteId = req.params.athleteId || req.userId;

    // Check permissions
    if (req.userRole === 'athlete' && athleteId != req.userId) {
      return res.status(403).send({
        message: "You can only view your own statistics!"
      });
    } else if (req.userRole === 'coach') {
      const relationship = await db.athleteCoach.findOne({
        where: {
          coachId: req.userId,
          athleteId: athleteId,
          endDate: null
        }
      });

      if (!relationship) {
        return res.status(403).send({
          message: "You can only view your athletes' statistics!"
        });
      }
    }

    const { exerciseId, period } = req.query;
    let dateFilter = {};

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to last month
    }

    dateFilter.performedDate = {
      [Op.between]: [startDate, endDate]
    };

    let condition = {
      athleteId: athleteId,
      ...dateFilter
    };

    if (exerciseId) {
      condition.exerciseId = exerciseId;
    }

    // Get results
    const results = await ExerciseResult.findAll({
      where: condition,
      include: [{
        model: Exercise,
        as: 'exercise',
        attributes: ['id', 'name', 'category']
      }],
      order: [['performedDate', 'ASC']]
    });

    // Calculate statistics
    const stats = {
      totalWorkouts: results.length,
      exerciseBreakdown: {},
      personalRecords: {},
      progressData: results
    };

    // Group by exercise for breakdown and PRs
    results.forEach(result => {
      const exerciseName = result.exercise.name;

      // Exercise breakdown
      if (!stats.exerciseBreakdown[exerciseName]) {
        stats.exerciseBreakdown[exerciseName] = {
          count: 0,
          totalSets: 0,
          totalReps: 0,
          maxWeight: 0
        };
      }
      stats.exerciseBreakdown[exerciseName].count++;
      stats.exerciseBreakdown[exerciseName].totalSets += result.sets || 0;
      stats.exerciseBreakdown[exerciseName].totalReps += result.reps || 0;

      if (result.weight && result.weight > stats.exerciseBreakdown[exerciseName].maxWeight) {
        stats.exerciseBreakdown[exerciseName].maxWeight = result.weight;
      }

      // Personal records
      if (!stats.personalRecords[exerciseName]) {
        stats.personalRecords[exerciseName] = {};
      }

      if (result.weight && (!stats.personalRecords[exerciseName].maxWeight ||
          result.weight > stats.personalRecords[exerciseName].maxWeight)) {
        stats.personalRecords[exerciseName].maxWeight = {
          value: result.weight,
          date: result.performedDate
        };
      }
    });

    res.send(stats);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving statistics."
    });
  }
};

// Helper function to check goal progress
async function checkGoalProgress(athleteId, exerciseId) {
  try {
    // Find active goals for this athlete and exercise
    const goals = await Goal.findAll({
      where: {
        athleteId: athleteId,
        exerciseId: exerciseId,
        status: 'active'
      }
    });

    for (const goal of goals) {
      // Get latest result for this exercise
      const latestResult = await ExerciseResult.findOne({
        where: {
          athleteId: athleteId,
          exerciseId: exerciseId
        },
        order: [['performedDate', 'DESC'], ['weight', 'DESC']]
      });

      if (latestResult) {
        let achieved = false;

        // Check if goal is achieved based on target unit
        switch (goal.targetUnit) {
          case 'weight_lbs':
          case 'weight_kg':
            if (latestResult.weight >= goal.targetValue) {
              achieved = true;
            }
            break;
          case 'reps':
            if (latestResult.reps >= goal.targetValue) {
              achieved = true;
            }
            break;
          case 'time_seconds':
            if (latestResult.duration && latestResult.duration <= goal.targetValue) {
              achieved = true;
            }
            break;
          case 'distance_meters':
            if (latestResult.distance >= goal.targetValue) {
              achieved = true;
            }
            break;
        }

        // Update goal status if achieved
        if (achieved) {
          await Goal.update(
            { status: 'completed' },
            { where: { id: goal.id } }
          );
        }
      }
    }
  } catch (err) {
    console.error("Error checking goal progress:", err);
  }
}

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  getStatistics
};