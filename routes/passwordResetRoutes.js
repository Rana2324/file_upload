import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import emailService from "../utils/emailService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Forgot password route - displays form to enter email
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

// Process forgot password request
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    logger.info(`Password reset requested for email: ${email}`);

    // Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Password reset attempted for non-existent email: ${email}`);
      return res.render("forgot-password", {
        error: "No account found with that email address",
      });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Save OTP to user record
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // Send email with OTP
    await emailService.sendOtpEmail(user.email, otp);

    logger.info(`Password reset OTP sent to: ${email}`);

    // If in development mode, show the OTP in the alert
    const isDevMode = emailService.isDevMode();
    if (isDevMode) {
      req.flash ? req.flash("devOtp", `DEV MODE: Your OTP is ${otp}`) : null;
    }

    // Redirect to OTP verification page
    res.redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    logger.error(`Password reset error for email ${req.body.email}:`, error);
    res.render("forgot-password", {
      error: "An error occurred during the password reset process",
    });
  }
});

// OTP verification page
router.get("/verify-otp", (req, res) => {
  const { email } = req.query;

  // Get the saved OTP in development mode
  const devOtp = emailService.getDevOtp(email);
  const isDevMode = emailService.isDevMode();

  res.render("verify-otp", {
    email,
    devMode: isDevMode,
    devOtp: devOtp,
  });
});

// Process OTP verification
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with the given email and valid OTP
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn(`Invalid/expired OTP attempted for email: ${email}`);
      return res.render("verify-otp", {
        email,
        error: "Invalid or expired OTP",
      });
    }

    logger.info(`OTP verified successfully for email: ${email}`);

    // OTP is valid, allow user to reset password
    res.render("reset-password", { email, otp });
  } catch (error) {
    logger.error(`OTP verification error for email ${req.body.email}:`, error);
    res.render("verify-otp", {
      email: req.body.email,
      error: "An error occurred during OTP verification",
    });
  }
});

// Process password reset
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    // Validate password
    if (password !== confirmPassword) {
      return res.render("reset-password", {
        email,
        otp,
        error: "Passwords do not match",
      });
    }

    // Find user with the given email and valid OTP
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn(`Invalid/expired OTP used for password reset: ${email}`);
      return res.render("reset-password", {
        email,
        otp,
        error: "Invalid or expired OTP",
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for email: ${email}`);

    // Redirect to login with success message
    req.flash
      ? req.flash("success", "Your password has been reset successfully")
      : null;
    res.redirect("/auth/login");
  } catch (error) {
    logger.error(`Password reset error for email ${req.body.email}:`, error);
    res.render("reset-password", {
      email: req.body.email,
      otp: req.body.otp,
      error: "An error occurred during password reset",
    });
  }
});

// Add this new route handler for resending OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    logger.info(`OTP resend requested for email: ${email}`);

    // Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`OTP resend attempted for non-existent email: ${email}`);
      return res.status(404).json({
        error: "No account found with that email address",
      });
    }

    // Generate a new random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + config.otp.expiryMinutes);

    // Save new OTP to user record
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // Send email with OTP
    await emailService.sendOtpEmail(user.email, otp);

    logger.info(`New OTP sent to: ${email}`);

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
      devMode: config.devMode,
      devOtp: config.devMode ? otp : null,
    });
  } catch (error) {
    logger.error(`OTP resend error for email ${req.body.email}:`, error);
    return res.status(500).json({
      error: "An error occurred during the OTP resend process",
    });
  }
});

export default router;
