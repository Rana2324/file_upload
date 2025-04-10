import Gallery from "../models/Gallery.js";
import { cloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

// Export functions individually
export const gallery_get = (req, res) => {
  res.render("gallery/upload");
};

export const gallery_post = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!res.locals.user || !res.locals.user._id) {
      logger.warn("Gallery upload attempted without authenticated user");
      return res.status(401).json({
        error: "Authentication required",
        details: "User not authenticated properly",
      });
    }

    // Verify files are present
    if (!req.files || req.files.length === 0) {
      logger.warn("Gallery upload: No files received", {
        userId: res.locals.user._id,
        username: res.locals.user.username,
      });
      return res.status(400).json({ error: "No files uploaded" });
    }

    logger.info(`Processing gallery upload`, {
      userId: res.locals.user._id,
      username: res.locals.user.username,
      fileCount: req.files.length,
    });

    const userId = res.locals.user._id;
    const { title, description, tags } = req.body;
    const tagArray = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    // Process each uploaded file
    const uploadPromises = req.files.map(async (file) => {
      // Extract correct Cloudinary information
      const imageUrl = file.path || file.secure_url || file.url;
      const cloudinaryId =
        file.filename || file.public_id || path.basename(imageUrl);

      console.log(`Processing file: ${imageUrl}, ID: ${cloudinaryId}`);

      // Create a new gallery entry for each image
      return Gallery.create({
        userId,
        title: title || "Untitled",
        description: description || "",
        imageUrl: imageUrl,
        cloudinaryId: cloudinaryId,
        tags: tagArray,
      });
    });

    // Wait for all uploads to complete
    const uploadedImages = await Promise.all(uploadPromises);
    console.log(
      `Successfully created ${uploadedImages.length} gallery entries`
    );

    logger.info(`Successfully uploaded ${req.files.length} images to gallery`, {
      userId: res.locals.user._id,
      username: res.locals.user.username,
    });

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${req.files.length} images`,
    });
  } catch (err) {
    logger.error("Gallery upload error:", err);
    res
      .status(500)
      .json({ error: "Failed to upload images", details: err.message });
  }
};

export const gallery_view = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const images = await Gallery.find({ userId }).sort({ createdAt: -1 });

    res.render("gallery/view", { images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving gallery" });
  }
};

export const gallery_delete = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Check if image belongs to user
    if (image.userId.toString() !== res.locals.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete image from Cloudinary
    if (image.cloudinaryId) {
      await cloudinary.v2.uploader.destroy(image.cloudinaryId);
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting image" });
  }
};

// Also maintain default export for backward compatibility
const galleryController = {
  gallery_get,
  gallery_post,
  gallery_view,
  gallery_delete,
};

export default galleryController;
