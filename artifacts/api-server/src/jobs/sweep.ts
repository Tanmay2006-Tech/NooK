import { db, desksTable, sessionsTable } from "@workspace/db";
import { eq, and, inArray, lt, isNotNull, isNull } from "drizzle-orm";
import { logger } from "../lib/logger";

const SWEEP_INTERVAL_MS = 60 * 1000;
const AWAY_TIMEOUT_MINUTES = 20;
const PROMPT_TIMEOUT_MINUTES = 10;

async function sweep() {
  const now = new Date();

  try {
    const activeSessions = await db.query.sessionsTable.findMany({
      where: inArray(sessionsTable.status, ["active", "away"]),
    });

    const toAbandon: number[] = [];
    const deskIdsToFree: string[] = [];

    for (const session of activeSessions) {
      if (session.status === "away" && session.awayExpiresAt) {
        if (session.awayExpiresAt < now) {
          toAbandon.push(session.id);
          deskIdsToFree.push(session.deskId);
          continue;
        }
      }

      if (session.status === "active") {
        if (session.sessionExpiresAt < now) {
          if (
            session.promptSentAt &&
            !session.promptRespondedAt &&
            new Date(session.promptSentAt.getTime() + PROMPT_TIMEOUT_MINUTES * 60 * 1000) < now
          ) {
            toAbandon.push(session.id);
            deskIdsToFree.push(session.deskId);
          } else if (!session.promptSentAt) {
            await db
              .update(sessionsTable)
              .set({ promptSentAt: now })
              .where(eq(sessionsTable.id, session.id));
          }
        }
      }
    }

    if (toAbandon.length > 0) {
      await db
        .update(sessionsTable)
        .set({ status: "abandoned", releasedAt: now })
        .where(inArray(sessionsTable.id, toAbandon));

      for (const deskId of deskIdsToFree) {
        await db
          .update(desksTable)
          .set({ status: "free" })
          .where(eq(desksTable.id, deskId));
      }

      logger.info(
        { count: toAbandon.length, deskIds: deskIdsToFree },
        "Sweep: abandoned sessions freed"
      );
    }
  } catch (err) {
    logger.error({ err }, "Sweep job error");
  }
}

export function startSweepJob() {
  logger.info("Starting desk sweep job");
  sweep();
  setInterval(sweep, SWEEP_INTERVAL_MS);
}
