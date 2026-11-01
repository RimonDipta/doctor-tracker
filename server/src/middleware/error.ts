import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

const isDuplicateKey = (error: unknown): error is { code: 11000; keyPattern?: object } =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", `No route for ${req.method} ${req.path}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      fieldErrors[key] ??= issue.message;
    }
    return void res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Please check the highlighted fields", details: { fieldErrors } },
    });
  }

  if (isDuplicateKey(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? "value";
    return void res.status(409).json({
      error: {
        code: "DUPLICATE",
        message: `That ${field} is already in use`,
        details: { fieldErrors: { [field]: `That ${field} is already in use` } },
      },
    });
  }

  if (error instanceof AppError) {
    return void res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message, details: error.details } });
  }

  // Malformed JSON and oversized bodies from express.json()
  const status = (error as { status?: number }).status;
  if (status && status >= 400 && status < 500) {
    return void res.status(status).json({ error: { code: "BAD_REQUEST", message: "Invalid request" } });
  }

  if (env.NODE_ENV !== "test") console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
}
