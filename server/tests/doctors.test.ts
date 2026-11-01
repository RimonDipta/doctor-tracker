import { beforeEach, describe, expect, it } from "vitest";
import type TestAgent from "supertest/lib/agent.js";
import { Activity } from "../src/models/activity.model.js";
import { Patient } from "../src/models/patient.model.js";
import { doctorInput, patientInput, signedInAgent } from "./helpers.js";

describe("doctors", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    agent = await signedInAgent();
  });

  const createDoctor = async (overrides = {}) =>
    (await agent.post("/api/doctors").send(doctorInput(overrides)).expect(201)).body.data;

  it("creates, reads, updates and logs activity", async () => {
    const doctor = await createDoctor();
    expect(doctor).toMatchObject({ name: "Dr. Ada Lovelace", status: "active", patientCount: 0 });

    const updated = await agent
      .patch(`/api/doctors/${doctor.id}`)
      .send({ hospital: "Lakeshore" })
      .expect(200);
    expect(updated.body.data.hospital).toBe("Lakeshore");

    await agent.get(`/api/doctors/${doctor.id}`).expect(200);
    expect(await Activity.countDocuments({ entityType: "doctor" })).toBe(2);
  });

  it("returns field errors for invalid input", async () => {
    const res = await agent
      .post("/api/doctors")
      .send(doctorInput({ email: "nope", name: "<b>x</b>" }))
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual(["email", "name"]);
  });

  it("reports a duplicate email against the email field", async () => {
    await createDoctor();
    const res = await agent.post("/api/doctors").send(doctorInput()).expect(409);
    expect(res.body.error.details.fieldErrors.email).toBeDefined();
  });

  it("rejects malformed ids and returns 404 for unknown ones", async () => {
    await agent.get("/api/doctors/not-an-id").expect(400);
    await agent.get("/api/doctors/507f1f77bcf86cd799439011").expect(404);
  });

  it("searches, filters, sorts and paginates on the server", async () => {
    const ada = await createDoctor();
    const bo = await createDoctor({ name: "Dr. Bo Chen", email: "bo@example.com", specialization: "Neurology" });
    await createDoctor({ name: "Dr. cy Young", email: "cy@example.com", hospital: "Northgate" });
    await agent.post(`/api/doctors/${bo.id}/patients`).send(patientInput()).expect(201);

    const search = await agent.get("/api/doctors").query({ search: "neuro" }).expect(200);
    expect(search.body.data.map((d: { id: string }) => d.id)).toEqual([bo.id]);

    const filtered = await agent.get("/api/doctors").query({ hospital: "northgate" }).expect(200);
    expect(filtered.body.meta.total).toBe(1);

    const byCount = await agent.get("/api/doctors").query({ sort: "patientCount" }).expect(200);
    expect(byCount.body.data[0]).toMatchObject({ id: bo.id, patientCount: 1 });

    const byName = await agent
      .get("/api/doctors")
      .query({ sort: "name", order: "asc", limit: 2, page: 2 })
      .expect(200);
    expect(byName.body.data.map((d: { name: string }) => d.name)).toEqual(["Dr. cy Young"]);
    expect(byName.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(ada.id).toBeTruthy();
  });

  it("treats regex metacharacters in search as literal text", async () => {
    await createDoctor();
    const res = await agent.get("/api/doctors").query({ search: ".*" }).expect(200);
    expect(res.body.meta.total).toBe(0);
  });

  describe("deletion", () => {
    it("deletes a doctor with no patients", async () => {
      const doctor = await createDoctor();
      await agent.delete(`/api/doctors/${doctor.id}`).expect(204);
      await agent.get(`/api/doctors/${doctor.id}`).expect(404);
    });

    it("refuses while patients would be orphaned", async () => {
      const doctor = await createDoctor();
      await agent.post(`/api/doctors/${doctor.id}/patients`).send(patientInput()).expect(201);

      const res = await agent.delete(`/api/doctors/${doctor.id}`).expect(409);
      expect(res.body.error).toMatchObject({
        code: "DOCTOR_HAS_PATIENTS",
        details: { patientCount: 1 },
      });
      await agent.get(`/api/doctors/${doctor.id}`).expect(200);
    });

    it("moves patients to the replacement before deleting", async () => {
      const doctor = await createDoctor();
      const next = await createDoctor({ email: "next@example.com" });
      await agent.post(`/api/doctors/${doctor.id}/patients`).send(patientInput()).expect(201);

      await agent.delete(`/api/doctors/${doctor.id}`).query({ reassignTo: next.id }).expect(204);

      const patients = await Patient.find().lean();
      expect(patients.map((p) => p.doctor.toString())).toEqual([next.id]);
    });

    it("leaves patients untouched when the replacement is invalid", async () => {
      const doctor = await createDoctor();
      await agent.post(`/api/doctors/${doctor.id}/patients`).send(patientInput()).expect(201);

      await agent.delete(`/api/doctors/${doctor.id}`).query({ reassignTo: doctor.id }).expect(400);
      await agent
        .delete(`/api/doctors/${doctor.id}`)
        .query({ reassignTo: "507f1f77bcf86cd799439011" })
        .expect(404);
      expect((await Patient.findOne().lean())!.doctor.toString()).toBe(doctor.id);
    });
  });
});
