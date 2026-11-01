import type { PipelineStage, QueryFilter } from "mongoose";
import { AppError, notFound } from "../../lib/errors.js";
import { CI_COLLATION, containsAny, dateRange, paginationMeta } from "../../lib/query.js";
import { Doctor, type DoctorDoc } from "../../models/doctor.model.js";
import { Patient } from "../../models/patient.model.js";
import type { CreateDoctorBody, ListDoctorsQuery, UpdateDoctorBody } from "./doctors.schemas.js";

type RawDoctor = DoctorDoc & { _id: { toString(): string }; patientCount?: number };

export const serializeDoctor = (doctor: RawDoctor) => ({
  id: doctor._id.toString(),
  name: doctor.name,
  specialization: doctor.specialization,
  hospital: doctor.hospital,
  phone: doctor.phone,
  email: doctor.email,
  status: doctor.status,
  patientCount: doctor.patientCount ?? 0,
  createdAt: doctor.createdAt,
  updatedAt: doctor.updatedAt,
});

// Counted through the { doctor } index; placed after $limit unless the sort needs it.
const patientCountStages: PipelineStage[] = [
  {
    $lookup: {
      from: "patients",
      localField: "_id",
      foreignField: "doctor",
      pipeline: [{ $count: "n" }],
      as: "patientStats",
    },
  } as PipelineStage,
  { $addFields: { patientCount: { $ifNull: [{ $first: "$patientStats.n" }, 0] } } },
  { $project: { patientStats: 0 } },
];

export async function listDoctors(query: ListDoctorsQuery) {
  const { page, limit, search, specialization, hospital, status, addedFrom, addedTo, sort, order } =
    query;

  const match: QueryFilter<DoctorDoc> = {};
  if (search) {
    Object.assign(match, containsAny(["name", "specialization", "hospital", "phone", "email"], search));
  }
  if (specialization) match.specialization = specialization;
  if (hospital) match.hospital = hospital;
  if (status) match.status = status;
  const added = dateRange(addedFrom, addedTo);
  if (added) match.createdAt = added;

  const direction = order === "asc" ? 1 : -1;
  const page$: PipelineStage[] = [
    { $sort: { [sort]: direction, _id: 1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const [rows, total] = await Promise.all([
    Doctor.aggregate<RawDoctor>([
      { $match: match },
      ...(sort === "patientCount"
        ? [...patientCountStages, ...page$]
        : [...page$, ...patientCountStages]),
    ]).collation(CI_COLLATION),
    Doctor.countDocuments(match).collation(CI_COLLATION),
  ]);

  return { data: rows.map(serializeDoctor), meta: paginationMeta(page, limit, total) };
}

export async function getDoctorFilters() {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
  ]);
  return {
    specializations: specializations.sort((a, b) => a.localeCompare(b)),
    hospitals: hospitals.sort((a, b) => a.localeCompare(b)),
  };
}

/** Lightweight list for doctor pickers. */
export async function getDoctorOptions() {
  const rows = await Doctor.find()
    .select("name specialization status")
    .collation(CI_COLLATION)
    .sort({ name: 1 })
    .lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    name: row.name,
    specialization: row.specialization,
    status: row.status,
  }));
}

export async function getDoctor(id: string) {
  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(id).lean(),
    Patient.countDocuments({ doctor: id }),
  ]);
  if (!doctor) throw notFound("Doctor");
  return serializeDoctor({ ...doctor, patientCount });
}

export async function createDoctor(body: CreateDoctorBody) {
  const doctor = await Doctor.create(body);
  return serializeDoctor(doctor.toObject());
}

export async function updateDoctor(id: string, body: UpdateDoctorBody) {
  const doctor = await Doctor.findByIdAndUpdate(id, body, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doctor) throw notFound("Doctor");
  return serializeDoctor({ ...doctor, patientCount: await Patient.countDocuments({ doctor: id }) });
}

/**
 * A doctor with patients can only be deleted by naming who takes them over.
 * Patients move first: if the process dies midway nobody is orphaned, and the
 * sweep afterwards catches any patient added during the move.
 */
export async function deleteDoctor(id: string, reassignTo?: string) {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) throw notFound("Doctor");

  const patientCount = await Patient.countDocuments({ doctor: id });
  let target: { _id: unknown; name: string } | null = null;

  if (patientCount > 0) {
    if (!reassignTo) {
      throw new AppError(
        409,
        "DOCTOR_HAS_PATIENTS",
        "Reassign this doctor's patients before deleting",
        { patientCount },
      );
    }
    if (reassignTo === id) {
      throw new AppError(400, "INVALID_REASSIGNMENT", "Choose a different doctor");
    }
    target = await Doctor.findById(reassignTo).select("name").lean();
    if (!target) throw notFound("Replacement doctor");
    await Patient.updateMany({ doctor: id }, { doctor: reassignTo });
  }

  await Doctor.deleteOne({ _id: id });
  if (target) await Patient.updateMany({ doctor: id }, { doctor: target._id });

  return { doctor, patientCount, reassignedTo: target?.name ?? null };
}
