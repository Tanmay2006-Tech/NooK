import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const desksTable = pgTable("desks", {
  id: text("id").primaryKey(),
  floor: integer("floor").notNull().default(1),
  zone: text("zone").notNull(),
  zoneName: text("zone_name").notNull(),
  amenities: text("amenities").array().notNull().default([]),
  status: text("status").notNull().default("free"),
});

export const insertDeskSchema = createInsertSchema(desksTable);
export type InsertDesk = z.infer<typeof insertDeskSchema>;
export type Desk = typeof desksTable.$inferSelect;
