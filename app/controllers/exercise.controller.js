import db from "../models/index.js";

const Exercise = db.exercise;
const User = db.user;
const Op = db.Sequelize.Op;

// Create a new exercise
export const create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name || !req.body.category) {
      return res.status(400).send({
        message: "Exercise name and category are required!"
      });
    }

    // Only admin can create standard exercises
    if (req.body.isStandard && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only admins can create standard exercises!"
      });
    }

    // Create exercise
    const exercise = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      muscleGroups: req.body.muscleGroups,
      equipment: req.body.equipment,
      isStandard: req.body.isStandard || false,
      createdBy: req.userId
    };

    const data = await Exercise.create(exercise);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error creating exercise."
    });
  }
};

// Get all exercises (with filters)
export const findAll = async (req, res) => {
  try {
    const { category, isStandard, createdBy, search } = req.query;
    let condition = {};

    // Build filter conditions
    if (category) {
      condition.category = category;
    }

    if (isStandard !== undefined) {
      condition.isStandard = isStandard === 'true';
    }

    if (createdBy) {
      condition.createdBy = createdBy;
    }

    if (search) {
      condition.name = { [Op.like]: `%${search}%` };
    }

    // Filter based on user role
    if (req.userRole === 'athlete') {
      // Athletes can only see standard exercises and those created by their coach
      const coachIds = await db.athleteCoach.findAll({
        where: {
          athleteId: req.userId,
          endDate: null
        },
        attributes: ['coachId']
      });

      const coachIdList = coachIds.map(c => c.coachId);

      condition[Op.or] = [
        { isStandard: true },
        { createdBy: coachIdList }
      ];
    } else if (req.userRole === 'coach') {
      // Coaches can see standard exercises and their own
      condition[Op.or] = [
        { isStandard: true },
        { createdBy: req.userId }
      ];
    }
    // Admins can see all exercises (no additional filter needed)

    const data = await Exercise.findAll({
      where: condition,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'fName', 'lName', 'email']
      }],
      order: [['name', 'ASC']]
    });

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving exercises."
    });
  }
};

// Get single exercise by id
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await Exercise.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'fName', 'lName', 'email']
      }]
    });

    if (!data) {
      return res.status(404).send({
        message: `Exercise not found with id=${id}`
      });
    }

    // Check access permissions
    if (req.userRole === 'athlete') {
      if (!data.isStandard) {
        // Check if created by their coach
        const relationship = await db.athleteCoach.findOne({
          where: {
            athleteId: req.userId,
            coachId: data.createdBy,
            endDate: null
          }
        });

        if (!relationship) {
          return res.status(403).send({
            message: "Access denied to this exercise!"
          });
        }
      }
    } else if (req.userRole === 'coach') {
      if (!data.isStandard && data.createdBy !== req.userId) {
        return res.status(403).send({
          message: "Access denied to this exercise!"
        });
      }
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving exercise."
    });
  }
};

// Update exercise
export const update = async (req, res) => {
  try {
    const id = req.params.id;

    const exercise = await Exercise.findByPk(id);

    if (!exercise) {
      return res.status(404).send({
        message: `Exercise not found with id=${id}`
      });
    }

    // Check permissions
    if (exercise.isStandard && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only admins can edit standard exercises!"
      });
    }

    if (!exercise.isStandard && exercise.createdBy !== req.userId && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You can only edit your own exercises!"
      });
    }

    // Don't allow changing isStandard unless admin
    if (req.body.isStandard !== undefined && req.userRole !== 'admin') {
      delete req.body.isStandard;
    }

    // Don't allow changing creator
    delete req.body.createdBy;

    const [num] = await Exercise.update(req.body, {
      where: { id: id }
    });

    if (num == 1) {
      res.send({
        message: "Exercise updated successfully."
      });
    } else {
      res.send({
        message: "Cannot update exercise. Maybe exercise was not found or req.body is empty!"
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating exercise."
    });
  }
};

// Delete exercise
export const remove = async (req, res) => {
  try {
    const id = req.params.id;

    const exercise = await Exercise.findByPk(id);

    if (!exercise) {
      return res.status(404).send({
        message: `Exercise not found with id=${id}`
      });
    }

    // Check permissions
    if (exercise.isStandard && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only admins can delete standard exercises!"
      });
    }

    if (!exercise.isStandard && exercise.createdBy !== req.userId && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You can only delete your own exercises!"
      });
    }

    // Check if exercise is being used
    const resultsCount = await db.exerciseResult.count({
      where: { exerciseId: id }
    });

    if (resultsCount > 0) {
      return res.status(400).send({
        message: "Cannot delete exercise that has recorded results!"
      });
    }

    const num = await Exercise.destroy({
      where: { id: id }
    });

    if (num == 1) {
      res.send({
        message: "Exercise deleted successfully!"
      });
    } else {
      res.send({
        message: `Cannot delete exercise with id=${id}. Maybe exercise was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete exercise."
    });
  }
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove
};