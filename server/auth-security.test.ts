import assert from "node:assert/strict";
import test from "node:test";

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

test("generates cryptographically random six-digit verification codes", () => {
  const codes = new Set(Array.from({ length: 100 }, generateVerificationCode));
  assert.equal(codes.size > 1, true);
  for (const code of codes) {
    assert.match(code, /^\d{6}$/);
  }
});

test("builds password reset links only from a configured application origin", () => {
  const baseUrl = getTrustedAppBaseUrl("https://prepetual.app/some/path/", "production");
  assert.equal(baseUrl, "https://prepetual.app");
  assert.equal(
    buildPasswordResetUrl(baseUrl, "token_with-special"),
    "https://prepetual.app/reset-password?token=token_with-special",
  );
});

test("rejects missing or insecure production application URLs", () => {
  assert.throws(() => getTrustedAppBaseUrl(undefined, "production"), /APP_URL must be configured/);
  assert.throws(() => getTrustedAppBaseUrl("http://prepetual.app", "production"), /must use https/);
  assert.throws(() => getTrustedAppBaseUrl("https://prepetual.app?redirect=evil", "production"), /query string/);
});

test("requires strong production session configuration", () => {
  assert.throws(
    () => validateAuthConfiguration({ NODE_ENV: "production", SESSION_SECRET: "too-short", APP_URL: "https://prepetual.app" }),
    /at least 32 characters/,
  );
  assert.equal(
    validateAuthConfiguration({
      NODE_ENV: "production",
      SESSION_SECRET: "a".repeat(32),
      APP_URL: "https://prepetual.app",
    }),
    "a".repeat(32),
  );
});

test("normalizes account subjects and prefers an authenticated session", () => {
  assert.equal(
    getEmailRateLimitSubject({ body: { email: "  User@Example.COM " }, ip: "1.2.3.4" } as any),
    "email:user@example.com",
  );
  assert.equal(
    getResetTokenRateLimitSubject({ body: { token: " reset-token " }, ip: "1.2.3.4" } as any),
    "reset-token:reset-token",
  );
  assert.equal(
    getSessionRateLimitSubject({ session: { userId: "user-1" }, ip: "1.2.3.4" } as any),
    "user:user-1",
  );
});

test("regenerates and saves a session before authenticating it", async () => {
  const events: string[] = [];
  const req = {
    headers: { "user-agent": "browser-agent".repeat(60) },
    session: {
      userId: "attacker-controlled",
      regenerate(callback: (error?: Error) => void) {
        events.push("regenerate");
        this.userId = undefined;
        callback();
      },
      save(callback: (error?: Error) => void) {
        events.push(`save:${this.userId}`);
        callback();
      },
    },
  } as any;

  await establishAuthenticatedSession(req, "real-user");

  assert.deepEqual(events, ["regenerate", "save:real-user"]);
  assert.equal(req.session.userId, "real-user");
  assert.equal(req.session.userAgent.length, 512);
  assert.equal(Number.isFinite(Date.parse(req.session.signedInAt)), true);
});

test("destroys the request session when credentials are reset", async () => {
  let destroyed = false;
  await destroyRequestSession({
    session: {
      destroy(callback: (error?: Error) => void) {
        destroyed = true;
        callback();
      },
    },
  } as any);
  assert.equal(destroyed, true);
});
