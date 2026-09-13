import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

async function registerAndLogin(email: string) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Query Param Tester",
    email,
    password: "Passw0rd1",
    timezone: "UTC",
  });
  return res.body.data.accessToken as string;
}

describe("boolean query params (?flag=false must not coerce to true)", () => {
  it("a newly created (non-archived) plan shows up under ?isArchived=false", async () => {
    const token = await registerAndLogin("bool-plan@example.com");

    const created = await request(app).post("/api/plans").set("Authorization", `Bearer ${token}`).send({ name: "Fitness Plan" });
    expect(created.status).toBe(201);

    const list = await request(app).get("/api/plans?isArchived=false").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].name).toBe("Fitness Plan");
  });

  it("a newly created (active) habit shows up under ?isActive=true, not ?isActive=false", async () => {
    const token = await registerAndLogin("bool-habit@example.com");

    const created = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Gym",
        startDate: "2024-01-01",
        schedule: { type: "daily", daysOfWeek: [], specificDates: [] },
      });
    expect(created.status).toBe(201);

    const activeList = await request(app).get("/api/habits?isActive=true").set("Authorization", `Bearer ${token}`);
    expect(activeList.body.data).toHaveLength(1);

    const inactiveList = await request(app).get("/api/habits?isActive=false").set("Authorization", `Bearer ${token}`);
    expect(inactiveList.body.data).toHaveLength(0);
  });
});
