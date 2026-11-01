import { beforeEach, describe, expect, it } from "vitest";
import type TestAgent from "supertest/lib/agent.js";
import { Patient } from "../src/models/patient.model.js";
import { getDashboardStats } from "../src/modules/dashboard/dashboard.service.js";
import { doctorInput, patientInput, signedInAgent } from "./helpers.js";

const addPatient = (doctor: string, registeredAt: string, condition = "Hypertension") =>
  Patient.create({ ...patientInput({ condition, registeredAt }), doctor });

describe("dashboard stats", () => {
  let agent: TestAgent;
  let doctorId: string;

  beforeEach(async () => {
    agent = await signedInAgent();
    doctorId = (await agent.post("/api/doctors").send(doctorInput()).expect(201)).body.data.id;
  });

  it("aggregates totals, per-doctor counts and a zero-filled 12 month series", async () => {
    await addPatient(doctorId, "2026-03-20T10:00:00Z");
    await addPatient(doctorId, "2026-03-02T10:00:00Z", "Migraine");
    await addPatient(doctorId, "2026-02-05T10:00:00Z");
    await addPatient(doctorId, "2026-02-25T10:00:00Z");

    const stats = await getDashboardStats(new Date("2026-03-20T12:00:00Z"));

    expect(stats.metrics.totalPatients.value).toBe(4);
    expect(stats.metrics.activeDoctors).toEqual({ value: 1, sharePct: 100 });
    expect(stats.patientsPerDoctor).toEqual([
      expect.objectContaining({ id: doctorId, count: 4 }),
    ]);
    expect(stats.registrations).toHaveLength(12);
    expect(stats.registrations.at(-1)).toEqual({ month: "2026-03", count: 2 });
    expect(stats.registrations.at(-2)).toEqual({ month: "2026-02", count: 2 });
    expect(stats.registrations.at(0)).toEqual({ month: "2025-04", count: 0 });
  });

  it("compares month-to-date with the same stretch of last month", async () => {
    await addPatient(doctorId, "2026-03-05T10:00:00Z");
    await addPatient(doctorId, "2026-03-06T10:00:00Z");
    await addPatient(doctorId, "2026-02-03T10:00:00Z");
    await addPatient(doctorId, "2026-02-27T10:00:00Z"); // after the same point last month

    const { metrics } = await getDashboardStats(new Date("2026-03-10T00:00:00Z"));
    expect(metrics.newPatients).toEqual({ value: 2, previous: 1, changePct: 100 });
  });

  it("reports no percentage when there is nothing to compare with", async () => {
    await addPatient(doctorId, "2026-03-05T10:00:00Z");
    const { metrics } = await getDashboardStats(new Date("2026-03-10T00:00:00Z"));
    expect(metrics.newPatients.changePct).toBeNull();
  });

  it("folds conditions past the top five into Other", async () => {
    for (const condition of ["A1", "B2", "C3", "D4", "E5", "F6", "G7"]) {
      await addPatient(doctorId, "2026-03-05T10:00:00Z", condition);
    }
    const res = await agent.get("/api/dashboard/stats").expect(200);
    expect(res.body.data.conditions).toHaveLength(6);
    expect(res.body.data.conditions.at(-1)).toEqual({ name: "Other", count: 2 });
  });
});
