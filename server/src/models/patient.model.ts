import { Schema, model, type InferSchemaType } from "mongoose";
import { CI_COLLATION } from "../lib/query.js";

export const PATIENT_STATUSES = ["active", "follow_up", "discharged"] as const;
export const PATIENT_GENDERS = ["female", "male", "other", "undisclosed"] as const;

const patientSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: PATIENT_GENDERS, required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    status: { type: String, enum: PATIENT_STATUSES, default: "active", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    registeredAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

// Leading `doctor` also serves counts and the per-doctor patient list.
patientSchema.index({ doctor: 1, registeredAt: -1 });
patientSchema.index({ registeredAt: -1 });
patientSchema.index({ status: 1, registeredAt: -1 });
patientSchema.index({ fullName: 1 }, { collation: CI_COLLATION });
patientSchema.index({ condition: 1 }, { collation: CI_COLLATION });

export type PatientDoc = InferSchemaType<typeof patientSchema>;
export const Patient = model("Patient", patientSchema);
