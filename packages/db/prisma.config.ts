import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local from apps/web (for local development)
// On Vercel, env vars are injected directly into process.env
dotenv.config({ path: path.resolve(__dirname, "../../apps/web/.env.local") });

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
