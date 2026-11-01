import request from "supertest";
import { createApp } from "../src/app.js";
import { Admin } from "../src/models/admin.model.js";
import { hashPassword } from "../src/modules/auth/auth.service.js";

export const ADMIN = { name: "Test Admin", email: "admin@test.dev", password: "correct-horse-1" };

export const doctorInput = (overrides: Record<string, unknown> = {}) => ({
  name: "Dr. Ada Lovelace",
  specialization: "Cardiology",
  hospital: "General Hospital",
  phone: "+1 202 555 0100",
  email: "ada@example.com",
  ...overrides,
});

export const patientInput = (overrides: Record<string, string> = {}) => ({
  fullName: "Grace Hopper",
  dateOfBirth: "1980-05-12",
  gender: "female" as const,
  phone: "+1 202 555 0101",
  email: "grace@example.com",
  address: "12 Harbor St, Madison, WI",
  condition: "Hypertension",
  ...overrides,
});

export async function createAdmin() {
  await Admin.create({
    name: ADMIN.name,
    email: ADMIN.email,
    passwordHash: await hashPassword(ADMIN.password),
  });
}

/** A supertest agent that keeps cookies, signed in as the test admin. */
export async function signedInAgent(app = createApp()) {
  await createAdmin();
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: ADMIN.email, password: ADMIN.password }).expect(200);
  return agent;
}
