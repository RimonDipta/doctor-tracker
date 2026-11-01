import { Router } from "express";
import { z } from "zod";
import { containsAny } from "../../lib/query.js";
import { Doctor } from "../../models/doctor.model.js";
import { Patient } from "../../models/patient.model.js";

const RESULTS_PER_TYPE = 5;

export const searchRoutes = Router();

searchRoutes.get("/", async (req, res) => {
  const { q } = z.object({ q: z.string().trim().min(2).max(100) }).parse(req.query);

  const [doctors, patients] = await Promise.all([
    Doctor.find(containsAny(["name", "specialization", "hospital", "email", "phone"], q))
      .select("name specialization hospital")
      .limit(RESULTS_PER_TYPE)
      .lean(),
    Patient.find(containsAny(["fullName", "condition", "email", "phone"], q))
      .select("fullName condition")
      .limit(RESULTS_PER_TYPE)
      .lean(),
  ]);

  res.json({
    data: {
      doctors: doctors.map((doctor) => ({
        id: doctor._id.toString(),
        name: doctor.name,
        subtitle: `${doctor.specialization} · ${doctor.hospital}`,
      })),
      patients: patients.map((patient) => ({
        id: patient._id.toString(),
        name: patient.fullName,
        subtitle: patient.condition,
      })),
    },
  });
});
