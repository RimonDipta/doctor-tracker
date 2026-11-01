import { Router } from "express";
import { Types } from "mongoose";
import { idParams } from "../../lib/schemas.js";
import { logActivity } from "../activity/activity.service.js";
import { listPatientsQuery, updatePatientBody } from "./patients.schemas.js";
import {
  deletePatient,
  getPatient,
  getPatientFilters,
  listPatients,
  updatePatient,
} from "./patients.service.js";

export const patientRoutes = Router();

patientRoutes.get("/", async (req, res) => {
  res.json(await listPatients(listPatientsQuery.parse(req.query)));
});

patientRoutes.get("/filters", async (_req, res) => {
  res.json({ data: await getPatientFilters() });
});

patientRoutes.get("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json({ data: await getPatient(id) });
});

patientRoutes.patch("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const body = updatePatientBody.parse(req.body);
  const before = body.doctor ? await getPatient(id) : null;
  const patient = await updatePatient(id, body);
  const moved = before && before.doctor?.id !== patient.doctor?.id;
  await logActivity(req, {
    action: moved ? "reassigned" : "updated",
    entityType: "patient",
    entityId: new Types.ObjectId(id),
    label: patient.fullName,
    detail: moved ? `Now with ${patient.doctor?.name}` : undefined,
  });
  res.json({ data: patient });
});

patientRoutes.delete("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const patient = await deletePatient(id);
  await logActivity(req, {
    action: "deleted",
    entityType: "patient",
    entityId: new Types.ObjectId(id),
    label: patient.fullName,
  });
  res.status(204).end();
});
