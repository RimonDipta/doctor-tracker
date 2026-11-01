import { beforeEach, describe, expect, it } from "vitest";
import type TestAgent from "supertest/lib/agent.js";
import { doctorInput, patientInput, signedInAgent } from "./helpers.js";

describe("patients", () => {
  let agent: TestAgent;
  let doctorId: string;

  beforeEach(async () => {
    agent = await signedInAgent();
    doctorId = (await agent.post("/api/doctors").send(doctorInput()).expect(201)).body.data.id;
  });

  const createPatient = async (overrides = {}, doctor = doctorId) =>
    (await agent.post(`/api/doctors/${doctor}/patients`).send(patientInput(overrides)).expect(201))
      .body.data;

  it("creates a patient under a doctor and returns the doctor reference", async () => {
    const patient = await createPatient();
    expect(patient.doctor).toMatchObject({ id: doctorId, name: "Dr. Ada Lovelace" });
    expect(patient.status).toBe("active");
  });

  it("requires an existing doctor", async () => {
    await agent
      .post("/api/doctors/507f1f77bcf86cd799439011/patients")
      .send(patientInput())
      .expect(404);
  });

  it("rejects a future date of birth", async () => {
    const res = await agent
      .post(`/api/doctors/${doctorId}/patients`)
      .send(patientInput({ dateOfBirth: "2999-01-01" }))
      .expect(400);
    expect(res.body.error.details.fieldErrors.dateOfBirth).toMatch(/future/);
  });

  it("reassigns to another doctor and validates the target", async () => {
    const patient = await createPatient();
    const other = (
      await agent.post("/api/doctors").send(doctorInput({ email: "o@example.com", name: "Dr. Other" }))
    ).body.data;

    await agent
      .patch(`/api/patients/${patient.id}`)
      .send({ doctor: "507f1f77bcf86cd799439011" })
      .expect(404);
    const res = await agent
      .patch(`/api/patients/${patient.id}`)
      .send({ doctor: other.id })
      .expect(200);
    expect(res.body.data.doctor.name).toBe("Dr. Other");
  });

  it("can clear the optional email", async () => {
    const patient = await createPatient();
    const res = await agent.patch(`/api/patients/${patient.id}`).send({ email: "" }).expect(200);
    expect(res.body.data.email).toBe("");
  });

  it("filters by doctor and registration date, and sorts by doctor name", async () => {
    const other = (
      await agent.post("/api/doctors").send(doctorInput({ email: "z@example.com", name: "Dr. Zed" }))
    ).body.data;
    await createPatient({ registeredAt: "2025-02-10" });
    await createPatient({ fullName: "Alan Turing", registeredAt: "2025-03-10" }, other.id);

    const byDoctor = await agent.get("/api/patients").query({ doctor: other.id }).expect(200);
    expect(byDoctor.body.meta.total).toBe(1);

    const scoped = await agent.get(`/api/doctors/${other.id}/patients`).expect(200);
    expect(scoped.body.data[0].fullName).toBe("Alan Turing");

    const dated = await agent
      .get("/api/patients")
      .query({ registeredFrom: "2025-02-10", registeredTo: "2025-02-10" })
      .expect(200);
    expect(dated.body.data.map((p: { fullName: string }) => p.fullName)).toEqual(["Grace Hopper"]);

    const sorted = await agent.get("/api/patients").query({ sort: "doctor", order: "desc" }).expect(200);
    expect(sorted.body.data[0].doctor.name).toBe("Dr. Zed");
  });

  it("deletes a patient", async () => {
    const patient = await createPatient();
    await agent.delete(`/api/patients/${patient.id}`).expect(204);
    await agent.get(`/api/patients/${patient.id}`).expect(404);
  });
});
