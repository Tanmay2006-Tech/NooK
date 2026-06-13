import { Router } from "express";
import { db, desksTable, sessionsTable } from "@workspace/db";
import { inArray, eq } from "drizzle-orm";

const router = Router();

const DEMO_SESSIONS: { deskId: string; name: string; away?: boolean; minutesAgo?: number }[] = [
  // Floor 1 — Window Row (5/9 occupied)
  { deskId: "W1", name: "Arjun Sharma",    minutesAgo: 85 },
  { deskId: "W2", name: "Maya Okafor",     minutesAgo: 43 },
  { deskId: "W4", name: "Priya Patel",     minutesAgo: 112 },
  { deskId: "W6", name: "Josh Chen",       minutesAgo: 28, away: true },
  { deskId: "W8", name: "Sam Nguyen",      minutesAgo: 66 },
  // Floor 1 — Quiet Zone (4/9 occupied)
  { deskId: "Q1", name: "Emma Fischer",    minutesAgo: 54 },
  { deskId: "Q3", name: "Leo Andrade",     minutesAgo: 97 },
  { deskId: "Q5", name: "Zara Ahmed",      minutesAgo: 19 },
  { deskId: "Q8", name: "Max Kowalski",    minutesAgo: 73, away: true },
  // Floor 1 — Study Pods (3/9 occupied)
  { deskId: "S2", name: "Nina Fernandez",  minutesAgo: 38 },
  { deskId: "S5", name: "Kai Yamamoto",    minutesAgo: 61 },
  { deskId: "S9", name: "Aisha Mbeki",     minutesAgo: 15 },
  // Floor 1 — Collaborative (2/9 occupied)
  { deskId: "C3", name: "Tom Bradley",     minutesAgo: 47 },
  { deskId: "C7", name: "Layla Hassan",    minutesAgo: 22 },
  // Floor 2 — Focus Booths
  { deskId: "F1", name: "Ryan Park",       minutesAgo: 83 },
  { deskId: "F5", name: "Sofia Rossi",     minutesAgo: 34 },
  { deskId: "F8", name: "Omar Al-Rashid",  minutesAgo: 11, away: true },
  // Floor 2 — Group Study
  { deskId: "G2", name: "Chloe Martin",    minutesAgo: 58 },
  { deskId: "G7", name: "Dev Krishnan",    minutesAgo: 29 },
  // Floor 2 — Reading Nook
  { deskId: "R3", name: "Isabel Torres",   minutesAgo: 77 },
  // Floor 3 — Seminar Pods
  { deskId: "P1", name: "Luke Andersson",  minutesAgo: 44 },
  { deskId: "P6", name: "Fatima Siddiqui", minutesAgo: 92 },
  // Floor 3 — Lounge
  { deskId: "L4", name: "Chris Huang",     minutesAgo: 31 },
  // Floor 3 — Archive
  { deskId: "A2", name: "Ana Popescu",     minutesAgo: 56 },
];

router.post("/demo/seed", async (_req, res) => {
  const now = new Date();

  // 1. Release all currently active sessions
  const activeSessions = await db.query.sessionsTable.findMany({
    where: inArray(sessionsTable.status, ["active", "away"]),
  });
  const activeDeskIds = [...new Set(activeSessions.map((s) => s.deskId))];

  if (activeSessions.length > 0) {
    await db
      .update(sessionsTable)
      .set({ status: "released", releasedAt: now })
      .where(inArray(sessionsTable.status, ["active", "away"]));
  }
  if (activeDeskIds.length > 0) {
    await db
      .update(desksTable)
      .set({ status: "free" })
      .where(inArray(desksTable.id, activeDeskIds));
  }

  // 2. Seed demo sessions
  let seeded = 0;
  for (const demo of DEMO_SESSIONS) {
    const checkinAt = new Date(now.getTime() - (demo.minutesAgo ?? 30) * 60000);
    const sessionExpiresAt = new Date(checkinAt.getTime() + 2 * 60 * 60 * 1000);
    const sessionStatus = demo.away ? "away" : "active";
    const deskStatus = demo.away ? "away" : "occupied";
    const awayAt = demo.away ? new Date(now.getTime() - 5 * 60000) : null;
    const awayExpiresAt = demo.away ? new Date(now.getTime() + 15 * 60000) : null;

    // Verify desk exists before inserting
    const desk = await db.query.desksTable.findFirst({
      where: eq(desksTable.id, demo.deskId),
    });
    if (!desk) continue;

    await db.insert(sessionsTable).values({
      deskId: demo.deskId,
      studentName: demo.name,
      checkinAt,
      sessionExpiresAt,
      awayAt,
      awayExpiresAt,
      status: sessionStatus,
    });

    await db
      .update(desksTable)
      .set({ status: deskStatus })
      .where(eq(desksTable.id, demo.deskId));

    seeded++;
  }

  res.json({ seeded, cleared: activeSessions.length });
});

export default router;
