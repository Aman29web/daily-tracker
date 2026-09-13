import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { JournalEntry } from "../models/JournalEntry";

const app = createApp();

async function registerAndLogin(email: string) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Journal Tester",
    email,
    password: "Passw0rd1",
    timezone: "UTC",
  });
  return res.body.data.accessToken as string;
}

describe("journal same-day lock", () => {
  it("creates and edits today's entry, but rejects writes to a different date", async () => {
    const token = await registerAndLogin("journal-today@example.com");
    const today = new Date().toISOString().slice(0, 10);

    const create = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: today, wentWell: "Shipped the feature" });
    expect(create.status).toBe(200);

    const edit = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: today, wentWell: "Shipped the feature and reviewed a PR" });
    expect(edit.status).toBe(200);
    expect(edit.body.data.wentWell).toBe("Shipped the feature and reviewed a PR");

    const wrongDate = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2020-01-01", wentWell: "Backdated attempt" });
    expect(wrongDate.status).toBe(400);
    expect(wrongDate.body.errorCode).toBe("JOURNAL_LOCKED");
  });

  it("locks a past entry from edits via PATCH /journal/:id once its day has passed", async () => {
    const token = await registerAndLogin("journal-past@example.com");
    const { User } = await import("../models/User");
    const user = await User.findOne({ email: "journal-past@example.com" });

    // Simulate an entry written yesterday by inserting it directly (bypassing the same-day-only create path).
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const entry = await JournalEntry.create({ userId: user!._id, date: yesterday, wentWell: "Old reflection" });

    const res = await request(app)
      .patch(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ wentWell: "Trying to edit an old entry" });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("JOURNAL_LOCKED");

    const unchanged = await JournalEntry.findById(entry._id);
    expect(unchanged!.wentWell).toBe("Old reflection");
  });
});
