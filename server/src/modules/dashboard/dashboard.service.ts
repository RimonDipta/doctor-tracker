import { CI_COLLATION } from "../../lib/query.js";
import { Doctor } from "../../models/doctor.model.js";
import { Patient } from "../../models/patient.model.js";
import { recentActivity } from "../activity/activity.service.js";

const MONTHS_OF_HISTORY = 12;
const TOP_DOCTORS = 8;
const TOP_CONDITIONS = 5;

const monthStart = (date: Date, offset = 0) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));

const percentChange = (current: number, previous: number) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

function registrationsByMonth(now: Date) {
  const since = monthStart(now, -(MONTHS_OF_HISTORY - 1));
  return Patient.aggregate<{ _id: Date; count: number }>([
    { $match: { registeredAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateTrunc: { date: "$registeredAt", unit: "month", timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
  ]);
}

function patientsPerDoctor() {
  return Patient.aggregate<{ id: string; name: string; specialization: string; count: number }>([
    { $group: { _id: "$doctor", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: TOP_DOCTORS },
    { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "doctor" } },
    { $unwind: "$doctor" },
    {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        count: 1,
        name: "$doctor.name",
        specialization: "$doctor.specialization",
      },
    },
  ]);
}

function conditionCounts() {
  return Patient.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$condition", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]).collation(CI_COLLATION);
}

export async function getDashboardStats(now = new Date()) {
  const thisMonth = monthStart(now);
  const lastMonth = monthStart(now, -1);
  // Month-to-date is compared with the same stretch of last month, not all of it.
  const elapsed = now.getTime() - thisMonth.getTime();
  const samePointLastMonth = new Date(Math.min(lastMonth.getTime() + elapsed, thisMonth.getTime()));

  const [
    totalDoctors,
    totalPatients,
    activeDoctors,
    doctorsThisMonth,
    newThisMonth,
    newLastMonthToDate,
    monthly,
    perDoctor,
    conditions,
    recentPatients,
    recentDoctors,
    activity,
  ] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.countDocuments({ status: "active" }),
    Doctor.countDocuments({ createdAt: { $gte: thisMonth } }),
    Patient.countDocuments({ registeredAt: { $gte: thisMonth } }),
    Patient.countDocuments({ registeredAt: { $gte: lastMonth, $lt: samePointLastMonth } }),
    registrationsByMonth(now),
    patientsPerDoctor(),
    conditionCounts(),
    Patient.find()
      .sort({ registeredAt: -1 })
      .limit(5)
      .select("fullName condition registeredAt doctor")
      .populate<{ doctor: { name: string } | null }>("doctor", "name")
      .lean(),
    Doctor.find().sort({ createdAt: -1 }).limit(5).select("name specialization createdAt").lean(),
    recentActivity(6),
  ]);

  const counts = new Map(monthly.map((row) => [row._id.getTime(), row.count]));
  const registrations = Array.from({ length: MONTHS_OF_HISTORY }, (_, index) => {
    const month = monthStart(now, index - (MONTHS_OF_HISTORY - 1));
    return { month: month.toISOString().slice(0, 7), count: counts.get(month.getTime()) ?? 0 };
  });

  const top = conditions.slice(0, TOP_CONDITIONS).map((row) => ({ name: row._id, count: row.count }));
  const otherCount = conditions.slice(TOP_CONDITIONS).reduce((sum, row) => sum + row.count, 0);

  return {
    metrics: {
      totalDoctors: { value: totalDoctors, addedThisMonth: doctorsThisMonth },
      totalPatients: {
        value: totalPatients,
        addedThisMonth: newThisMonth,
        changePct: percentChange(totalPatients, totalPatients - newThisMonth),
      },
      activeDoctors: {
        value: activeDoctors,
        sharePct: totalDoctors ? Math.round((activeDoctors / totalDoctors) * 100) : 0,
      },
      newPatients: {
        value: newThisMonth,
        previous: newLastMonthToDate,
        changePct: percentChange(newThisMonth, newLastMonthToDate),
      },
    },
    patientsPerDoctor: perDoctor,
    registrations,
    conditions: otherCount ? [...top, { name: "Other", count: otherCount }] : top,
    recentPatients: recentPatients.map((patient) => ({
      id: patient._id.toString(),
      fullName: patient.fullName,
      condition: patient.condition,
      registeredAt: patient.registeredAt,
      doctorName: patient.doctor?.name ?? null,
    })),
    recentDoctors: recentDoctors.map((doctor) => ({
      id: doctor._id.toString(),
      name: doctor.name,
      specialization: doctor.specialization,
      createdAt: doctor.createdAt,
    })),
    activity,
  };
}
