
import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import db from "./app/models/index.js";

// Use alter: true to update existing tables with new fields
// Change to sync({ force: false }) in production
db.sequelize.sync({ alter: true });

const app = express();

// Also use the cors middleware as backup
var corsOptions = {
  origin: "http://localhost:8081",
  credentials: true
}
app.use(cors(corsOptions));


// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
  
// Load the routes from the routes folder
app.use("/seivproject3", routes); 


// set port, listen for requests
const PORT = process.env.PORT || 3100;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

export default app;
