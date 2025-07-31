// helper.js
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // Built-in Node.js module for generating random bytes

/**
 * Generates a 6-digit numeric OTP. (Keep this for email verification)
 * @returns {string} The 6-digit OTP.
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generates a random, secure token for password resets.
 * @returns {string} A URL-safe base64 encoded token.
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex"); // Generates a 64-character hex string
};

/**
 * Sends a verification email to the user. (Your existing function)
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The OTP to include in the email.
 */
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true" || process.env.EMAIL_SECURE === "1";
const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"AILMS" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your AILMS Email Verification Code",
      html: `
<div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; color: #333; background-color: #f7f7f7; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <div style="background-color: #0057ff; color: #ffffff; padding: 20px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">AILMS</h1>
      <p style="margin: 5px 0 0; font-size: 18px;">Account Verification</p>
    </div>
    <div style="padding: 30px 40px; line-height: 1.6;">
      <h2 style="color: #333; margin-top: 0;">Confirm Your Email Address</h2>
      <p>Welcome to AILMS! To access your account, please use the One-Time Password (OTP) below.</p>
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 42px; font-weight: bold; color: #0057ff; letter-spacing: 4px; margin: 0; padding: 15px; background-color: #f0f5ff; border-radius: 8px; display: inline-block;">
          ${otp}
        </p>
      </div>
      <p>This code is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
      <p>If you did not request this verification, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-style: italic;">Thank you for choosing AILMS.</p>
    </div>
    <div style="background-color: #f7f7f7; color: #888; padding: 20px 30px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} AILMS. All Rights Reserved.</p>
      <p style="margin: 5px 0 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</div>
`
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Could not send verification email.");
  }
};

/**
 * Sends a password reset email with a reset link.
 * @param {string} email - The recipient's email address.
 * @param {string} token - The password reset token.
 * @param {string} frontendHost - The base URL of your frontend application.
 */
const sendPasswordResetEmail = async (email, token, frontendHost) => {
  try {
    const resetLink = `${frontendHost}/reset-password?token=${token}`; // Construct the full reset link

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"AILMS" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "AILMS Password Reset Request",
      html: `
<div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; color: #333; background-color: #f7f7f7; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <div style="background-color: #0057ff; color: #ffffff; padding: 20px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">AILMS</h1>
      <p style="margin: 5px 0 0; font-size: 18px;">Password Reset Request</p>
    </div>
    <div style="padding: 30px 40px; line-height: 1.6;">
      <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
      <p>You are receiving this email because we received a password reset request for your account.</p>
      <p>To reset your password, please click on the link below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #0057ff; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in <strong>1 hour</strong>.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-style: italic;">Thank you for choosing AILMS.</p>
    </div>
    <div style="background-color: #f7f7f7; color: #888; padding: 20px 30px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} AILMS. All Rights Reserved.</p>
      <p style="margin: 5px 0 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</div>
`
    };

    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Could not send password reset email.");
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  generateRandomToken, // Export the new token generator
  sendPasswordResetEmail // Export the new email sender
};
