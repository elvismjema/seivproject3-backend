  import users from "../controllers/user.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], users.create);

  // Admin routes (must come before parameterized routes)
  router.get("/admin/stats", [authenticate], users.getAdminStats);
  router.get("/admin/all-users", [authenticate], users.getAllUsers);

  // Retrieve all People
  router.get("/", [authenticate], users.findAll);

  // Retrieve a single User with id
  router.get("/:id", [authenticate], users.findOne);

  // Update a User with id
  router.put("/:id", [authenticate], users.update);

  // Update user role
  router.put("/:id/role", [authenticate], users.updateRole);

  // Delete a User with id
  router.delete("/:id", [authenticate], users.delete);


  export default router;

