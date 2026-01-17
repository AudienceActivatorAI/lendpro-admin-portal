import { defineConfig } from "drizzle-kit";

const connectionString = process.env.ADMIN_DATABASE_URL;
if (!connectionString) {
  throw new Error("ADMIN_DATABASE_URL is required to run drizzle commands for admin portal");
}

export default defineConfig({
  schema: "./database/schema.ts",
  out: "./database/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
