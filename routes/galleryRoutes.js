import { Router } from "express";
import * as galleryController from "../controllers/galleryController.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { multipleUpload } from "../utils/cloudinary.js";

const router = Router();

// Custom authentication middleware specifically for gallery upload
const ensureAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      console.log("No JWT token found in gallery route");
      return res
        .status(401)
        .json({ error: "Authentication required. Please login first." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log("JWT verification error:", err.message);
        return res.status(401).json({ error: "Invalid authentication token" });
      }

      try {
        const user = await User.findById(decodedToken.id);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        // Set user in res.locals for the controller to use
        res.locals.user = user;
        console.log(`User authenticated for gallery: ${user.username}`);
        next();
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ error: "Error retrieving user data" });
      }
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication system error" });
  }
};

// Gallery routes with authentication
router.get("/", ensureAuthenticated, galleryController.gallery_view);
router.get("/upload", ensureAuthenticated, galleryController.gallery_get);

// Handle multipleUpload after authentication
router.post(
  "/upload",
  ensureAuthenticated,
  (req, res, next) => {
    multipleUpload(req, res, function (err) {
      if (err) {
        console.error("Multer error in gallery upload:", err);
        return res.status(400).json({
          error: "File upload error",
          details: err.message,
        });
      }
      // Log success and continue
      console.log(`Successfully processed ${req.files?.length || 0} files`);
      next();
    });
  },
  galleryController.gallery_post
);

router.delete("/:id", ensureAuthenticated, galleryController.gallery_delete);

export default router;
