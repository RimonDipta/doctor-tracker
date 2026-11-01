import type { Types } from "mongoose";
import type { Request } from "express";
import { Activity, type ActivityDoc } from "../../models/activity.model.js";

type Entry = Pick<ActivityDoc, "action" | "entityType" | "label"> & {
  entityId: Types.ObjectId;
  detail?: string;
};

/** The audit trail must never fail the write it describes. */
export async function logActivity(req: Request, entry: Entry) {
  try {
    await Activity.create({ ...entry, actorName: req.admin?.name ?? "System" });
  } catch (error) {
    console.error("Failed to write activity log", error);
  }
}

export async function recentActivity(limit: number) {
  const rows = await Activity.find().sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId.toString(),
    label: row.label,
    detail: row.detail ?? null,
    actorName: row.actorName,
    createdAt: row.createdAt,
  }));
}
