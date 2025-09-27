import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",          // path to your schema file
  out: "./drizzle",                  // migrations folder
  dialect: "postgresql",             // required
  dbCredentials: {
    url: process.env.DATABASE_URL!,  // must be "postgresql://..."
  },
  verbose: true,
  strict: true,
});
