const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const sendOtpEmail = require("../utils/sendOtpEmail");

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to send OTP email
async function sendOtpEmail(to, otp) {
  try {
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
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
            &copy; ${new Date().getFullYear()} Image Upload System. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}

// Forgot password route - displays form to enter email
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

// Process forgot password request
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
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
    await sendOtpEmail(user.email, otp);

    // Redirect to OTP verification page
    res.redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("Password reset error:", error);
    res.render("forgot-password", {
      error: "An error occurred during the password reset process",
    });
  }
});

// OTP verification page
router.get("/verify-otp", (req, res) => {
  const { email } = req.query;
  res.render("verify-otp", { email });
});

// Process OTP verification
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with the given email
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("verify-otp", {
        email,
        error: "Invalid or expired OTP",
      });
    }

    // OTP is valid, allow user to reset password
    res.render("reset-password", { email, otp });
  } catch (error) {
    console.error("OTP verification error:", error);
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

    // Find user with the given email and OTP
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("reset-password", {
        email,
        otp,
        error: "Invalid or expired OTP",
      });
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Redirect to login with success message
    req.flash("success", "Your password has been reset successfully");
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Password reset error:", error);
    res.render("reset-password", {
      email: req.body.email,
      otp: req.body.otp,
      error: "An error occurred during password reset",
    });
  }
});

module.exports = router;
