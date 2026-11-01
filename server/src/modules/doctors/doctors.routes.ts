import { Types } from "mongoose";
import { Router } from "express";
import { idParams } from "../../lib/schemas.js";
import { logActivity } from "../activity/activity.service.js";
import { createPatientBody, listPatientsQuery } from "../patients/patients.schemas.js";
import { createPatient, listPatients } from "../patients/patients.service.js";
import {
  createDoctorBody,
  deleteDoctorQuery,
  listDoctorsQuery,
  updateDoctorBody,
} from "./doctors.schemas.js";
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctorFilters,
  getDoctorOptions,
  listDoctors,
  updateDoctor,
} from "./doctors.service.js";

export const doctorRoutes = Router();

doctorRoutes.get("/", async (req, res) => {
  res.json(await listDoctors(listDoctorsQuery.parse(req.query)));
});

doctorRoutes.get("/filters", async (_req, res) => {
  res.json({ data: await getDoctorFilters() });
});

doctorRoutes.get("/options", async (_req, res) => {
  res.json({ data: await getDoctorOptions() });
});

doctorRoutes.post("/", async (req, res) => {
  const doctor = await createDoctor(createDoctorBody.parse(req.body));
  await logActivity(req, {
    action: "created",
    entityType: "doctor",
    entityId: new Types.ObjectId(doctor.id),
    label: doctor.name,
    detail: doctor.specialization,
  });
  res.status(201).json({ data: doctor });
});

doctorRoutes.get("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json({ data: await getDoctor(id) });
});

doctorRoutes.patch("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const doctor = await updateDoctor(id, updateDoctorBody.parse(req.body));
  await logActivity(req, {
    action: "updated",
    entityType: "doctor",
    entityId: new Types.ObjectId(id),
    label: doctor.name,
  });
  res.json({ data: doctor });
});

doctorRoutes.delete("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { reassignTo } = deleteDoctorQuery.parse(req.query);
  const { doctor, patientCount, reassignedTo } = await deleteDoctor(id, reassignTo);
  await logActivity(req, {
    action: "deleted",
    entityType: "doctor",
    entityId: new Types.ObjectId(id),
    label: doctor.name,
    ...(reassignedTo && {
      detail: `${patientCount} patient${patientCount === 1 ? "" : "s"} moved to ${reassignedTo}`,
    }),
  });
  res.status(204).end();
});

doctorRoutes.get("/:id/patients", async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await listPatients(listPatientsQuery.parse(req.query), id));
});

doctorRoutes.post("/:id/patients", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const patient = await createPatient(id, createPatientBody.parse(req.body));
  await logActivity(req, {
    action: "created",
    entityType: "patient",
    entityId: new Types.ObjectId(patient.id),
    label: patient.fullName,
    detail: patient.doctor ? `Assigned to ${patient.doctor.name}` : undefined,
  });
  res.status(201).json({ data: patient });
});
