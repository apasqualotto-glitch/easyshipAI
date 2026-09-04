import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Allow running without DB for local dev / demos.
  // drizzle-kit commands that need a DB will still require DATABASE_URL when you actually run them.
  console.warn("drizzle.config: No DATABASE_URL — some drizzle-kit commands will require it.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: databaseUrl ? { url: databaseUrl } : { url: "postgresql://user:pass@localhost:5432/dummy" },
});
