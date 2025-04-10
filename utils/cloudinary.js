import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";

// Ensure environment variables are loaded
dotenv.config();

// Initialize and configure Cloudinary
const initCloudinary = () => {
  try {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log("Cloudinary initialized successfully");
    return true;
  } catch (error) {
    console.error("Cloudinary initialization failed:", error);
    return false;
  }
};

// Validate if all required credentials exist
const validateConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error(
      "WARNING: Missing Cloudinary credentials in environment variables!"
    );
    return false;
  }
  return true;
};

// Run initialization and validation
validateConfig() && initCloudinary();

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "gallery-uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    format: "jpg",
    public_id: (req, file) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `image-${uniqueSuffix}`;
      console.log(`Generated filename: ${filename}`);
      return filename;
    },
  },
});

// Enhanced file filter with validation
const fileFilter = (req, file, cb) => {
  try {
    // Check file type
    if (!file.mimetype.startsWith("image/")) {
      console.error(
        `Rejected file: ${file.originalname} - Not an image (${file.mimetype})`
      );
      return cb(new Error("Only image files are allowed"));
    }

    // Check file size before upload (additional check)
    if (file.size && file.size > 5 * 1024 * 1024) {
      console.error(
        `Rejected file: ${file.originalname} - Too large (${file.size} bytes)`
      );
      return cb(new Error("File too large, max 5MB allowed"));
    }

    console.log(`Accepting file: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  } catch (error) {
    console.error("Error in file filter:", error);
    cb(error);
  }
};

// Configure multer for single image upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Configure multer for multiple image upload
const multipleUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).array("images", 10); // Allow up to 10 images

export { upload, multipleUpload, cloudinary };
