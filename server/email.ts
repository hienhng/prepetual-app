// Import nodemailer - esbuild will bundle this
import nodemailerPkg from "nodemailer";

// Get the actual module - handle both ESM default and CJS module.exports
const nodemailer: typeof nodemailerPkg = (nodemailerPkg as any).default ?? nodemailerPkg;

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Email configuration missing: GMAIL_USER or GMAIL_APP_PASSWORD not set");
  }
  
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  
  return cachedTransporter;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  firstName?: string
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://prepetual.app"
    : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  const name = firstName || "there";

  console.log("[Email] Sending verification email to:", to);
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your email address - Prepetual",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Prepetual!</h1>
        <p>Hi ${name},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">
          If you didn't create an account with Prepetual, please ignore this email.
        </p>
      </div>
    `,
  });
  console.log("[Email] Verification email sent successfully to:", to);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  firstName?: string
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://prepetual.app"
    : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const name = firstName || "there";

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your password - Prepetual",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Reset Your Password</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6B7280;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
  });
}
