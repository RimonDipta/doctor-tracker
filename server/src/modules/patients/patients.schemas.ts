import { z } from "zod";
import { paginationQuery } from "../../lib/query.js";
import { email, isoDate, objectId, phone, plainText } from "../../lib/schemas.js";
import { PATIENT_GENDERS, PATIENT_STATUSES } from "../../models/patient.model.js";

const pastDate = (label: string) =>
  isoDate
    .refine((value) => new Date(value) <= new Date(), `${label} can't be in the future`)
    .refine((value) => new Date(value) >= new Date("1900-01-01"), `${label} is too far in the past`);

const patientFields = {
  fullName: plainText("Full name", 2, 100),
  dateOfBirth: pastDate("Date of birth"),
  gender: z.enum(PATIENT_GENDERS, { error: "Choose a gender" }),
  phone,
  email: z.literal("").or(email).default(""),
  address: plainText("Address", 5, 200),
  condition: plainText("Condition", 2, 100),
  status: z.enum(PATIENT_STATUSES, { error: "Choose a status" }).default("active"),
  registeredAt: pastDate("Registration date").optional(),
};

export const createPatientBody = z.object(patientFields);

export const updatePatientBody = z
  .object({
    ...patientFields,
    email: z.literal("").or(email),
    status: z.enum(PATIENT_STATUSES, { error: "Choose a status" }),
    doctor: objectId,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const listPatientsQuery = paginationQuery.extend({
  doctor: objectId.optional(),
  condition: z.string().trim().max(100).optional(),
  status: z.enum(PATIENT_STATUSES).optional(),
  registeredFrom: isoDate.optional(),
  registeredTo: isoDate.optional(),
  sort: z.enum(["fullName", "doctor", "condition", "status", "registeredAt"]).default("registeredAt"),
});

export type ListPatientsQuery = z.infer<typeof listPatientsQuery>;
export type CreatePatientBody = z.infer<typeof createPatientBody>;
export type UpdatePatientBody = z.infer<typeof updatePatientBody>;
