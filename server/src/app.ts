import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { originGuard } from "./middleware/origin-guard.js";
import { createAccountLimiter, createApiLimiter, createAuthLimiter } from "./middleware/rate-limit.js";
import { activityRoutes } from "./modules/activity/activity.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { doctorRoutes } from "./modules/doctors/doctors.routes.js";
import { patientRoutes } from "./modules/patients/patients.routes.js";
import { searchRoutes } from "./modules/search/search.routes.js";

interface AppOptions {
  authAttemptLimit?: number;
  accountAttemptLimit?: number;
  apiRequestLimit?: number;
}

export function createApp({
  authAttemptLimit = 10,
  accountAttemptLimit = 20,
  apiRequestLimit = 600,
}: AppOptions = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGINS, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if (env.NODE_ENV === "development") app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(database === "connected" ? 200 : 503).json({ data: { status: "ok", database } });
  });

  app.use("/api", originGuard, createApiLimiter(apiRequestLimit));
  app.use(
    "/api/auth",
    authRoutes(createAuthLimiter(authAttemptLimit), createAccountLimiter(accountAttemptLimit)),
  );
  app.use("/api/doctors", requireAuth, doctorRoutes);
  app.use("/api/patients", requireAuth, patientRoutes);
  app.use("/api/dashboard", requireAuth, dashboardRoutes);
  app.use("/api/activity", requireAuth, activityRoutes);
  app.use("/api/search", requireAuth, searchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
