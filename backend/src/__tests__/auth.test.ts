import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

const credentials = {
  name: "Test User",
  email: "test@example.com",
  password: "Passw0rd!",
  timezone: "UTC",
};

describe("auth flow", () => {
  it("registers, rejects wrong password on login, then logs in successfully", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.accessToken).toBeTruthy();
    expect(registerRes.body.data.user.email).toBe(credentials.email);

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-password" });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.errorCode).toBe("INVALID_CREDENTIALS");

    const goodLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.data.accessToken).toBeTruthy();
  });

  it("rejects requests to protected routes without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("NO_TOKEN");
  });

  it("never stores the plaintext password", async () => {
    await request(app).post("/api/auth/register").send({ ...credentials, email: "plain@example.com" });
    const { User } = await import("../models/User");
    const user = await User.findOne({ email: "plain@example.com" }).select("+passwordHash");
    expect(user!.passwordHash).not.toBe(credentials.password);
    expect(user!.passwordHash.length).toBeGreaterThan(20);
  });
});

describe("cross-user ownership", () => {
  async function registerAndLogin(email: string) {
    const res = await request(app).post("/api/auth/register").send({ ...credentials, email });
    return res.body.data.accessToken as string;
  }

  it("prevents one user from reading another user's habit", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const createRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Private Habit",
        startDate: "2024-01-01",
        schedule: { type: "daily", daysOfWeek: [], specificDates: [] },
      });
    expect(createRes.status).toBe(201);
    const habitId = createRes.body.data._id;

    const stolenRes = await request(app).get(`/api/habits/${habitId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(stolenRes.status).toBe(404);
    expect(stolenRes.body.errorCode).toBe("HABIT_NOT_FOUND");

    const ownRes = await request(app).get(`/api/habits/${habitId}`).set("Authorization", `Bearer ${tokenA}`);
    expect(ownRes.status).toBe(200);
  });
});
