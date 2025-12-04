import jwt from "jsonwebtoken";
import db from "../models/index.js";

const User = db.User;
const Role = db.Role;

// Verify token and get user info
export const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || 
             req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

// Check if user is an athlete
export const isAthlete = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "athlete") {
        return next();
      }
    }

    res.status(403).send({
      message: "Require Athlete Role!"
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export default {
  verifyToken,
  isAthlete
};
