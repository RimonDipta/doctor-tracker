import { z } from "zod";
import { paginationQuery } from "../../lib/query.js";
import { email, isoDate, objectId, phone, plainText } from "../../lib/schemas.js";
import { DOCTOR_STATUSES } from "../../models/doctor.model.js";

const doctorFields = {
  name: plainText("Name", 2, 80),
  specialization: plainText("Specialization", 2, 80),
  hospital: plainText("Hospital", 2, 120),
  phone,
  email,
  status: z.enum(DOCTOR_STATUSES, { error: "Choose a status" }),
};

export const createDoctorBody = z.object({
  ...doctorFields,
  status: doctorFields.status.default("active"),
});

export const updateDoctorBody = z
  .object(doctorFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const listDoctorsQuery = paginationQuery.extend({
  specialization: z.string().trim().max(80).optional(),
  hospital: z.string().trim().max(120).optional(),
  status: z.enum(DOCTOR_STATUSES).optional(),
  addedFrom: isoDate.optional(),
  addedTo: isoDate.optional(),
  sort: z
    .enum(["name", "specialization", "hospital", "patientCount", "createdAt"])
    .default("createdAt"),
});

export const deleteDoctorQuery = z.object({ reassignTo: objectId.optional() });

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuery>;
export type CreateDoctorBody = z.infer<typeof createDoctorBody>;
export type UpdateDoctorBody = z.infer<typeof updateDoctorBody>;
