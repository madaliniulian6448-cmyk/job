import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "shared/src/schema";
import { eq } from "drizzle-orm";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "auth_token";

export interface AuthPayload {
  userId: number;
  role: "user" | "admin";
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Neautentificat" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Sesiune invalidă" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      req.auth = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      // ignore invalid token
    }
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(403).json({ error: "Acces interzis" });
  }
  // Re-check role from DB so a demotion takes effect immediately,
  // rather than waiting for the 30-day JWT to expire.
  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, req.auth.userId))
      .limit(1);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Acces interzis" });
    }
    next();
  } catch {
    return res.status(500).json({ error: "Eroare de server" });
  }
}

export { COOKIE_NAME };
