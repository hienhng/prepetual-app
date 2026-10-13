import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { createAccountSecurityHandlers, summarizeActiveSession } from "./account-security.js";

async function fixture(options: { googleOnly?: boolean; concurrentChange?: boolean; failRevocation?: boolean } = {}) {
  const passwordHash = options.googleOnly ? null : await bcrypt.hash("original-password", 4);
  const calls: string[] = [];
  let savedHash: string | undefined;
  const user = { id: "owner", email: "owner@example.test", emailVerified: false, passwordHash, googleId: options.googleOnly ? "google-sub" : null };
  const handlers = createAccountSecurityHandlers({
    getUser: async userId => userId === user.id ? user : undefined,
    getSessions: async (userId, currentId) => {
      assert.equal(userId, "owner");
      assert.equal(currentId, "private-session-id");
      return [summarizeActiveSession({ id: currentId, data: {}, expiresAt: new Date("2026-11-01T00:00:00Z") }, currentId)];
    },
    changePassword: async (userId, expectedHash, nextHash) => {
      assert.equal(userId, "owner");
      assert.equal(expectedHash, passwordHash);
      calls.push("change-password");
      if (options.concurrentChange) return false;
      savedHash = nextHash;
      calls.push("revoke-owner-sessions");
      return true;
    },
    revokeSessions: async userId => {
      assert.equal(userId, "owner");
      if (options.failRevocation) throw new Error("Revocation failed");
      calls.push("revoke-owner-sessions");
    },
  });
  const req = {
    sessionID: "private-session-id",
    session: {
      userId: "owner" as string | undefined,
      destroy(callback: (error?: Error) => void) { calls.push("destroy-current-session"); callback(); },
    },
    body: { currentPassword: "original-password", newPassword: "replacement-password", userId: "another-user" } as any,
  };
  const res = {
    statusCode: 200,
    body: undefined as any,
    headers: new Map<string, string>(),
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
    setHeader(name: string, value: string) { this.headers.set(name, value); },
    clearCookie(name: string) { calls.push(`clear-cookie:${name}`); },
  };
  const invoke = (name: keyof typeof handlers) => handlers[name](req as any, res as any, () => {});
  return { req, res, calls, invoke, get savedHash() { return savedHash; } };
}

test("security endpoints require authentication before reading or changing account data", async () => {
  for (const name of ["getSecurity", "changePassword", "logoutAll"] as const) {
    const f = await fixture();
    f.req.session.userId = undefined;
    await f.invoke(name);
    assert.equal(f.res.statusCode, 401);
    assert.deepEqual(f.calls, []);
  }
});

test("account security exposes capabilities and sessions without credentials", async () => {
  const f = await fixture();
  await f.invoke("getSecurity");
  assert.equal(f.res.statusCode, 200);
  assert.equal(f.res.body.hasPassword, true);
  assert.equal(f.res.body.googleConnected, false);
  assert.equal(f.res.body.sessions[0].current, true);
  assert.equal(f.res.headers.get("Cache-Control"), "no-store");
  const serialized = JSON.stringify(f.res.body);
  assert.equal(serialized.includes("private-session-id"), false);
  assert.equal(serialized.includes("passwordHash"), false);
  assert.equal(serialized.includes("google-sub"), false);
});

test("wrong current passwords and reused passwords cannot change credentials or end sessions", async () => {
  for (const body of [
    { currentPassword: "wrong-password", newPassword: "replacement-password" },
    { currentPassword: "original-password", newPassword: "original-password" },
  ]) {
    const f = await fixture();
    f.req.body = body;
    await f.invoke("changePassword");
    assert.equal(f.res.statusCode, 400);
    assert.deepEqual(f.calls, []);
  }
});

test("validates password types, length, and bcrypt's UTF-8 byte limit", async () => {
  for (const newPassword of [undefined, 12345, "short", "a".repeat(73), "🔑".repeat(19)]) {
    const f = await fixture();
    f.req.body.newPassword = newPassword;
    await f.invoke("changePassword");
    assert.equal(f.res.statusCode, 400);
    assert.deepEqual(f.calls, []);
  }
  const f = await fixture();
  f.req.body = null;
  await f.invoke("changePassword");
  assert.equal(f.res.statusCode, 400);
});

test("Google-only accounts expose Google status and cannot use password change", async () => {
  const f = await fixture({ googleOnly: true });
  await f.invoke("getSecurity");
  assert.equal(f.res.body.hasPassword, false);
  assert.equal(f.res.body.googleConnected, true);
  await f.invoke("changePassword");
  assert.equal(f.res.statusCode, 400);
  assert.deepEqual(f.calls, []);
});

test("changes only the authenticated user's password, revokes sessions, and clears the cookie", async () => {
  const f = await fixture();
  await f.invoke("changePassword");
  assert.equal(f.res.statusCode, 200);
  assert.ok(f.savedHash);
  assert.equal(await bcrypt.compare("replacement-password", f.savedHash), true);
  assert.equal(await bcrypt.compare("original-password", f.savedHash), false);
  assert.deepEqual(f.calls, ["change-password", "revoke-owner-sessions", "destroy-current-session", "clear-cookie:connect.sid"]);
});

test("a concurrent password change is rejected without overwriting credentials", async () => {
  const f = await fixture({ concurrentChange: true });
  await f.invoke("changePassword");
  assert.equal(f.res.statusCode, 409);
  assert.equal(f.savedHash, undefined);
  assert.deepEqual(f.calls, ["change-password"]);
});

test("sign-out-all ignores a supplied target user and revokes only the session owner", async () => {
  const f = await fixture();
  await f.invoke("logoutAll");
  assert.equal(f.res.statusCode, 200);
  assert.deepEqual(f.calls, ["revoke-owner-sessions", "destroy-current-session", "clear-cookie:connect.sid"]);
});

test("a failed revocation does not report successful sign-out", async () => {
  const f = await fixture({ failRevocation: true });
  await f.invoke("logoutAll");
  assert.equal(f.res.statusCode, 500);
  assert.deepEqual(f.calls, []);
});

test("session summaries identify devices, handle legacy sessions, and never expose IDs or raw metadata", () => {
  const expiresAt = new Date("2026-11-01T00:00:00Z");
  const edge = summarizeActiveSession({ id: "secret", data: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0 Safari/537.36 Edg/140.0",
    signedInAt: "2026-10-13T12:00:00Z", userId: "owner", cookie: { secret: "private-cookie" },
  }, expiresAt }, "secret");
  assert.deepEqual(edge, { browser: "Edge", platform: "Windows", signedInAt: "2026-10-13T12:00:00.000Z", expiresAt: "2026-11-01T00:00:00.000Z", current: true });
  const mobile = summarizeActiveSession({ id: "mobile", data: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/140.0 Safari/604.1" }, expiresAt }, "secret");
  assert.equal(mobile.browser, "Chrome");
  assert.equal(mobile.platform, "iOS");
  assert.equal(mobile.current, false);
  const legacy = summarizeActiveSession({ id: "legacy", data: { signedInAt: "invalid-date" }, expiresAt }, "secret");
  assert.equal(legacy.browser, null);
  assert.equal(legacy.platform, null);
  assert.equal(legacy.signedInAt, null);
});
