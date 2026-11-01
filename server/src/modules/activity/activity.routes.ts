import { Router } from "express";
import { z } from "zod";
import { recentActivity } from "./activity.service.js";

export const activityRoutes = Router();

activityRoutes.get("/", async (req, res) => {
  const { limit } = z
    .object({ limit: z.coerce.number().int().min(1).max(50).default(10) })
    .parse(req.query);
  res.json({ data: await recentActivity(limit) });
});
