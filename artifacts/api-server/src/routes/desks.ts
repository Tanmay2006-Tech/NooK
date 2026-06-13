import { Router } from "express";
import { db, desksTable, sessionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function getDeskWithSession(deskId: string) {
  const desk = await db.query.desksTable.findFirst({
    where: eq(desksTable.id, deskId),
  });
  if (!desk) return null;

  const session = await db.query.sessionsTable.findFirst({
    where: and(
      eq(sessionsTable.deskId, deskId),
      inArray(sessionsTable.status, ["active", "away"])
    ),
    orderBy: (s, { desc }) => [desc(s.checkinAt)],
  });

  return { ...desk, session: session ?? null };
}

router.get("/desks", async (req, res) => {
  const floor = req.query["floor"] ? Number(req.query["floor"]) : undefined;

  const desks = await db.query.desksTable.findMany({
    where: floor !== undefined ? eq(desksTable.floor, floor) : undefined,
    orderBy: (d, { asc }) => [asc(d.id)],
  });

  const deskIds = desks.map((d) => d.id);
  const sessions =
    deskIds.length > 0
      ? await db.query.sessionsTable.findMany({
          where: and(
            inArray(sessionsTable.deskId, deskIds),
            inArray(sessionsTable.status, ["active", "away"])
          ),
        })
      : [];

  const sessionByDesk: Record<string, (typeof sessions)[0]> = {};
  for (const s of sessions) {
    sessionByDesk[s.deskId] = s;
  }

  const result = desks.map((d) => ({
    ...d,
    session: sessionByDesk[d.id] ?? null,
  }));

  res.json(result);
});

router.get("/desks/:deskId", async (req, res) => {
  const desk = await getDeskWithSession(req.params["deskId"]!);
  if (!desk) {
    res.status(404).json({ error: "Desk not found" });
    return;
  }
  res.json(desk);
});

router.post("/desks/:deskId/checkin", async (req, res) => {
  const deskId = req.params["deskId"]!;
  const { studentName } = req.body as { studentName?: string };

  if (!studentName?.trim()) {
    res.status(400).json({ error: "studentName is required" });
    return;
  }

  const desk = await db.query.desksTable.findFirst({
    where: eq(desksTable.id, deskId),
  });

  if (!desk) {
    res.status(404).json({ error: "Desk not found" });
    return;
  }

  if (desk.status !== "free") {
    res.status(400).json({ error: `Desk is currently ${desk.status}` });
    return;
  }

  const now = new Date();
  const sessionExpiresAt = addHours(now, 2);

  await db.insert(sessionsTable).values({
    deskId,
    studentName: studentName.trim(),
    checkinAt: now,
    sessionExpiresAt,
    status: "active",
  });

  await db
    .update(desksTable)
    .set({ status: "occupied" })
    .where(eq(desksTable.id, deskId));

  const updated = await getDeskWithSession(deskId);
  res.json(updated);
});

router.post("/desks/:deskId/away", async (req, res) => {
  const deskId = req.params["deskId"]!;

  const desk = await db.query.desksTable.findFirst({
    where: eq(desksTable.id, deskId),
  });
  if (!desk) {
    res.status(404).json({ error: "Desk not found" });
    return;
  }

  const session = await db.query.sessionsTable.findFirst({
    where: and(
      eq(sessionsTable.deskId, deskId),
      eq(sessionsTable.status, "active")
    ),
  });

  if (!session) {
    res.status(400).json({ error: "No active session for this desk" });
    return;
  }

  const now = new Date();
  const awayExpiresAt = addMinutes(now, 20);

  await db
    .update(sessionsTable)
    .set({ status: "away", awayAt: now, awayExpiresAt })
    .where(eq(sessionsTable.id, session.id));

  await db
    .update(desksTable)
    .set({ status: "away" })
    .where(eq(desksTable.id, deskId));

  const updated = await getDeskWithSession(deskId);
  res.json(updated);
});

router.post("/desks/:deskId/respond", async (req, res) => {
  const deskId = req.params["deskId"]!;

  const desk = await db.query.desksTable.findFirst({
    where: eq(desksTable.id, deskId),
  });
  if (!desk) {
    res.status(404).json({ error: "Desk not found" });
    return;
  }

  const session = await db.query.sessionsTable.findFirst({
    where: and(
      eq(sessionsTable.deskId, deskId),
      inArray(sessionsTable.status, ["active", "away"])
    ),
  });

  if (!session) {
    res.status(400).json({ error: "No active session for this desk" });
    return;
  }

  const now = new Date();
  const newExpiry = addHours(now, 2);

  await db
    .update(sessionsTable)
    .set({
      status: "active",
      promptRespondedAt: now,
      sessionExpiresAt: newExpiry,
      awayAt: null,
      awayExpiresAt: null,
    })
    .where(eq(sessionsTable.id, session.id));

  await db
    .update(desksTable)
    .set({ status: "occupied" })
    .where(eq(desksTable.id, deskId));

  const updated = await getDeskWithSession(deskId);
  res.json(updated);
});

router.post("/desks/:deskId/release", async (req, res) => {
  const deskId = req.params["deskId"]!;

  const desk = await db.query.desksTable.findFirst({
    where: eq(desksTable.id, deskId),
  });
  if (!desk) {
    res.status(404).json({ error: "Desk not found" });
    return;
  }

  const session = await db.query.sessionsTable.findFirst({
    where: and(
      eq(sessionsTable.deskId, deskId),
      inArray(sessionsTable.status, ["active", "away"])
    ),
  });

  if (!session) {
    res.status(400).json({ error: "No active session for this desk" });
    return;
  }

  const now = new Date();
  await db
    .update(sessionsTable)
    .set({ status: "released", releasedAt: now })
    .where(eq(sessionsTable.id, session.id));

  await db
    .update(desksTable)
    .set({ status: "free" })
    .where(eq(desksTable.id, deskId));

  const updated = await getDeskWithSession(deskId);
  res.json(updated);
});

export default router;
