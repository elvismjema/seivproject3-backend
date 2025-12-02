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

// Admin: Get all athletes for a specific coach
export const getCoachAthletes = async (req, res) => {
  try {
    const { coachId } = req.params;
    
    // Check if coach exists and is actually a coach
    const coach = await User.findByPk(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const athletes = await coach.getAthletes({
      attributes: ['id', 'fName', 'lName', 'email'],
      joinTableAttributes: []
    });

    res.status(200).json(athletes);
  } catch (error) {
    console.error('Error getting coach athletes:', error);
    res.status(500).json({ message: 'Failed to get coach athletes', error: error.message });
  }
};

// Admin: Remove an athlete from a coach
export const adminRemoveAthleteFromCoach = async (req, res) => {
  try {
    const { coachId, athleteId } = req.params;

    // Check if coach exists and is actually a coach
    const coach = await User.findByPk(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Check if athlete exists and is actually an athlete
    const athlete = await User.findByPk(athleteId);
    if (!athlete || athlete.role !== 'athlete') {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    // Remove the relationship
    await coach.removeAthlete(athleteId);
    
    res.status(200).json({ message: 'Athlete removed from coach successfully' });
  } catch (error) {
    console.error('Error removing athlete from coach:', error);
    res.status(500).json({ message: 'Failed to remove athlete from coach', error: error.message });
  }
};

// Admin: Assign an athlete to a coach
export const adminAssignAthleteToCoach = async (req, res) => {
  try {
    const { coachId, athleteId } = req.params;

    // Check if coach exists and is actually a coach
    const coach = await User.findByPk(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Check if athlete exists and is actually an athlete
    const athlete = await User.findByPk(athleteId);
    if (!athlete || athlete.role !== 'athlete') {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    // Check if relationship already exists
    const existingRelation = await AthleteCoach.findOne({
      where: {
        coachId,
        athleteId,
        endDate: null
      }
    });

    if (existingRelation) {
      return res.status(400).json({ message: 'Athlete is already assigned to this coach' });
    }

    // Create the relationship
    await coach.addAthlete(athleteId, { through: { startDate: new Date() } });
    
    res.status(201).json({ message: 'Athlete assigned to coach successfully' });
  } catch (error) {
    console.error('Error assigning athlete to coach:', error);
    res.status(500).json({ message: 'Failed to assign athlete to coach', error: error.message });
  }
};

export default {
  requestConnection,
  getMyAthletes,
  getMyCoaches,
  endRelationship,
  updateUserRole,
  getAllUsers,
  getCoachAthletes,
  adminRemoveAthleteFromCoach,
  adminAssignAthleteToCoach
};