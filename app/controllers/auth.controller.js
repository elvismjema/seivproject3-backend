import db  from "../models/index.js";
import authconfig  from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import  { google } from "googleapis";
import jwt from "jsonwebtoken";

const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;

let googleUser = {};

const google_id = process.env.CLIENT_ID;

const exports = {};

exports.login = async (req, res) => {
  console.log("=== LOGIN STARTED ===");

  var googleToken = req.body.credential;
  var pendingRole = req.body.role; // Get the role from the request

  const client = new OAuth2Client(google_id);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    console.log("Google payload is " + JSON.stringify(googleUser));
  }
  try {
    await verify();
  } catch (error) {
    console.error("Google token verification failed:", error.message);
    return res.status(401).send({
      message: "Invalid Google token"
    });
  }

  let email = googleUser.email;
  let firstName = googleUser.given_name;
  let lastName = googleUser.family_name || ""; // Default to empty string if no last name

  if (!email) {
    return res.status(400).send({
      message: "No email found in Google token"
    });
  }

  // if we don't have their email or name, we need to make another request
  // this is solely for testing purposes
  if (
    (email === undefined ||
      firstName === undefined ||
      lastName === undefined) &&
    req.body.accessToken !== undefined
  ) {
    let oauth2Client = new OAuth2Client(google_id); // create new auth client
    oauth2Client.setCredentials({ access_token: req.body.accessToken }); // use the new auth client with the access_token
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    let { data } = await oauth2.userinfo.get(); // get user info
    console.log(data);
    email = data.email;
    firstName = data.given_name;
    lastName = data.family_name;
  }


  let user = {};
  let session = {};

  console.log("Step 1: Finding user with email:", email);
  try {
    const data = await User.findOne({
      where: {
        email: email,
      },
    });

    if (data != null) {
      user = data.dataValues;
      console.log("Step 2: Found existing user:", user.id, "with role:", user.role);
    } else {
      // create a new User and save to database
      // Use the role from the request if provided, otherwise default
      const userCount = await User.count();
      let defaultRole = 'athlete';

      if (userCount === 0) {
        // First user is always admin
        defaultRole = 'admin';
      } else if (pendingRole && ['athlete', 'coach'].includes(pendingRole)) {
        // Use the role selected during registration
        defaultRole = pendingRole;
      }

      user = {
        fName: firstName,
        lName: lastName,
        email: email,
        role: defaultRole,
      };
      console.log("Step 2: User not found, will create new user with role:", defaultRole);
    }
  } catch (err) {
    console.error("ERROR finding user:", err);
    return res.status(500).send({ message: err.message });
  }

  // this lets us get the user id
  if (user.id === undefined) {
    console.log("Step 3: Creating new user");
    try {
      const data = await User.create(user);
      user = data.dataValues;
      console.log("Step 3a: New user created with ID:", user.id);
    } catch (err) {
      console.error("ERROR creating user:", err);
      return res.status(500).send({ message: err.message });
    }
  } else {
    
    // doing this to ensure that the user's name is the one listed with Google
    user.fName = firstName;
    user.lName = lastName;
  
    await User.update(user, { where: { id: user.id } })
      .then((num) => {
        if (num == 1) {
          console.log("updated user's name");
        } else {
          console.log(
            `Cannot update User with id=${user.id}. Maybe User was not found or req.body is empty!`
          );
        }
      })
      .catch((err) => {
        console.log("Error updating User with id=" + user.id + " " + err);
      });
  }

  // try to find session first
  console.log("Step 4: Looking for existing session");
  try {
    const existingSession = await Session.findOne({
      where: {
        email: email,
        token: { [Op.ne]: "" },
      },
    });

    if (existingSession) {
      session = existingSession.dataValues;
      console.log("Found existing session, checking expiration");
      console.log("Session expiration:", session.expirationDate);
      console.log("Current time:", new Date());
      console.log("Is expired?", new Date(session.expirationDate) < new Date());

      if (new Date(session.expirationDate) < new Date()) {
        // Session expired, clear it
        console.log("Session expired, clearing it");
        await Session.update(
          { token: "" },
          { where: { id: session.id } }
        );
        session = {}; // Reset to create new session
      } else {
        // Valid session found, return user info
        const userInfo = {
          email: user.email,
          fName: user.fName,
          lName: user.lName,
          userId: user.id,
          role: user.role,
          token: session.token,
        };
        console.log("found a session, don't need to make another one");
        console.log(userInfo);
        return res.send(userInfo);
      }
    }
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving sessions.",
    });
  }

  // Only create a new session if we haven't found an existing one
  if (session.id === undefined) {
    // create a new Session with an expiration date and save to database
    let token = jwt.sign({ id: email }, authconfig.secret, {
      expiresIn: 86400,
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    const newSession = {
      token: token,
      email: email,
      userId: user.id,
      expirationDate: tempExpirationDate,
    };

    console.log("making a new session");
    console.log(newSession);

    await Session.create(newSession)
      .then(() => {
        let userInfo = {
          email: user.email,
          fName: user.fName,
          lName: user.lName,
          userId: user.id,
          role: user.role,
          token: token,
          // refresh_token: user.refresh_token,
          // expiration_date: user.expiration_date
        };
        console.log(userInfo);
        return res.send(userInfo);
      })
      .catch((err) => {
        console.error("ERROR creating session:", err);
        return res.status(500).send({ message: err.message });
      });
  } else {
    // We should have returned earlier if we had a valid session
    console.log("WARNING: Session exists but wasn't handled properly");
    console.log(session);
    return res.status(500).send({ message: "Session handling error" });
  }
};

exports.authorize = async (req, res) => {
  console.log("authorize client");
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "postmessage"
  );

  console.log("authorize token");
  // Get access and refresh tokens (if access_type is offline)
  let { tokens } = await oauth2Client.getToken(req.body.code);
  oauth2Client.setCredentials(tokens);

  let user = {};
  console.log("findUser");

  await User.findOne({
    where: {
      id: req.params.id,
    },
  })
    .then((data) => {
      if (data != null) {
        user = data.dataValues;
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
      return;
    });
  console.log("user");
  console.log(user);
  user.refresh_token = tokens.refresh_token;
  let tempExpirationDate = new Date();
  tempExpirationDate.setDate(tempExpirationDate.getDate() + 100);
  user.expiration_date = tempExpirationDate;

  await User.update(user, { where: { id: user.id } })
    .then((num) => {
      if (num == 1) {
        console.log("updated user's google token stuff");
      } else {
        console.log(
          `Cannot update User with id=${user.id}. Maybe User was not found or req.body is empty!`
        );
      }
      let userInfo = {
        refresh_token: user.refresh_token,
        expiration_date: user.expiration_date,
      };
      console.log(userInfo);
      res.send(userInfo);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });

  console.log(tokens);
  console.log(oauth2Client);
};

exports.logout = async (req, res) => {
  console.log(req.body);
  if (req.body === null) {
    res.send({
      message: "User has already been successfully logged out!",
    });
    return;
  }

  // invalidate session -- delete token out of session table
  let session = {};

  await Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      if (data[0] !== undefined) session = data[0].dataValues;
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
      return;
    });

  session.token = "";

  // session won't be null but the id will if no session was found
  if (session.id !== undefined) {
    Session.update(session, { where: { id: session.id } })
      .then((num) => {
        if (num == 1) {
          console.log("successfully logged out");
          res.send({
            message: "User has been successfully logged out!",
          });
        } else {
          console.log("failed");
          res.send({
            message: `Error logging out user.`,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          message: "Error logging out user.",
        });
      });
  } else {
    console.log("already logged out");
    res.send({
      message: "User has already been successfully logged out!",
    });
  }
};
export default exports;
