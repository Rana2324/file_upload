const nodemailer = require("nodemailer");

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password
 */
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

module.exports = {
  sendOtpEmail,
};
