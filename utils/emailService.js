import nodemailer from "nodemailer";
import logger from "./logger.js";
import config from "../config/config.js";

// Log email configuration for debugging
logger.debug("Email Configuration:", {
  service: config.email.service,
  userExists: !!config.email.user,
  passwordExists: !!config.email.password,
  devMode: config.devMode,
});

// Store OTPs in memory for development access (will be cleared on server restart)
const devOtps = new Map();

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// Verify transporter setup on startup
try {
  if (config.email.user && config.email.password) {
    transporter.verify(function (error, success) {
      if (error) {
        logger.error("SMTP server connection error:", error);
      } else {
        logger.info("SMTP server connection successful");
      }
    });
  } else {
    logger.warn(
      "Email credentials not provided, email sending will be simulated"
    );
  }
} catch (error) {
  logger.error("Failed to verify email transport:", error);
}

// Check if we're in development mode
const DEV_MODE = process.env.DEV_MODE === "true";

// Track OTPs in memory for development mode
const otpStore = new Map();

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password
 */
async function sendOtpEmail(to, otp) {
  try {
    // Store OTP for development mode access
    if (DEV_MODE) {
      otpStore.set(to, otp);
      logger.info(`DEV MODE: OTP for ${to} is: ${otp}`);
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: "Password Reset - One-Time Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Image Upload System</h2>
          <h3>Password Reset</h3>
          <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the process:</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="color: #4F46E5; letter-spacing: 5px; margin: 0;">${otp}</h2>
          </div>
          <p>This OTP will expire in ${config.otp.expiryMinutes} minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
            &copy; ${new Date().getFullYear()} Image Upload System. All rights reserved.
          </p>
        </div>
      `,
    };

    // Only attempt to send email if not in DEV_MODE to avoid errors
    if (!DEV_MODE) {
      try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`OTP email sent to ${to}:`, info.messageId);
        return info;
      } catch (emailError) {
        logger.error(`Failed to send email to ${to}:`, emailError);

        // If email sending fails but we're in development, continue with the stored OTP
        if (DEV_MODE) {
          logger.warn(`Development mode active - OTP available in logs`);
          return { messageId: `dev-mode-${Date.now()}` };
        }

        throw emailError; // Re-throw if not in dev mode
      }
    } else {
      // In development mode, just pretend we sent the email
      logger.info(`DEV MODE: Email sending skipped, check logs for OTP`);
      return { messageId: `dev-mode-${Date.now()}` };
    }
  } catch (error) {
    logger.error(`Error in sendOtpEmail for ${to}:`, error);
    throw error;
  }
}

/**
 * Get the stored OTP for a user (development mode only)
 * @param {string} email - The email to get OTP for
 * @returns {string|null} - The OTP or null if not found
 */
function getDevOtp(email) {
  if (!DEV_MODE) return null;
  return otpStore.get(email) || null;
}

// Add a function to check and export the DEV_MODE status
function isDevMode() {
  return DEV_MODE;
}

export default {
  sendOtpEmail,
  getDevOtp,
  isDevMode,
};
