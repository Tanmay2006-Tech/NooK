import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  deskId: text("desk_id").notNull(),
  studentName: text("student_name").notNull(),
  checkinAt: timestamp("checkin_at", { withTimezone: true }).notNull().defaultNow(),
  awayAt: timestamp("away_at", { withTimezone: true }),
  awayExpiresAt: timestamp("away_expires_at", { withTimezone: true }),
  sessionExpiresAt: timestamp("session_expires_at", { withTimezone: true }).notNull(),
  promptSentAt: timestamp("prompt_sent_at", { withTimezone: true }),
  promptRespondedAt: timestamp("prompt_responded_at", { withTimezone: true }),
  status: text("status").notNull().default("active"),
  releasedAt: timestamp("released_at", { withTimezone: true }),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
