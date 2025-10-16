import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";
import db from "../models/index.js";

const User = db.user;
const Session = db.session;

// Verify token and user session
export const verifyToken = async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret);

    // Check if session exists and is valid
    const session = await Session.findOne({
      where: { token: token }
    });

    if (!session) {
      return res.status(401).send({
        message: "Invalid session!"
      });
    }

    if (new Date(session.expirationDate) < new Date()) {
      return res.status(401).send({
        message: "Session expired!"
      });
    }

    // Get user details
    const user = await User.findByPk(session.userId);
    if (!user) {
      return res.status(401).send({
        message: "User not found!"
      });
    }

    // Attach user to request
    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).send({
      message: "Unauthorized!"
    });
  }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).send({
      message: "Require Admin Role!"
    });
  }
  next();
};

// Check if user is coach or admin
export const isCoachOrAdmin = (req, res, next) => {
  if (req.userRole !== 'coach' && req.userRole !== 'admin') {
    return res.status(403).send({
      message: "Require Coach or Admin Role!"
    });
  }
  next();
};

// Check if user is athlete
export const isAthlete = (req, res, next) => {
  if (req.userRole !== 'athlete') {
    return res.status(403).send({
      message: "Require Athlete Role!"
    });
  }
  next();
};

// Check if user can access athlete data (is the athlete, their coach, or admin)
export const canAccessAthlete = async (req, res, next) => {
  const athleteId = parseInt(req.params.athleteId || req.body.athleteId);

  if (!athleteId) {
    return res.status(400).send({
      message: "Athlete ID required!"
    });
  }

  // Admin can access all
  if (req.userRole === 'admin') {
    next();
    return;
  }

  // Athlete can access their own data
  if (req.userRole === 'athlete' && req.userId === athleteId) {
    next();
    return;
  }

  // Coach can access their athletes
  if (req.userRole === 'coach') {
    const relationship = await db.athleteCoach.findOne({
      where: {
        coachId: req.userId,
        athleteId: athleteId,
        endDate: null // Active relationship
      }
    });

    if (relationship) {
      next();
      return;
    }
  }

  return res.status(403).send({
    message: "Access denied!"
  });
};

export default {
  verifyToken,
  isAdmin,
  isCoachOrAdmin,
  isAthlete,
  canAccessAthlete
};