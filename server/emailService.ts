import crypto from "crypto";

/**
 * Email service for sending password reset emails
 * In production, this would integrate with an email service like SendGrid, AWS SES, etc.
 * For now, we'll log the reset link to console (development mode)
 */

export interface EmailConfig {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendPasswordResetEmail(email: string, resetToken: string, baseUrl: string): Promise<void> {
  const resetLink = `${baseUrl}/admin/reset-password?token=${resetToken}`;
  
  const emailConfig: EmailConfig = {
    to: email,
    subject: "Per Scholas Training Pathway - Password Reset Request",
    text: `You have requested to reset your password. Please click the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066CC;">Password Reset Request</h2>
        <p>You have requested to reset your password for the Per Scholas Training Pathway Manager.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this password reset, please ignore this email.</p>
      </div>
    `,
  };

  // In development, log to console
  if (process.env.NODE_ENV !== "production") {
    console.log("=== PASSWORD RESET EMAIL ===");
    console.log(`To: ${emailConfig.to}`);
    console.log(`Subject: ${emailConfig.subject}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log("============================");
    return;
  }

  // In production, integrate with actual email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(emailConfig);
  
  // For now, just log
  console.log(`[Email] Would send password reset email to ${email}`);
}

