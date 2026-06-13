import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.env",
);

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
