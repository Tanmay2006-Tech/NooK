import { db, desksTable } from "@workspace/db";
import { logger } from "../lib/logger";

const FLOOR_1 = [
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `W${i + 1}`, floor: 1, zone: "W", zoneName: "Window Row",
    amenities: ["power", "window", "wifi"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `Q${i + 1}`, floor: 1, zone: "Q", zoneName: "Quiet Zone",
    amenities: ["power", "quiet", "wifi"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `S${i + 1}`, floor: 1, zone: "S", zoneName: "Study Pods",
    amenities: ["power", "wifi"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `C${i + 1}`, floor: 1, zone: "C", zoneName: "Collaborative",
    amenities: ["wifi", "whiteboard"], status: "free" as const,
  })),
];

const FLOOR_2 = [
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `F${i + 1}`, floor: 2, zone: "F", zoneName: "Focus Booths",
    amenities: ["power", "monitor", "quiet"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `G${i + 1}`, floor: 2, zone: "G", zoneName: "Group Study",
    amenities: ["power", "wifi", "whiteboard"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `R${i + 1}`, floor: 2, zone: "R", zoneName: "Reading Nook",
    amenities: ["quiet", "wifi", "natural-light"], status: "free" as const,
  })),
];

const FLOOR_3 = [
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `P${i + 1}`, floor: 3, zone: "P", zoneName: "Seminar Pods",
    amenities: ["power", "wifi", "screen"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `L${i + 1}`, floor: 3, zone: "L", zoneName: "Lounge Area",
    amenities: ["wifi", "casual", "charging"], status: "free" as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `A${i + 1}`, floor: 3, zone: "A", zoneName: "Archive Alcoves",
    amenities: ["quiet", "power"], status: "free" as const,
  })),
];

const ALL_DESKS = [...FLOOR_1, ...FLOOR_2, ...FLOOR_3];

export async function seedDesks() {
  await db.insert(desksTable).values(ALL_DESKS).onConflictDoNothing();
  logger.info({ total: ALL_DESKS.length }, "Desk seed complete (upserted)");
}
