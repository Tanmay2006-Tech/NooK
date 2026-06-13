import { Router } from "express";
import { db, desksTable, sessionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

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

router.get("/librarian/desks", async (_req, res) => {
  const desks = await db.query.desksTable.findMany({
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

router.post("/librarian/desks/:deskId/reset", async (req, res) => {
  const deskId = req.params["deskId"]!;

  const desk = await db.query.desksTable.findFirst({
    where: eq(desksTable.id, deskId),
  });
  if (!desk) {
    res.status(404).json({ error: "Desk not found" });
    return;
  }

  const now = new Date();

  await db
    .update(sessionsTable)
    .set({ status: "released", releasedAt: now })
    .where(
      and(
        eq(sessionsTable.deskId, deskId),
        inArray(sessionsTable.status, ["active", "away"])
      )
    );

  await db
    .update(desksTable)
    .set({ status: "free" })
    .where(eq(desksTable.id, deskId));

  const updated = await getDeskWithSession(deskId);
  res.json(updated);
});

router.post("/librarian/desks/:deskId/alert", async (req, res) => {
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
    .set({ promptSentAt: now })
    .where(eq(sessionsTable.id, session.id));

  const updated = await getDeskWithSession(deskId);
  res.json(updated);
});

export default router;
