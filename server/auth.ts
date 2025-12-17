import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import cryptoRandomString from "crypto-random-string";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { registerSchema, loginSchema } from "@shared/schema";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function setupAuth(app: Express): void {
  const sessionSettings: session.SessionOptions = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { email, password, firstName, lastName } = validation.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        authProvider: "email",
        emailVerified: false,
      });

      // Try to create verification token and send email
      // If email fails, auto-verify the user so they can still use the app
      let emailSent = false;
      try {
        const token = cryptoRandomString({ length: 64, type: "url-safe" });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.createVerificationToken(user.id, token, "email_verification", expiresAt);
        await sendVerificationEmail(email, token, firstName);
        emailSent = true;
      } catch (err: any) {
        console.error("Failed to send verification email:", err);
        // Auto-verify user since we can't send email
        await storage.verifyUserEmail(user.id);
        user.emailVerified = true;
      }

      req.session.userId = user.id;

      res.json({
        message: emailSent 
          ? "Registration successful. Please check your email to verify your account."
          : "Registration successful! Your account is ready to use.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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
        return res.status(401).json({
          message: "This account uses Google sign-in. Please use Google to log in.",
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid token" });
      }

      const verificationToken = await storage.getVerificationToken(token);
      if (!verificationToken || verificationToken.type !== "email_verification") {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      await storage.verifyUserEmail(verificationToken.userId);
      await storage.deleteVerificationToken(token);

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (user && user.passwordHash) {
        const token = cryptoRandomString({ length: 64, type: "url-safe" });
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await storage.createVerificationToken(user.id, token, "password_reset", expiresAt);

        try {
          await sendPasswordResetEmail(email, token, user.firstName || undefined);
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

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const verificationToken = await storage.getVerificationToken(token);
      if (!verificationToken || verificationToken.type !== "password_reset") {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await storage.updateUser(verificationToken.userId, { passwordHash });
      await storage.deleteVerificationToken(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Reset failed" });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) {
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
          user = await storage.createUser({
            email: payload.email,
            firstName: payload.given_name || null,
            lastName: payload.family_name || null,
            profileImageUrl: payload.picture || null,
            googleId: payload.sub,
            authProvider: "google",
            emailVerified: true,
          });
        }
      }

      if (user) {
        req.session.userId = user.id;
        res.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
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
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      try {
        const token = cryptoRandomString({ length: 64, type: "url-safe" });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.createVerificationToken(user.id, token, "email_verification", expiresAt);
        await sendVerificationEmail(email, token, user.firstName || undefined);
        res.json({ message: "Verification email sent successfully" });
      } catch (emailError: any) {
        console.error("Failed to send verification email:", emailError);
        res.status(500).json({ 
          message: "Failed to send verification email. Please try again later.",
          debug: emailError?.message || "Unknown error"
        });
      }
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
