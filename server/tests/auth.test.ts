import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Session } from "../src/models/session.model.js";
import { ADMIN, createAdmin, signedInAgent } from "./helpers.js";

describe("auth", () => {
  it("sets an HTTP-only SameSite cookie and never returns the password hash", async () => {
    await createAdmin();
    const res = await request(createApp())
      .post("/api/auth/login")
      .send({ email: ADMIN.email.toUpperCase(), password: ADMIN.password })
      .expect(200);

    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toMatch(/dt_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  it("stores only a hash of the session token", async () => {
    await createAdmin();
    const res = await request(createApp())
      .post("/api/auth/login")
      .send({ email: ADMIN.email, password: ADMIN.password });
    const token = String(res.headers["set-cookie"]).match(/dt_session=([^;]+)/)![1];
    const session = await Session.findOne().lean();
    expect(session!.tokenHash).not.toBe(token);
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await createAdmin();
    const app = createApp();
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: ADMIN.email, password: "nope" })
      .expect(401);
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@test.dev", password: "nope" })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it("rejects NoSQL operators in the login payload", async () => {
    await request(createApp())
      .post("/api/auth/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } })
      .expect(400);
  });

  it("protects API routes and ends the session on logout", async () => {
    const app = createApp();
    await request(app).get("/api/doctors").expect(401);

    const agent = await signedInAgent(app);
    await agent.get("/api/auth/me").expect(200);
    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);
    expect(await Session.countDocuments()).toBe(0);
  });

  it("rate limits repeated failed logins", async () => {
    const app = createApp({ authAttemptLimit: 2 });
    const attempt = () =>
      request(app).post("/api/auth/login").send({ email: "a@test.dev", password: "x" });
    await attempt().expect(401);
    await attempt().expect(401);
    const res = await attempt().expect(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });

  it("limits attempts per account even when the client rotates X-Forwarded-For", async () => {
    const app = createApp({ authAttemptLimit: 100, accountAttemptLimit: 2 });
    const attempt = (ip: string) =>
      request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", ip)
        .send({ email: "Victim@test.dev", password: "x" });
    await attempt("10.0.0.1").expect(401);
    await attempt("10.0.0.2").expect(401);
    await attempt("10.0.0.3").expect(429);
  });

  it("refuses writes from a foreign origin", async () => {
    const agent = await signedInAgent();
    await agent.post("/api/auth/logout").set("Origin", "https://evil.example").expect(403);
  });

  it("revokes other sessions when the password changes", async () => {
    const app = createApp();
    const first = await signedInAgent(app);
    const second = request.agent(app);
    await second.post("/api/auth/login").send({ email: ADMIN.email, password: ADMIN.password });

    await first
      .post("/api/auth/change-password")
      .send({ currentPassword: ADMIN.password, newPassword: "a-brand-new-password" })
      .expect(204);

    await first.get("/api/auth/me").expect(200);
    await second.get("/api/auth/me").expect(401);
  });
});
