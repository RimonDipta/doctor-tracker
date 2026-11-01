import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence in depth on top of SameSite=Lax: browsers always send Origin on
 * cross-site writes, so a foreign Origin is refused. Non-browser clients send none.
 */
export function originGuard(req: Request, _res: Response, next: NextFunction) {
  const origin = req.get("origin");
  if (!SAFE_METHODS.has(req.method) && origin && !env.CLIENT_ORIGINS.includes(origin)) {
    throw new AppError(403, "FORBIDDEN_ORIGIN", "Request origin is not allowed");
  }
  next();
}
