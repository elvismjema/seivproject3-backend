// Import all middleware modules
import * as authJwt from "./authJwt.js";
import * as authRole from "./authRole.js";

// Re-export all middleware functions
export { authJwt, authRole };

// Default export with all middleware
const middleware = {
  ...authJwt,
  ...authRole
};

export default middleware;
