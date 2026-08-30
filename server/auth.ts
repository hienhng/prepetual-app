import type { Express, Request, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import cryptoRandomString from "crypto-random-string";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.js";
import { users, verificationTokens, registerSchema, loginSchema } from "../shared/schema.js";
import { db } from "./db.js";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  buildPasswordResetUrl,
  destroyRequestSession,
  establishAuthenticatedSession,
  generateVerificationCode,
  getEmailRateLimitSubject,
  getResetTokenRateLimitSubject,
  getSessionRateLimitSubject,
  getTrustedAppBaseUrl,
  validateAuthConfiguration,
} from "./auth-security.js";
import { createRateLimitMiddleware, readPositiveIntegerEnv } from "./rate-limit.js";
import { postgresRateLimitStore } from "./postgres-rate-limit-store.js";

const PgSession = connectPgSimple(session);

class InvalidPasswordResetTokenError extends Error {}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function setupAuth(app: Express): void {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = validateAuthConfiguration(process.env);
  const authWindowMs = readPositiveIntegerEnv("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000);
  const emailWindowMs = readPositiveIntegerEnv("AUTH_EMAIL_RATE_LIMIT_WINDOW_MS", 60 * 60 * 1000);
  const createAuthLimiter = (
    scope: string,
    envName: string,
    fallback: number,
    windowMs: number,
    subject?: (req: Request) => string,
  ) => createRateLimitMiddleware({
    scope,
    limit: readPositiveIntegerEnv(envName, fallback),
    windowMs,
    store: postgresRateLimitStore,
    subject,
    limitMessage: "Too many attempts. Please wait before trying again.",
    unavailableMessage: "Authentication controls are temporarily unavailable. Please try again shortly.",
  });

  const registerRateLimit = createAuthLimiter("auth-register-ip", "AUTH_REGISTER_RATE_LIMIT", 5, emailWindowMs);
  const loginIpRateLimit = createAuthLimiter("auth-login-ip", "AUTH_LOGIN_IP_RATE_LIMIT", 30, authWindowMs);
  const loginAccountRateLimit = createAuthLimiter("auth-login-account", "AUTH_LOGIN_ACCOUNT_RATE_LIMIT", 10, authWindowMs, getEmailRateLimitSubject);
  const verifyRateLimit = createAuthLimiter("auth-verify", "AUTH_VERIFY_RATE_LIMIT", 10, authWindowMs, getSessionRateLimitSubject);
  const forgotIpRateLimit = createAuthLimiter("auth-forgot-ip", "AUTH_FORGOT_IP_RATE_LIMIT", 10, emailWindowMs);
  const forgotAccountRateLimit = createAuthLimiter("auth-forgot-account", "AUTH_FORGOT_ACCOUNT_RATE_LIMIT", 3, emailWindowMs, getEmailRateLimitSubject);
  const resetIpRateLimit = createAuthLimiter("auth-reset-ip", "AUTH_RESET_IP_RATE_LIMIT", 10, authWindowMs);
  const resetTokenRateLimit = createAuthLimiter("auth-reset-token", "AUTH_RESET_TOKEN_RATE_LIMIT", 5, authWindowMs, getResetTokenRateLimitSubject);
  const googleRateLimit = createAuthLimiter("auth-google-ip", "AUTH_GOOGLE_RATE_LIMIT", 30, authWindowMs);
  const resendIpRateLimit = createAuthLimiter("auth-resend-ip", "AUTH_RESEND_IP_RATE_LIMIT", 10, emailWindowMs);
  const resendAccountRateLimit = createAuthLimiter("auth-resend-account", "AUTH_RESEND_ACCOUNT_RATE_LIMIT", 3, emailWindowMs, getEmailRateLimitSubject);

  const sessionSettings: session.SessionOptions = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    proxy: isProduction,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  app.post("/api/auth/register", registerRateLimit, async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { email, password } = validation.data;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "An account with this email already exists. Please sign in or reset your password.",
        });
      }

      // Default username from email prefix
      let username = email.split("@")[0];
      
      // Check if username is already taken and append random string if it is
      const isUsernameTaken = async (name: string): Promise<boolean> => {
        const usersByUsername = await db.select().from(users).where(eq(users.username, name)).limit(1);
        return usersByUsername.length > 0;
      };

      let finalUsername = username;
      let counter = 1;
      while (await isUsernameTaken(finalUsername)) {
        finalUsername = `${username}${cryptoRandomString({ length: 4, type: "numeric" })}`;
        counter++;
        if (counter > 5) {
          finalUsername = `${username}_${cryptoRandomString({ length: 4, type: "distinguishable" })}`;
          break;
        }
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await storage.createUser({
        email,
        username: finalUsername,
        passwordHash,
        authProvider: "email",
        emailVerified: false,
      });

      // Create 6-digit verification code and send email
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.deleteUserVerificationTokens(user.id, "email_verification");
      await storage.createVerificationToken(user.id, code, "email_verification", expiresAt);
      await sendVerificationEmail(email, code, user.username || undefined);

      await establishAuthenticatedSession(req, user.id);

      res.json({
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", loginIpRateLimit, loginAccountRateLimit, async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { email, password } = validation.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      await establishAuthenticatedSession(req, user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid", { path: "/" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/verify-email", verifyRateLimit, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { code } = req.body;
      if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: "Invalid code" });
      }

      const verificationToken = await storage.getVerificationTokenByUserId(
        req.session.userId,
        code,
        "email_verification"
      );

      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      await storage.verifyUserEmail(req.session.userId);
      await storage.deleteUserVerificationTokens(req.session.userId, "email_verification");

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/forgot-password", forgotIpRateLimit, forgotAccountRateLimit, async (req, res) => {
    try {
      const { email } = req.body;
      const emailValidation = registerSchema.shape.email.safeParse(email);
      if (!emailValidation.success) {
        return res.status(400).json({ message: "A valid email is required" });
      }

      let appBaseUrl: string;
      try {
        appBaseUrl = getTrustedAppBaseUrl(process.env.APP_URL, process.env.NODE_ENV);
      } catch (configurationError) {
        console.error("Password reset configuration error:", configurationError);
        return res.status(503).json({ message: "Password reset is temporarily unavailable" });
      }

      const validatedEmail = emailValidation.data;
      const user = await storage.getUserByEmail(validatedEmail);
      if (user && user.passwordHash) {
        const token = cryptoRandomString({ length: 48, type: "url-safe" });
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await storage.deleteUserVerificationTokens(user.id, "password_reset");
        await storage.createVerificationToken(user.id, token, "password_reset", expiresAt);

        const resetLink = buildPasswordResetUrl(appBaseUrl, token);

        try {
          await sendPasswordResetEmail(validatedEmail, resetLink, user.username || undefined);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
        }
      }

      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Request failed" });
    }
  });

  app.post("/api/auth/reset-password", resetIpRateLimit, resetTokenRateLimit, async (req, res) => {
    try {
      const { token, password } = req.body;
      if (typeof token !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      if (password.length > 128) {
        return res.status(400).json({ message: "Password is too long" });
      }
      if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      try {
        await db.transaction(async (tx) => {
          const [consumedToken] = await tx
            .delete(verificationTokens)
            .where(and(
              eq(verificationTokens.token, token),
              eq(verificationTokens.type, "password_reset"),
              gt(verificationTokens.expiresAt, new Date()),
            ))
            .returning({ userId: verificationTokens.userId });

          if (!consumedToken) {
            throw new InvalidPasswordResetTokenError();
          }

          await tx
            .update(users)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(users.id, consumedToken.userId));
          await tx.execute(sql`
            DELETE FROM sessions
            WHERE sess ->> 'userId' = ${consumedToken.userId}
          `);
        });
      } catch (error) {
        if (error instanceof InvalidPasswordResetTokenError) {
          return res.status(400).json({ message: "Invalid or expired token" });
        }
        throw error;
      }

      await destroyRequestSession(req);
      res.clearCookie("connect.sid", { path: "/" });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Reset failed" });
    }
  });

  app.post("/api/auth/google", googleRateLimit, async (req, res) => {
    try {
      const { credential } = req.body;
      if (typeof credential !== "string" || credential.length < 1 || credential.length > 20_000) {
        return res.status(400).json({ message: "Google credential is required" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ message: "Google sign-in is not configured" });
      }

      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ message: "Invalid Google credential" });
      }

      let user = await storage.getUserByGoogleId(payload.sub);

      if (!user) {
        user = await storage.getUserByEmail(payload.email);
        if (user) {
          await storage.updateUser(user.id, {
            googleId: payload.sub,
            profileImageUrl: payload.picture || user.profileImageUrl,
            emailVerified: true,
          });
          user = await storage.getUser(user.id);
        } else {
          // Use Google's name as the username
          const googleUsername = payload.name || payload.given_name || payload.email.split('@')[0];
          user = await storage.createUser({
            email: payload.email,
            username: googleUsername,
            profileImageUrl: payload.picture || null,
            googleId: payload.sub,
            authProvider: "google",
            emailVerified: true,
          });
        }
      }

      if (user) {
        await establishAuthenticatedSession(req, user.id);
        res.json({
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            emailVerified: user.emailVerified,
            profileImageUrl: user.profileImageUrl,
          },
        });
      } else {
        res.status(500).json({ message: "Failed to create or retrieve user" });
      }
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Google sign-in failed" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl,
        autoDeleteFiles: user.autoDeleteFiles || false,
        consecutiveCorrectConfetti: user.consecutiveCorrectConfetti !== false,
        skipRevisionQuestions: user.skipRevisionQuestions || false,
        onboardingCompleted: user.onboardingCompleted || false,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/resend-verification", resendIpRateLimit, resendAccountRateLimit, async (req, res) => {
    try {
      const { email } = req.body;
      const emailValidation = registerSchema.shape.email.safeParse(email);
      if (!emailValidation.success) {
        return res.status(400).json({ message: "A valid email is required" });
      }

      const genericResponse = {
        message: "If that account requires verification, a code has been sent.",
      };
      const validatedEmail = emailValidation.data;
      const user = await storage.getUserByEmail(validatedEmail);

      if (!user || user.emailVerified) {
        return res.json(genericResponse);
      }

      try {
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.deleteUserVerificationTokens(user.id, "email_verification");
        await storage.createVerificationToken(user.id, code, "email_verification", expiresAt);
        await sendVerificationEmail(validatedEmail, code, user.username || undefined);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
      res.json(genericResponse);
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  (req as any).user = { claims: { sub: req.session.userId } };
  next();
};

export const populateUser: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    (req as any).user = { claims: { sub: req.session.userId } };
  }
  next();
};
