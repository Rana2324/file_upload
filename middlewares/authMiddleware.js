import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Export the requireAuth function as a named export
export const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect("/auth/login");
      } else {
        next();
      }
    });
  } else {
    res.redirect("/auth/login");
  }
};

// Export the checkUser function as a named export
export const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        logger.warn("JWT verification error:", { error: err.message });
        res.locals.user = null;
        next();
      } else {
        try {
          const user = await User.findById(decodedToken.id);
          if (user) {
            res.locals.user = user;
            logger.debug("User authenticated:", {
              username: user.username,
              userId: user._id,
            });
          } else {
            logger.warn("User not found in database for token", {
              tokenId: decodedToken.id,
            });
            res.locals.user = null;
          }
        } catch (error) {
          logger.error("Database error when fetching user:", error);
          res.locals.user = null;
        }
        next();
      }
    });
  } else {
    logger.debug("No JWT token found in cookies");
    res.locals.user = null;
    next();
  }
};

// Also export as a default object for backward compatibility
const authMiddleware = { requireAuth, checkUser };
export default authMiddleware;
