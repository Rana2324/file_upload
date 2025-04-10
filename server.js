import express from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import { checkUser } from "./middlewares/authMiddleware.js";
import connectDB from "./config/connectDB.js";
import morgan from "morgan";
import logger from "./utils/logger.js";

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables early - before any imports that might use them
dotenv.config();

logger.info("Starting application...");
logger.debug("Cloudinary Configuration:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKeyExists: !!process.env.CLOUDINARY_API_KEY,
  apiSecretExists: !!process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary using environment variables with error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info("Cloudinary configuration successful");
} catch (error) {
  logger.error("Cloudinary configuration error:", error);
}

const app = express();

// Configure Morgan with logger
const morganMiddleware = morgan("combined", {
  stream: { write: (message) => logger.info(message.trim()) },
});

// Middleware
app.use(morganMiddleware); // Use Morgan for request logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser()); // Add cookie parser for JWT

// View engine
app.set("view engine", "ejs");

// Connect to database
connectDB();
logger.info("Database connection initiated");

// Routes
app.get("*", checkUser); // Using named export checkUser
app.get("/", (req, res) => res.render("index"));
app.use("/auth", authRoutes);
app.use("/auth", passwordResetRoutes); // Add this line
app.use("/upload", uploadRoutes);
app.use("/gallery", galleryRoutes); // Add gallery routes

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(500).json({ error: "Server error", message: err.message });
});

// Handle 404
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: "Not Found" });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});

// Add nodemailer to your dependencies
// Make sure to set up environment variables in your .env file:
// EMAIL_SERVICE=gmail
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASSWORD=your-app-password
// EMAIL_FROM=Image Upload System <your-email@gmail.com>
