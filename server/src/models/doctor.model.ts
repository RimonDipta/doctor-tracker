import { Schema, model, type InferSchemaType } from "mongoose";
import { CI_COLLATION } from "../lib/query.js";

export const DOCTOR_STATUSES = ["active", "on_leave", "inactive"] as const;

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: DOCTOR_STATUSES, default: "active", required: true },
  },
  { timestamps: true },
);

doctorSchema.index({ name: 1 }, { collation: CI_COLLATION });
doctorSchema.index({ specialization: 1 }, { collation: CI_COLLATION });
doctorSchema.index({ hospital: 1 }, { collation: CI_COLLATION });
doctorSchema.index({ status: 1 });
doctorSchema.index({ createdAt: -1 });

export type DoctorDoc = InferSchemaType<typeof doctorSchema>;
export const Doctor = model("Doctor", doctorSchema);
