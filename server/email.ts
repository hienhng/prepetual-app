import nodemailer from "nodemailer";

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
  username?: string
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://prepetual.app"
    : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  const name = username || "there";

  console.log("[Email] Sending verification email to:", to);
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your email address - Prepetual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Climate+Crisis&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #FACC15; padding: 28px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #171717; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Climate Crisis', cursive;">prepetual</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #171717; font-size: 20px; font-weight: 600; font-family: 'Climate Crisis', cursive;">Welcome aboard, ${name}!</h2>
                    <p style="margin: 0 0 28px 0; color: #525252; font-size: 15px; line-height: 1.7; font-family: 'Climate Crisis', cursive;">
                      You're just one step away from unlocking the power of AI-generated quizzes. Verify your email to get started.
                    </p>
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center; padding: 8px 0 32px 0;">
                          <a href="${verificationUrl}" style="display: inline-block; background-color: #FACC15; color: #171717; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: 'Climate Crisis', cursive; border: 1px solid #E5B800;">
                            Verify My Email
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Climate Crisis', cursive;">Or copy this link:</p>
                    <p style="margin: 0 0 24px 0; padding: 12px; background-color: #e5e5e5; border-radius: 8px; word-break: break-all; color: #525252; font-size: 12px; font-family: monospace;">${verificationUrl}</p>
                    <p style="margin: 0; color: #737373; font-size: 13px; font-family: 'Climate Crisis', cursive;">This link expires in 24 hours.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #ebebeb; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #737373; font-size: 12px; text-align: center; font-family: 'Climate Crisis', cursive;">
                      Didn't sign up for Prepetual? You can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
  console.log("[Email] Verification email sent successfully to:", to);
}

export async function sendStreakReminderEmail(
  to: string,
  username: string | null | undefined,
  currentStreak: number
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://prepetual.app"
    : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

  const dashboardUrl = `${baseUrl}/dashboard`;
  const name = username || "there";
  
  // Motivational messages based on streak length
  let headline = "";
  let subheadline = "";
  
  if (currentStreak >= 30) {
    headline = `${currentStreak} days strong!`;
    subheadline = "You're a learning legend. Don't let this incredible streak slip away!";
  } else if (currentStreak >= 14) {
    headline = `${currentStreak} days and counting!`;
    subheadline = "Two weeks of dedication. You're building something amazing here!";
  } else if (currentStreak >= 7) {
    headline = `A whole week! ${currentStreak} days!`;
    subheadline = "Your consistency is paying off. Keep the momentum going!";
  } else if (currentStreak >= 3) {
    headline = `${currentStreak} day streak!`;
    subheadline = "Great progress! A few minutes today keeps the streak alive.";
  } else {
    headline = "Keep your streak alive!";
    subheadline = "One quick quiz is all it takes. You've got this!";
  }
  
  // Inline SVG flame icon (Lucide Flame icon)
  const flameIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
  
  // Inline SVG arrow icon for button
  const arrowIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-left:6px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

  console.log("[Email] Sending streak reminder to:", to);
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your ${currentStreak}-day streak is waiting, ${name}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Climate+Crisis&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #262626; border-radius: 20px; overflow: hidden; border: 1px solid #404040;">
                <!-- Hero Section with Flame -->
                <tr>
                  <td style="background: linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%); padding: 48px 40px; text-align: center;">
                    <div style="margin-bottom: 8px;">${flameIconSvg}</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 800; letter-spacing: -1px; font-family: 'Climate Crisis', cursive; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${currentStreak}</h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; font-family: 'Climate Crisis', cursive;">Day Streak</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 24px; font-weight: 700; font-family: 'Climate Crisis', cursive;">${headline}</h2>
                    <p style="margin: 0 0 32px 0; color: #a3a3a3; font-size: 16px; line-height: 1.7; font-family: 'Climate Crisis', cursive;">
                      Hey ${name}! ${subheadline}
                    </p>
                    <!-- Stats Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                      <tr>
                        <td style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #404040;">
                          <p style="margin: 0 0 4px 0; color: #F97316; font-size: 28px; font-weight: 800; font-family: 'Climate Crisis', cursive;">${currentStreak} days</p>
                          <p style="margin: 0; color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Climate Crisis', cursive;">Current Streak</p>
                        </td>
                      </tr>
                    </table>
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; font-family: 'Climate Crisis', cursive; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                            Continue Learning ${arrowIconSvg}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Motivational Quote -->
                <tr>
                  <td style="padding: 0 40px 32px 40px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; border-left: 4px solid #F97316;">
                          <p style="margin: 0; color: #d4d4d4; font-size: 14px; font-style: italic; line-height: 1.6; font-family: 'Climate Crisis', cursive;">
                            "Small daily improvements are the key to staggering long-term results."
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #1a1a1a; border-top: 1px solid #404040;">
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 12px; text-align: center; font-family: 'Climate Crisis', cursive;">
                      You're receiving this because you're awesome and have an active streak on Prepetual.
                    </p>
                    <p style="margin: 0; color: #525252; font-size: 11px; text-align: center; font-family: 'Climate Crisis', cursive;">
                      <a href="${baseUrl}/dashboard" style="color: #525252; text-decoration: underline;">Manage email preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
  console.log("[Email] Streak reminder sent successfully to:", to);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  username?: string
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://prepetual.app"
    : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const name = username || "there";

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your password - Prepetual",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Climate+Crisis&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #FACC15; padding: 28px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #171717; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Climate Crisis', cursive;">prepetual</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #171717; font-size: 20px; font-weight: 600; font-family: 'Climate Crisis', cursive;">Reset your password</h2>
                    <p style="margin: 0 0 8px 0; color: #525252; font-size: 15px; line-height: 1.7; font-family: 'Climate Crisis', cursive;">
                      Hi ${name},
                    </p>
                    <p style="margin: 0 0 28px 0; color: #525252; font-size: 15px; line-height: 1.7; font-family: 'Climate Crisis', cursive;">
                      We received a request to reset your password. Click the button below to create a new one.
                    </p>
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center; padding: 8px 0 32px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #FACC15; color: #171717; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: 'Climate Crisis', cursive; border: 1px solid #E5B800;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Climate Crisis', cursive;">Or copy this link:</p>
                    <p style="margin: 0 0 24px 0; padding: 12px; background-color: #e5e5e5; border-radius: 8px; word-break: break-all; color: #525252; font-size: 12px; font-family: monospace;">${resetUrl}</p>
                    <p style="margin: 0; color: #737373; font-size: 13px; font-family: 'Climate Crisis', cursive;">This link expires in 1 hour.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #ebebeb; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #737373; font-size: 12px; text-align: center; font-family: 'Climate Crisis', cursive;">
                      Didn't request a password reset? You can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const transporter = getTransporter();
  
  // Send email TO the admin (giahienhn@gmail.com)
  await transporter.sendMail({
    from: `"Prepetual Contact" <${process.env.GMAIL_USER}>`,
    to: "giahienhn@gmail.com",
    replyTo: data.email,
    subject: `Contact Form: ${data.subject}`,
    text: `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>
    `,
  });

  // Optional: Send a confirmation email back to the user
  try {
    await transporter.sendMail({
      from: `"Prepetual Support" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: "We received your message - Prepetual",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #FACC15;">Message Received!</h2>
          <p>Hi ${data.name},</p>
          <p>Thanks for reaching out to Prepetual. We've received your message about "<strong>${data.subject}</strong>" and will get back to you at this email address as soon as possible.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">This is an automated confirmation. No need to reply to this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send contact confirmation email:", err);
  }
}
