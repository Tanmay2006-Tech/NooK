import { Router } from "express";
import { db, desksTable, sessionsTable } from "@workspace/db";
import { gte, inArray } from "drizzle-orm";

const router = Router();

router.get("/analytics", async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Current desk snapshot
  const desks = await db.query.desksTable.findMany();

  // All sessions from today
  const todaySessions = await db.query.sessionsTable.findMany({
    where: gte(sessionsTable.checkinAt, startOfDay),
  });

  // Completed sessions (released or abandoned) for avg duration
  const completedToday = todaySessions.filter(
    (s) => (s.status === "released" || s.status === "abandoned") && s.releasedAt
  );
  const avgSessionMinutes =
    completedToday.length > 0
      ? completedToday.reduce((sum, s) => {
          const dur =
            (s.releasedAt!.getTime() - s.checkinAt.getTime()) / 60000;
          return sum + dur;
        }, 0) / completedToday.length
      : 0;

  // Active sessions per desk
  const activeSessions = await db.query.sessionsTable.findMany({
    where: inArray(sessionsTable.status, ["active", "away"]),
  });
  const activeByDesk = new Set(activeSessions.map((s) => s.deskId));

  // By floor
  const floorTotals: Record<number, { total: number; occupied: number; away: number; free: number }> = {};
  for (const desk of desks) {
    const f = desk.floor;
    if (!floorTotals[f]) floorTotals[f] = { total: 0, occupied: 0, away: 0, free: 0 };
    floorTotals[f].total++;
    if (desk.status === "occupied") floorTotals[f].occupied++;
    else if (desk.status === "away") floorTotals[f].away++;
    else floorTotals[f].free++;
  }
  const byFloor = [1, 2, 3].map((floor) => ({
    floor,
    ...(floorTotals[floor] ?? { total: 0, occupied: 0, away: 0, free: 0 }),
  }));

  // By hour (0–23)
  const hourBuckets: Record<number, number> = {};
  for (const s of todaySessions) {
    const h = s.checkinAt.getHours();
    hourBuckets[h] = (hourBuckets[h] ?? 0) + 1;
  }
  const byHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sessions: hourBuckets[i] ?? 0,
  })).filter((h) => h.hour >= 7 && h.hour <= 22);

  // By zone
  const zoneMap: Record<string, { zone: string; zoneName: string; floor: number; total: number; occupied: number; away: number }> = {};
  for (const desk of desks) {
    if (!zoneMap[desk.zone]) {
      zoneMap[desk.zone] = { zone: desk.zone, zoneName: desk.zoneName, floor: desk.floor, total: 0, occupied: 0, away: 0 };
    }
    zoneMap[desk.zone].total++;
    if (desk.status === "occupied") zoneMap[desk.zone].occupied++;
    else if (desk.status === "away") zoneMap[desk.zone].away++;
  }
  const byZone = Object.values(zoneMap).sort((a, b) => {
    const aRate = (a.occupied + a.away) / a.total;
    const bRate = (b.occupied + b.away) / b.total;
    return bRate - aRate;
  });

  res.json({
    activeNow: desks.filter((d) => d.status === "occupied").length,
    freeNow: desks.filter((d) => d.status === "free").length,
    awayNow: desks.filter((d) => d.status === "away").length,
    totalSessionsToday: todaySessions.length,
    abandonedToday: todaySessions.filter((s) => s.status === "abandoned").length,
    avgSessionMinutes: Math.round(avgSessionMinutes),
    byFloor,
    byHour,
    byZone,
  });
});

export default router;
