import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { destroyRequestSession } from "./auth-security.js";
import type { ActiveSession } from "../shared/account-security.js";

export function summarizeActiveSession(
  session: { id: string; data: unknown; expiresAt: Date },
  currentSessionId: string,
): ActiveSession {
  const data = session.data as { userAgent?: unknown; signedInAt?: unknown } | null;
  const agent = typeof data?.userAgent === "string" ? data.userAgent : "";
  const browser = /Edg(?:e|A|iOS)?\//.test(agent) ? "Edge"
    : /(?:OPR|Opera)\//.test(agent) ? "Opera"
    : /(?:Firefox|FxiOS)\//.test(agent) ? "Firefox"
    : /(?:Chrome|CriOS)\//.test(agent) ? "Chrome"
    : /Safari\//.test(agent) ? "Safari" : null;
  const platform = /Android/.test(agent) ? "Android"
    : /iPhone|iPad|iPod/.test(agent) ? "iOS"
    : /Windows/.test(agent) ? "Windows"
    : /Macintosh|Mac OS X/.test(agent) ? "macOS"
    : /Linux/.test(agent) ? "Linux" : null;
  const signedInAt = typeof data?.signedInAt === "string" && Number.isFinite(Date.parse(data.signedInAt))
    ? new Date(data.signedInAt).toISOString() : null;
  // Never return the session ID: it is an authentication credential.
  return { browser, platform, signedInAt, expiresAt: session.expiresAt.toISOString(), current: session.id === currentSessionId };
}
type SecurityUser = {
  id: string;
  email: string;
  emailVerified: boolean | null;
  passwordHash: string | null;
  googleId: string | null;
};

interface AccountSecurityDependencies {
  getUser(userId: string): Promise<SecurityUser | undefined>;
  getSessions(userId: string, currentSessionId: string): Promise<ActiveSession[]>;
  // The expected hash prevents a concurrent password reset/change from being overwritten.
  changePassword(userId: string, expectedHash: string, passwordHash: string): Promise<boolean>;
  revokeSessions(userId: string): Promise<void>;
}

export function createAccountSecurityHandlers(dependencies: AccountSecurityDependencies) {
  const getSecurity: RequestHandler = async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Authentication required" });
    try {
      const user = await dependencies.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "Authentication required" });
      res.setHeader("Cache-Control", "no-store");
      res.json({
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        hasPassword: Boolean(user.passwordHash),
        googleConnected: Boolean(user.googleId),
        sessions: await dependencies.getSessions(user.id, req.sessionID),
      });
    } catch (error) {
      console.error("Get account security error:", error);
      res.status(500).json({ message: "Failed to load account security" });
    }
  };

  const changePassword: RequestHandler = async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 128 ||
        typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({ message: "Enter your current password and a new password of at least 8 characters (up to 72 UTF-8 bytes)." });
    }
    try {
      const user = await dependencies.getUser(userId);
      if (!user) return res.status(401).json({ message: "Authentication required" });
      if (!user.passwordHash) {
        return res.status(400).json({ message: "This account uses Google sign-in. Manage your password in your Google account." });
      }
      if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (await bcrypt.compare(newPassword, user.passwordHash)) {
        return res.status(400).json({ message: "Choose a different new password" });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      if (!await dependencies.changePassword(userId, user.passwordHash, passwordHash)) {
        return res.status(409).json({ message: "Your password changed during this request. Please sign in again." });
      }
      await destroyRequestSession(req);
      res.clearCookie("connect.sid", { path: "/" });
      res.json({ message: "Password changed. Please sign in again." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  };

  const logoutAll: RequestHandler = async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    try {
      await dependencies.revokeSessions(userId);
      await destroyRequestSession(req);
      res.clearCookie("connect.sid", { path: "/" });
      res.json({ message: "Signed out of all devices" });
    } catch (error) {
      console.error("Sign out all devices error:", error);
      res.status(500).json({ message: "Failed to sign out of all devices" });
    }
  };

  return { getSecurity, changePassword, logoutAll };
}
