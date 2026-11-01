import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { unauthorized } from "../lib/errors.js";
import { Admin } from "../models/admin.model.js";
import { Session } from "../models/session.model.js";

export const SESSION_COOKIE = "dt_session";
export const SESSION_TTL_MS = env.SESSION_TTL_DAYS * 86_400_000;

export interface AuthedAdmin {
  id: string;
  name: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    admin?: AuthedAdmin;
    sessionId?: string;
  }
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax" as const,
  path: "/",
});

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || !token) throw unauthorized();

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) throw unauthorized("Your session has expired");

  const admin = await Admin.findById(session.admin).lean();
  if (!admin) throw unauthorized("Your session has expired");

  // Sliding expiry: renew once the session is past half its lifetime.
  if (session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS / 2) {
    await Session.updateOne(
      { _id: session._id },
      { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    );
    setSessionCookie(res, token);
  }

  req.admin = { id: admin._id.toString(), name: admin.name, email: admin.email };
  req.sessionId = session._id.toString();
  next();
}
