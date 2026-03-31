import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first with override so it takes precedence over .env
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] + "?sslmode=no-verify",
  },
});
