import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const isDev = process.env.NODE_ENV !== "production";
  const hasCredentials = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

  if (!hasCredentials) {
    if (!isDev) {
      throw new Error("Email configuration missing: GMAIL_USER or GMAIL_APP_PASSWORD not set");
    }

    console.warn("\x1b[33m%s\x1b[0m", "[Email] Gmail credentials missing. Using console-log fallback for development.");

    // Return a mock transporter that just logs to console
    return {
      sendMail: async (options: any) => {
        console.log("\x1b[36m%s\x1b[0m", "--- DEV EMAIL SENT ---");
        console.log("To:", options.to);
        console.log("Subject:", options.subject);
        
        // Find 6-digit code in the subject or body
        const codeMatch = options.subject.match(/\d{6}/) || options.html.match(/>(\d{6})</);
        if (codeMatch) {
          console.log("\x1b[32m%s\x1b[0m", "Verification Code:", codeMatch[0]);
        }

        // Keep link logging but make it more specific to avoid matching font links
        const linkMatch = options.html.match(/href="([^"]+(?:verify|reset|confirm)[^"]+)"/);
        if (linkMatch) {
          console.log("\x1b[32m%s\x1b[0m", "Action Link:", linkMatch[1]);
        }
        console.log("--- END DEV EMAIL ---");
        return { messageId: "dev-mock-id" };
      }
    } as any;
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
  const name = username || "there";
  const codeArray = token.split("");

  console.log("[Email] Sending verification email to:", to);
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${token} is your verification code - Prepetual`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Funnel+Display:wght@800&display=swap" rel="stylesheet">
        <style>
          @media only screen and (max-width: 600px) {
            .container { padding: 20px !important; }
            .content { padding: 30px 20px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 10px;" class="container">
              <table role="presentation" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #FACC15; padding: 40px 40px; text-align: center;">
                    <div style="display: inline-block; background-color: #ffffff; padding: 12px; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                      <img src="https://prepetual.app/favicon.png" alt="Prepetual Logo" style="width: 32px; height: 32px; display: block;">
                    </div>
                    <h1 style="margin: 0; color: #171717; font-size: 28px; font-weight: 800; letter-spacing: -1px; font-family: 'Funnel Display', sans-serif;">prepetual</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;" class="content">
                    <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700; font-family: 'Funnel Display', sans-serif;">Welcome aboard, ${name}!</h2>
                    <p style="margin: 0 0 32px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      You're just one step away from unlocking the power of AI-generated quizzes. Use the verification code below to get started.
                    </p>
                    
                    <!-- Code Display -->
                    <div style="margin: 40px 0; text-align: center;">
                      <div style="display: inline-block; padding: 20px 32px; background-color: #f8fafc; border: 2px dashed #FACC15; border-radius: 20px;">
                        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0f172a;">${token}</span>
                      </div>
                      <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Verification Code</p>
                    </div>

                    <div style="margin-top: 40px; padding: 20px; background-color: #fffbeb; border-radius: 16px; border: 1px solid #fef3c7;">
                       <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500; text-align: center;">
                         This code will expire in 24 hours.
                       </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">
                    <div style="text-align: center; margin-bottom: 16px;">
                      <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Follow your progress</span>
                    </div>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
                      Didn't sign up for Prepetual? You can safely ignore this email.<br>
                      &copy; ${new Date().getFullYear()} Prepetual. All rights reserved.
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
  resetLink: string,
  username?: string
): Promise<void> {
  const name = username || "there";

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Prepetual" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Reset your Prepetual password`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Funnel+Display:wght@800&display=swap" rel="stylesheet">
        <style>
          @media only screen and (max-width: 600px) {
            .container { padding: 20px !important; }
            .content { padding: 30px 20px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 10px;" class="container">
              <table role="presentation" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background-color: #FACC15; padding: 40px 40px; text-align: center;">
                    <div style="display: inline-block; background-color: #ffffff; padding: 12px; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                      <img src="https://prepetual.app/favicon.png" alt="Prepetual Logo" style="width: 32px; height: 32px; display: block;">
                    </div>
                    <h1 style="margin: 0; color: #171717; font-size: 28px; font-weight: 800; letter-spacing: -1px; font-family: 'Funnel Display', sans-serif;">prepetual</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;" class="content">
                    <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700; font-family: 'Funnel Display', sans-serif;">Reset your password</h2>
                    <p style="margin: 0 0 8px 0; color: #475569; font-size: 16px; line-height: 1.6; font-weight: 500;">Hi ${name},</p>
                    <p style="margin: 0 0 40px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to choose a new one.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 0 0 40px 0;">
                      <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #FACC15; color: #171717; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 14px; letter-spacing: -0.2px;">
                        Reset My Password
                      </a>
                    </div>

                    <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 13px; text-align: center;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center; word-break: break-all; background-color: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
                      ${resetLink}
                    </p>

                    <div style="margin-top: 40px; padding: 20px; background-color: #fff1f2; border-radius: 16px; border: 1px solid #ffe4e6;">
                       <p style="margin: 0; color: #be123c; font-size: 14px; font-weight: 500; text-align: center;">
                         This link will expire in 1 hour.
                       </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
                      Didn't request a password reset? You can safely ignore this email.<br>
                      &copy; ${new Date().getFullYear()} Prepetual. All rights reserved.
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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Funnel+Display:wght@800&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'DM Sans', sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
            <div style="background-color: #FACC15; padding: 32px; text-align: center;">
              <h2 style="margin: 0; color: #171717; font-family: 'Funnel Display', sans-serif; font-size: 24px;">Message Received!</h2>
            </div>
            <div style="padding: 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a; font-weight: 700;">Hi ${data.name},</p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Thanks for reaching out to Prepetual. We've received your message about "<strong>${data.subject}</strong>" and will get back to you as soon as possible.
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">This is an automated confirmation. No need to reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error("Failed to send contact confirmation email:", err);
  }
}

export async function sendBugReportEmail(data: {
  userId: string;
  quizId: string;
  questionId: string;
  questionText: string;
  reportReason: string;
  details?: string;
  userEmail?: string;
}): Promise<void> {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Prepetual Bug Report" <${process.env.GMAIL_USER}>`,
    to: "giahienhn@gmail.com",
    subject: `Bug Report: ${data.reportReason}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ef4444;">New Question Bug Report</h2>
        <p><strong>User ID:</strong> ${data.userId}</p>
        <p><strong>User Email:</strong> ${data.userEmail || "N/A"}</p>
        <p><strong>Quiz ID:</strong> ${data.quizId}</p>
        <p><strong>Question ID:</strong> ${data.questionId}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Issue:</strong> ${data.reportReason}</p>
        <p><strong>Question Text:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ddd;">${data.questionText}</blockquote>
        ${data.details ? `<p><strong>Additional Details:</strong></p><p>${data.details}</p>` : ""}
      </div>
    `,
  });
}
