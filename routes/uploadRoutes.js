import { Router } from "express";
import * as uploadController from "../controllers/uploadController.js";
import * as authMiddleware from "../middlewares/authMiddleware.js";
import { upload } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.get("/", authMiddleware.requireAuth, uploadController.upload_get);

// Add specific authentication check middleware
const ensureAuthenticated = (req, res, next) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: "No authentication token found" });
  }

  try {
    // Explicitly set user on res.locals to ensure it's available
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(401).json({ error: "Invalid authentication token" });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Ensure user is set in res.locals
      res.locals.user = user;
      console.log("User authenticated in upload route:", user.username);
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

router.post(
  "/",
  ensureAuthenticated,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        // Return detailed error message
        return res.status(400).json({
          error: "File upload error",
          details: err.message,
          code: err.code, // Include error code for debugging
        });
      }
      // Continue to controller if no errors
      next();
    });
  },
  uploadController.upload_post
);

router.get(
  "/profile",
  authMiddleware.requireAuth,
  uploadController.profile_get
);

export default router;
