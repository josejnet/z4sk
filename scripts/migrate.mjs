import { runMigrations } from "./migrations.mjs";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await runMigrations(process.env.DATABASE_URL);

