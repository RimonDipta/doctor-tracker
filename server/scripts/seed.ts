/**
 * Replaces doctors, patients and activity with a realistic demo data set.
 * All people here are fictional; emails use the reserved example.com domain and
 * phone numbers the reserved 555-01xx range.
 */
import { Types } from "mongoose";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { Activity } from "../src/models/activity.model.js";
import { Admin } from "../src/models/admin.model.js";
import { Doctor } from "../src/models/doctor.model.js";
import { Patient } from "../src/models/patient.model.js";
import { Session } from "../src/models/session.model.js";
import { hashPassword } from "../src/modules/auth/auth.service.js";

const DEMO_ADMIN = {
  name: "Amara Okafor",
  email: "admin@doctortracker.dev",
  password: process.env.SEED_ADMIN_PASSWORD ?? "DemoAdmin2026!",
};

if (env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  console.error("Refusing to wipe data in production. Pass --force if this is really intended.");
  process.exit(1);
}

// Small deterministic PRNG so every seed produces the same people.
let state = 20261101;
const random = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)]!;

/** Each specialty sees its first-listed condition most often. */
const commonFirst = <T>(items: readonly T[]): T => (random() < 0.65 ? items[0]! : pick(items));

const DAY = 86_400_000;
const now = new Date();

const phoneNumber = () => `+1 (${int(202, 989)}) 555-01${String(int(0, 99)).padStart(2, "0")}`;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");

const HOSPITALS = [
  "Riverside General Hospital",
  "St. Brigid Medical Center",
  "Lakeshore University Hospital",
  "Northgate Community Clinic",
  "Harbor View Health",
] as const;

// weight skews each doctor's patient panel so the charts have a real shape.
const DOCTORS = [
  ["Dr. Lena Hartmann", "Cardiology", 3.2],
  ["Dr. Rajiv Menon", "Endocrinology", 2.7],
  ["Dr. Sofia Marquez", "Pediatrics", 2.4],
  ["Dr. Daniel Osei", "Internal Medicine", 2.2],
  ["Dr. Hana Kobayashi", "Neurology", 1.9],
  ["Dr. Marcus Whitfield", "Orthopedics", 1.7],
  ["Dr. Aisha Rahman", "Pulmonology", 1.6],
  ["Dr. Tomasz Nowak", "Psychiatry", 1.4],
  ["Dr. Priya Nair", "Dermatology", 1.2],
  ["Dr. Elias Haddad", "Gastroenterology", 1.1],
  ["Dr. Grace Adeyemi", "Obstetrics & Gynecology", 1.0],
  ["Dr. Noah Lindqvist", "Cardiology", 0.9],
  ["Dr. Camila Rocha", "Rheumatology", 0.8],
  ["Dr. Yusuf Demir", "Nephrology", 0.7],
  ["Dr. Claire Fontaine", "Oncology", 0.6],
  ["Dr. Ben Achebe", "Internal Medicine", 0.5],
  ["Dr. Mei Lin Tan", "Neurology", 0.3],
  ["Dr. Oliver Grant", "Orthopedics", 0],
] as const;

const CONDITIONS_BY_SPECIALTY: Record<string, readonly string[]> = {
  Cardiology: ["Hypertension", "Atrial fibrillation", "Heart failure"],
  Endocrinology: ["Type 2 diabetes", "Hypothyroidism"],
  Pediatrics: ["Asthma", "Eczema"],
  "Internal Medicine": ["Hypertension", "Type 2 diabetes", "Anemia"],
  Neurology: ["Migraine", "Epilepsy"],
  Orthopedics: ["Osteoarthritis", "Chronic back pain"],
  Pulmonology: ["Asthma", "COPD"],
  Psychiatry: ["Generalized anxiety", "Major depression", "ADHD"],
  Dermatology: ["Eczema", "Psoriasis", "Acne"],
  Gastroenterology: ["Crohn's disease", "GERD", "Irritable bowel syndrome"],
  "Obstetrics & Gynecology": ["PCOS", "Endometriosis", "Prenatal care"],
  Rheumatology: ["Rheumatoid arthritis", "Lupus", "Osteoarthritis"],
  Nephrology: ["Chronic kidney disease", "Hypertension"],
  Oncology: ["Breast cancer", "Lymphoma"],
};

const FIRST_NAMES = [
  "Maya", "Liam", "Zara", "Ethan", "Nora", "Mateo", "Aaliyah", "Owen", "Ingrid", "Kofi",
  "Lucia", "Jonah", "Fatima", "Theo", "Anika", "Caleb", "Rosa", "Dmitri", "Naomi", "Hugo",
  "Sana", "Felix", "Imani", "Arjun", "Elena", "Tariq", "Chloe", "Minh", "Amelia", "Samir",
] as const;
const LAST_NAMES = [
  "Bennett", "Ivanova", "Chowdhury", "Reyes", "Mwangi", "Sorensen", "Park", "Costa", "Abara",
  "Weiss", "Hughes", "Farah", "Novak", "Tran", "Silva", "O'Connell", "Mehta", "Larsen", "Khan",
  "Dubois", "Ahmed", "Rossi", "Nguyen", "Baker", "Santos", "Lindholm", "Asante", "Popov",
] as const;
const STREETS = ["Maple Ave", "Harbor St", "Elm Court", "Birch Lane", "Mill Road", "Cedar Way", "Park Terrace"] as const;
const CITIES = ["Springfield, IL", "Madison, WI", "Portland, ME", "Burlington, VT", "Asheville, NC"] as const;

function buildDoctors() {
  return DOCTORS.map(([name, specialization], index) => {
    const handle = slug(name.replace("Dr. ", ""));
    // Longest-serving doctors first; the last few joined in recent weeks.
    const daysAgo = Math.max(1, Math.round(430 - index * 24 - int(0, 12)));
    const createdAt = new Date(now.getTime() - daysAgo * DAY);
    return {
      _id: new Types.ObjectId(),
      name,
      specialization,
      hospital: HOSPITALS[index % HOSPITALS.length]!,
      phone: phoneNumber(),
      email: `${handle}@example.com`,
      status: index === 7 || index === 13 ? ("on_leave" as const) : index === 16 ? ("inactive" as const) : ("active" as const),
      createdAt,
      updatedAt: createdAt,
    };
  });
}

/** Registrations per month, oldest first, trending upward with some noise. */
function monthlyVolumes(months: number) {
  return Array.from({ length: months }, (_, index) => Math.round(9 + index * 1.6 + int(-3, 4)));
}

function registrationDate(monthsAgo: number) {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1);
  const end = monthsAgo === 0 ? now.getTime() : Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 1);
  return new Date(start + random() * (end - start - 1));
}

function buildPatients(doctors: ReturnType<typeof buildDoctors>) {
  const panel = doctors.flatMap((doctor, index) =>
    Array.from({ length: Math.round(DOCTORS[index]![2] * 10) }, () => doctor),
  );
  const volumes = monthlyVolumes(14);
  const patients = [];

  for (const [index, volume] of volumes.entries()) {
    const monthsAgo = volumes.length - 1 - index;
    // The current month only holds the share of the month that has passed, with a floor for demos.
    const share = monthsAgo === 0 ? Math.max(0.35, now.getUTCDate() / 30) : 1;

    for (let i = 0; i < Math.round(volume * share); i++) {
      const registeredAt = registrationDate(monthsAgo);
      const eligible = panel.filter((doctor) => doctor.createdAt <= registeredAt);
      const doctor = pick(eligible.length ? eligible : panel);
      const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const age = doctor.specialization === "Pediatrics" ? int(2, 16) : int(19, 86);
      const daysSince = (now.getTime() - registeredAt.getTime()) / DAY;
      const roll = random();
      patients.push({
        fullName,
        dateOfBirth: new Date(Date.UTC(now.getUTCFullYear() - age, int(0, 11), int(1, 28))),
        gender: roll < 0.48 ? "female" : roll < 0.95 ? "male" : roll < 0.98 ? "other" : "undisclosed",
        phone: phoneNumber(),
        email: random() < 0.85 ? `${slug(fullName)}${int(1, 99)}@example.com` : "",
        address: `${int(12, 980)} ${pick(STREETS)}, ${pick(CITIES)}`,
        condition: commonFirst(CONDITIONS_BY_SPECIALTY[doctor.specialization]!),
        status: daysSince > 200 && random() < 0.5 ? "discharged" : random() < 0.3 ? "follow_up" : "active",
        doctor: doctor._id,
        registeredAt,
        createdAt: registeredAt,
        updatedAt: registeredAt,
      });
    }
  }
  return patients;
}

await connectDb();

await Promise.all([Doctor.init(), Patient.init(), Admin.init(), Session.init(), Activity.init()]);
await Promise.all([Doctor.deleteMany(), Patient.deleteMany(), Activity.deleteMany()]);

await Admin.updateOne(
  { email: DEMO_ADMIN.email },
  { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email, passwordHash: await hashPassword(DEMO_ADMIN.password) },
  { upsert: true },
);

const doctors = buildDoctors();
const patients = buildPatients(doctors);

await Doctor.collection.insertMany(doctors);
const { insertedIds } = await Patient.collection.insertMany(patients);

const nameOf = new Map(doctors.map((doctor) => [doctor._id.toString(), doctor.name]));
const recentPatientEvents = patients
  .map((patient, index) => ({ patient, id: insertedIds[index]! }))
  .sort((a, b) => b.patient.registeredAt.getTime() - a.patient.registeredAt.getTime())
  .slice(0, 8)
  .map(({ patient, id }) => ({
    action: "created",
    entityType: "patient",
    entityId: id,
    label: patient.fullName,
    detail: `Assigned to ${nameOf.get(patient.doctor.toString())}`,
    actorName: DEMO_ADMIN.name,
    createdAt: patient.registeredAt,
  }));
const recentDoctorEvents = doctors.slice(-2).map((doctor) => ({
  action: "created",
  entityType: "doctor",
  entityId: doctor._id,
  label: doctor.name,
  detail: doctor.specialization,
  actorName: DEMO_ADMIN.name,
  createdAt: doctor.createdAt,
}));
await Activity.collection.insertMany([...recentPatientEvents, ...recentDoctorEvents]);

console.log(`Seeded ${doctors.length} doctors and ${patients.length} patients.`);
console.log(`Sign in with ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
await disconnectDb();
