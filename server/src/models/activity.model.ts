import { Schema, model, type InferSchemaType } from "mongoose";

const NINETY_DAYS = 60 * 60 * 24 * 90;

const activitySchema = new Schema(
  {
    action: { type: String, enum: ["created", "updated", "deleted", "reassigned"], required: true },
    entityType: { type: String, enum: ["doctor", "patient"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    label: { type: String, required: true },
    detail: { type: String },
    actorName: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Log entries hold patient names, so they expire rather than accumulate.
activitySchema.index({ createdAt: -1 }, { expireAfterSeconds: NINETY_DAYS });

export type ActivityDoc = InferSchemaType<typeof activitySchema>;
export const Activity = model("Activity", activitySchema);
