import { Types, type PipelineStage, type QueryFilter } from "mongoose";
import { notFound } from "../../lib/errors.js";
import { CI_COLLATION, containsAny, dateRange, paginationMeta } from "../../lib/query.js";
import { Doctor } from "../../models/doctor.model.js";
import { Patient, type PatientDoc } from "../../models/patient.model.js";
import type {
  CreatePatientBody,
  ListPatientsQuery,
  UpdatePatientBody,
} from "./patients.schemas.js";

interface DoctorRef {
  _id: Types.ObjectId;
  name: string;
  specialization: string;
}

type RawPatient = Omit<PatientDoc, "doctor"> & { _id: Types.ObjectId; doctor: DoctorRef | null };

export const serializePatient = (patient: RawPatient) => ({
  id: patient._id.toString(),
  fullName: patient.fullName,
  dateOfBirth: patient.dateOfBirth,
  gender: patient.gender,
  phone: patient.phone,
  email: patient.email ?? "",
  address: patient.address,
  condition: patient.condition,
  status: patient.status,
  registeredAt: patient.registeredAt,
  doctor: patient.doctor
    ? {
        id: patient.doctor._id.toString(),
        name: patient.doctor.name,
        specialization: patient.doctor.specialization,
      }
    : null,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

// One $lookup per returned row, on _id. Placed after $limit unless sorting by doctor.
const doctorStages: PipelineStage[] = [
  {
    $lookup: {
      from: "doctors",
      localField: "doctor",
      foreignField: "_id",
      pipeline: [{ $project: { name: 1, specialization: 1 } }],
      as: "doctor",
    },
  } as PipelineStage,
  { $set: { doctor: { $first: "$doctor" } } },
];

export async function listPatients(query: ListPatientsQuery, doctorId?: string) {
  const { page, limit, search, doctor, condition, status, registeredFrom, registeredTo, sort, order } =
    query;

  const match: QueryFilter<PatientDoc> = {};
  const scopedDoctor = doctorId ?? doctor;
  // Aggregations don't get Mongoose's casting, so ids and dates must already be typed.
  if (scopedDoctor) match.doctor = new Types.ObjectId(scopedDoctor);
  if (search) {
    Object.assign(match, containsAny(["fullName", "condition", "phone", "email", "address"], search));
  }
  if (condition) match.condition = condition;
  if (status) match.status = status;
  const registered = dateRange(registeredFrom, registeredTo);
  if (registered) match.registeredAt = registered;

  const direction = order === "asc" ? 1 : -1;
  const sortKey = sort === "doctor" ? "doctor.name" : sort;
  const page$: PipelineStage[] = [
    { $sort: { [sortKey]: direction, _id: 1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const [rows, total] = await Promise.all([
    Patient.aggregate<RawPatient>([
      { $match: match },
      ...(sort === "doctor" ? [...doctorStages, ...page$] : [...page$, ...doctorStages]),
    ]).collation(CI_COLLATION),
    Patient.countDocuments(match).collation(CI_COLLATION),
  ]);

  return { data: rows.map(serializePatient), meta: paginationMeta(page, limit, total) };
}

export async function getPatientFilters() {
  const conditions = await Patient.distinct("condition");
  return { conditions: conditions.sort((a, b) => a.localeCompare(b)) };
}

const findWithDoctor = (id: unknown) =>
  Patient.findById(id)
    .populate<{ doctor: DoctorRef | null }>("doctor", "name specialization")
    .lean();

export async function getPatient(id: string) {
  const patient = await findWithDoctor(id);
  if (!patient) throw notFound("Patient");
  return serializePatient(patient);
}

export async function createPatient(doctorId: string, body: CreatePatientBody) {
  if (!(await Doctor.exists({ _id: doctorId }))) throw notFound("Doctor");
  const patient = await Patient.create({ ...body, doctor: doctorId });
  return getPatient(patient._id.toString());
}

export async function updatePatient(id: string, body: UpdatePatientBody) {
  if (body.doctor && !(await Doctor.exists({ _id: body.doctor }))) throw notFound("Doctor");
  const patient = await Patient.findByIdAndUpdate(id, body, { runValidators: true }).lean();
  if (!patient) throw notFound("Patient");
  return getPatient(id);
}

export async function deletePatient(id: string) {
  const patient = await Patient.findByIdAndDelete(id).lean();
  if (!patient) throw notFound("Patient");
  return patient;
}
