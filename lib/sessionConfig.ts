export const COOKIE_NAME = "gym_auth_session";

const rawSecret = process.env.SESSION_SECRET;

if (!rawSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL SECURITY ERROR: SESSION_SECRET environment variable is missing in production.");
  }
}

export const SESSION_SECRET_STRING = rawSecret || "gym-dev-only-secret-do-not-use-in-production-123456789";

export const JWT_SECRET = new TextEncoder().encode(SESSION_SECRET_STRING);

export interface SessionPayload {
  userId: string;
  username: string;
  role: "STAFF" | "SUPER_ADMIN";
  branchId?: string | null;
  name?: string | null;
  expiresAt?: number;
}
