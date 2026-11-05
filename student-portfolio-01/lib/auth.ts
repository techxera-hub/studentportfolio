// lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Secret for signing JWTs – should be set via env var in production
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Hard‑coded admin credentials (hash generated with bcryptjs)
export const ADMIN_USER = {
  email: "student1techxera@gmail.com",
  // bcrypt hash for "Student1@2026"
  passwordHash:
    "$2a$10$uM6fG6X4lXK7xGkN2E3Xue3xYFhTqGqkGgYjWzF9rN3E8Pz7pU6y6",
};

/** Generate a JWT for the given email */
export function signToken(email: string) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "12h" });
}

/** Verify a JWT and return its payload */
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { email: string };
}

/** Validate admin credentials */
export async function validateCredentials(
  email: string,
  password: string
) {
  if (email !== ADMIN_USER.email) return false;
  return await bcrypt.compare(password, ADMIN_USER.passwordHash);
}

