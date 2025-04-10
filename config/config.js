// Configuration settings for the application
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  // Enable development mode features like OTP display on screen
  // This should be set to false in production
  devMode: process.env.NODE_ENV !== "production",

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromAddress: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },

  // OTP configuration
  otp: {
    expiryMinutes: 10,
    resendCooldownSeconds: 60,
  },
};

export default config;
