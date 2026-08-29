import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env first, then .env.local overrides (supports both setups)
config({ path: ".env" });
config({ path: ".env.local", override: true });

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
