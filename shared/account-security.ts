export interface ActiveSession {
  browser: string | null;
  platform: string | null;
  signedInAt: string | null;
  expiresAt: string;
  current: boolean;
}

export interface AccountSecuritySettings {
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  googleConnected: boolean;
  sessions: ActiveSession[];
}
