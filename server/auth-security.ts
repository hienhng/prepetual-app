import crypto from "node:crypto";
import type { Request } from "express";

import { getRateLimitSubject } from "./rate-limit.js";

const MIN_PRODUCTION_SESSION_SECRET_LENGTH = 32;

export function generateVerificationCode(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export function getEmailRateLimitSubject(req: Request): string {
  const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
  const email = rawEmail.trim().toLowerCase().slice(0, 320);
  return email ? `email:${email}` : getRateLimitSubject(req);
}

export function getResetTokenRateLimitSubject(req: Request): string {
  const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
  const token = rawToken.trim().slice(0, 64);
  return token ? `reset-token:${token}` : getRateLimitSubject(req);
}

export function getSessionRateLimitSubject(req: Request): string {
  const userId = req.session?.userId;
  return userId ? `user:${userId}` : getRateLimitSubject(req);
}

export function getTrustedAppBaseUrl(
  appUrl: string | undefined,
  nodeEnv = process.env.NODE_ENV,
): string {
  if (!appUrl?.trim()) {
    throw new Error("APP_URL must be configured for password reset links");
  }

  let parsed: URL;
  try {
    parsed = new URL(appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("APP_URL must use http or https");
  }
  if (nodeEnv === "production" && parsed.protocol !== "https:") {
    throw new Error("APP_URL must use https in production");
  }
  if (parsed.username || parsed.password) {
    throw new Error("APP_URL must not contain credentials");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("APP_URL must not contain a query string or fragment");
  }

  return parsed.origin;
}

export function buildPasswordResetUrl(appUrl: string, token: string): string {
  const resetUrl = new URL("/reset-password", appUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

export function validateAuthConfiguration(env: NodeJS.ProcessEnv): string {
  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  if (
    env.NODE_ENV === "production" &&
    sessionSecret.length < MIN_PRODUCTION_SESSION_SECRET_LENGTH
  ) {
    throw new Error(
      `SESSION_SECRET must contain at least ${MIN_PRODUCTION_SESSION_SECRET_LENGTH} characters in production`,
    );
  }
  if (env.NODE_ENV === "production") {
    getTrustedAppBaseUrl(env.APP_URL, env.NODE_ENV);
  }

  return sessionSecret;
}

export async function establishAuthenticatedSession(
  req: Request,
  userId: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.userId = userId;
      req.session.save((saveError) => {
        if (saveError) reject(saveError);
        else resolve();
      });
    });
  });
}

export async function destroyRequestSession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
