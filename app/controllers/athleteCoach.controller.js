import db from "../models/index.js";

const AthleteCoach = db.athleteCoach;
const User = db.user;
const Op = db.Sequelize.Op;

// Coach requests to connect with an athlete
export const requestConnection = async (req, res) => {
  try {
    const { athleteEmail } = req.body;

    if (req.userRole !== 'coach' && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only coaches can request connections with athletes!"
      });
    }

    // Find athlete by email
    const athlete = await User.findOne({
      where: {
        email: athleteEmail,
        role: 'athlete'
      }
    });

    if (!athlete) {
      return res.status(404).send({
        message: "Athlete not found with that email!"
      });
    }

    // Check if relationship already exists
    const existingRelation = await AthleteCoach.findOne({
      where: {
        athleteId: athlete.id,
        coachId: req.userId,
        endDate: null
      }
    });

    if (existingRelation) {
      return res.status(400).send({
        message: "You are already coaching this athlete!"
      });
    }

    // Create new coach-athlete relationship
    const relationship = {
      athleteId: athlete.id,
      coachId: req.userId,
      startDate: new Date()
    };

    const data = await AthleteCoach.create(relationship);
    res.send({
      message: "Successfully connected with athlete!",
      data: data
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error creating coach-athlete connection."
    });
  }
};

// Get all athletes for a coach
export const getMyAthletes = async (req, res) => {
  try {
    if (req.userRole !== 'coach' && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only coaches can view their athletes!"
      });
    }

    const relationships = await AthleteCoach.findAll({
      where: {
        coachId: req.userId,
        endDate: null
      },
      include: [{
        model: User,
        as: 'athlete',
        attributes: ['id', 'fName', 'lName', 'email', 'profileImage']
      }]
    });

    const athletes = relationships.map(r => ({
      relationshipId: r.id,
      startDate: r.startDate,
      ...r.athlete.dataValues
    }));

    res.send(athletes);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving athletes."
    });
  }
};

// Get all coaches for an athlete
export const getMyCoaches = async (req, res) => {
  try {
    if (req.userRole !== 'athlete' && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only athletes can view their coaches!"
      });
    }

    const relationships = await AthleteCoach.findAll({
      where: {
        athleteId: req.userId,
        endDate: null
      },
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'fName', 'lName', 'email', 'profileImage']
      }]
    });

    const coaches = relationships.map(r => ({
      relationshipId: r.id,
      startDate: r.startDate,
      ...r.coach.dataValues
    }));

    res.send(coaches);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving coaches."
    });
  }
};

// End a coach-athlete relationship
export const endRelationship = async (req, res) => {
  try {
    const { relationshipId } = req.params;

    const relationship = await AthleteCoach.findByPk(relationshipId);

    if (!relationship) {
      return res.status(404).send({
        message: "Relationship not found!"
      });
    }

    // Check permissions
    if (req.userRole === 'athlete' && relationship.athleteId !== req.userId) {
      return res.status(403).send({
        message: "You can only end your own coaching relationships!"
      });
    } else if (req.userRole === 'coach' && relationship.coachId !== req.userId) {
      return res.status(403).send({
        message: "You can only end your own coaching relationships!"
      });
    }

    // Set end date instead of deleting
    const [num] = await AthleteCoach.update(
      { endDate: new Date() },
      { where: { id: relationshipId } }
    );

    if (num == 1) {
      res.send({
        message: "Coaching relationship ended successfully."
      });
    } else {
      res.send({
        message: "Could not end relationship."
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error ending relationship."
    });
  }
};

// Admin function to manage role changes
export const updateUserRole = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only admins can change user roles!"
      });
    }

    const { userId, newRole } = req.body;

    if (!['admin', 'coach', 'athlete'].includes(newRole)) {
      return res.status(400).send({
        message: "Invalid role specified!"
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send({
        message: "User not found!"
      });
    }

    // If changing from coach, end all active coaching relationships
    if (user.role === 'coach' && newRole !== 'coach') {
      await AthleteCoach.update(
        { endDate: new Date() },
        {
          where: {
            coachId: userId,
            endDate: null
          }
        }
      );
    }

    // If changing from athlete, end all active athlete relationships
    if (user.role === 'athlete' && newRole !== 'athlete') {
      await AthleteCoach.update(
        { endDate: new Date() },
        {
          where: {
            athleteId: userId,
            endDate: null
          }
        }
      );
    }

    // Update user role
    const [num] = await User.update(
      { role: newRole },
      { where: { id: userId } }
    );

    if (num == 1) {
      res.send({
        message: `User role updated to ${newRole} successfully.`
      });
    } else {
      res.send({
        message: "Could not update user role."
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating user role."
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "Only admins can view all users!"
      });
    }

    const users = await User.findAll({
      attributes: ['id', 'fName', 'lName', 'email', 'role', 'createdAt'],
      order: [['role', 'ASC'], ['lName', 'ASC'], ['fName', 'ASC']]
    });

    res.send(users);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving users."
    });
  }
};

export default {
  requestConnection,
  getMyAthletes,
  getMyCoaches,
  endRelationship,
  updateUserRole,
  getAllUsers
};