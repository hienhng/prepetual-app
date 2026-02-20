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
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Funnel+Display:wght@800&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #FACC15; padding: 28px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #171717; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Funnel Display', sans-serif; font-weight: 800;">prepetual</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #171717; font-size: 20px; font-weight: 600; font-family: 'Funnel Display', sans-serif; font-weight: 800;">Welcome aboard, ${name}!</h2>
                    <p style="margin: 0 0 28px 0; color: #525252; font-size: 15px; line-height: 1.7; font-family: 'Funnel Display', sans-serif; font-weight: 800;">
                      You're just one step away from unlocking the power of AI-generated quizzes. Verify your email to get started.
                    </p>
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center; padding: 8px 0 32px 0;">
                          <a href="${verificationUrl}" style="display: inline-block; background-color: #FACC15; color: #171717; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: 'Funnel Display', sans-serif; font-weight: 800; border: 1px solid #E5B800;">
                            Verify My Email
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Funnel Display', sans-serif; font-weight: 800;">Or copy this link:</p>
                    <p style="margin: 0 0 24px 0; padding: 12px; background-color: #e5e5e5; border-radius: 8px; word-break: break-all; color: #525252; font-size: 12px; font-family: monospace;">${verificationUrl}</p>
                    <p style="margin: 0; color: #737373; font-size: 13px; font-family: 'Funnel Display', sans-serif; font-weight: 800;">This link expires in 24 hours.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #ebebeb; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #737373; font-size: 12px; text-align: center; font-family: 'Funnel Display', sans-serif; font-weight: 800;">
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
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Funnel+Display:wght@800&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #FACC15; padding: 28px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #171717; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Funnel Display', sans-serif; font-weight: 800;">prepetual</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #171717; font-size: 20px; font-weight: 600; font-family: 'Funnel Display', sans-serif; font-weight: 800;">Reset your password</h2>
                    <p style="margin: 0 0 8px 0; color: #525252; font-size: 15px; line-height: 1.7; font-family: 'Funnel Display', sans-serif; font-weight: 800;">
                      Hi ${name},
                    </p>
                    <p style="margin: 0 0 28px 0; color: #525252; font-size: 15px; line-height: 1.7; font-family: 'Funnel Display', sans-serif; font-weight: 800;">
                      We received a request to reset your password. Click the button below to create a new one.
                    </p>
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center; padding: 8px 0 32px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #FACC15; color: #171717; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: 'Funnel Display', sans-serif; font-weight: 800; border: 1px solid #E5B800;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Funnel Display', sans-serif; font-weight: 800;">Or copy this link:</p>
                    <p style="margin: 0 0 24px 0; padding: 12px; background-color: #e5e5e5; border-radius: 8px; word-break: break-all; color: #525252; font-size: 12px; font-family: monospace;">${resetUrl}</p>
                    <p style="margin: 0; color: #737373; font-size: 13px; font-family: 'Funnel Display', sans-serif; font-weight: 800;">This link expires in 1 hour.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #ebebeb; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #737373; font-size: 12px; text-align: center; font-family: 'Funnel Display', sans-serif; font-weight: 800;">
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
