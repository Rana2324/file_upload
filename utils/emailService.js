import nodemailer from "nodemailer";
import logger from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

// Log email configuration for debugging
logger.debug("Email Configuration:", {
  service: process.env.EMAIL_SERVICE || "gmail",
  userExists: !!process.env.EMAIL_USER,
  passwordExists: !!process.env.EMAIL_PASSWORD,
});

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter setup
transporter.verify(function (error, success) {
  if (error) {