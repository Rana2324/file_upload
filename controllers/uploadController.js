import User from "../models/User.js";
import { cloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

// Export functions individually
export const upload_get = (req, res) => {
  res.render("upload");
};

export const upload_post = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!res.locals.user) {
      logger.warn("Authentication error: User not found in res.locals");
      return res.status(401).json({
        error: "Unauthorized - Please login first",
        details: "No authenticated user found",
      });
    }

    // Check if file was provided in the request
    if (!req.file) {
      logger.warn("Upload error: No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Log user and file information
    logger.info("User uploaded a file", {
      userId: res.locals.user._id,
      username: res.locals.user.username,
      fileInfo: {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });

    // Get the current user and update their profile image
    const userId = res.locals.user._id;
    await User.findByIdAndUpdate(userId, {
      profileImage: req.file.path, // Cloudinary URL is stored in req.file.path
    });

    res.status(200).json({
      success: true,
      filePath: req.file.path,
      fileInfo: req.file,
    });
  } catch (err) {
    logger.error("Upload controller error:", err);
    res.status(500).json({
      error: "Server error",
    });
  }
};

export const profile_get = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const user = await User.findById(userId);

    res.render("profile", { user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Also maintain default export for backward compatibility
const uploadController = {
  upload_get,
  upload_post,
  profile_get,
};

export default uploadController;
