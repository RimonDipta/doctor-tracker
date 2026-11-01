import { Router } from "express";
import { getDashboardStats } from "./dashboard.service.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/stats", async (_req, res) => {
  res.json({ data: await getDashboardStats() });
});
