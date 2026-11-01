import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { AppError } from "../lib/errors.js";

const handler = (_req: unknown, _res: unknown, next: (error: AppError) => void) =>
  next(new AppError(429, "RATE_LIMITED", "Too many attempts. Please try again later."));

/** Counts failed attempts only, so a working admin is never locked out. */
export const createAuthLimiter = (limit: number) =>
  rateLimit({
    windowMs: 15 * 60_000,
    limit,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler,
  });

/**
 * Keyed on the account under attack. The IP limiter alone can be dodged wherever
 * X-Forwarded-For reaches us unsanitised (Next rewrites pass it through), so this
 * is the limit that holds regardless of the client's claimed address. The cost is
 * that an attacker can lock an account's sign-in for the 15 minute window.
 */
export const createAccountLimiter = (limit: number) =>
  rateLimit({
    windowMs: 15 * 60_000,
    limit,
    skipSuccessfulRequests: true,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: Request) =>
      req.admin?.id ?? String(req.body?.email ?? "").trim().toLowerCase().slice(0, 254),
    handler,
  });

export const createApiLimiter = (limit: number) =>
  rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler,
  });
