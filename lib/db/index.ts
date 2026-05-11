import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use a placeholder URL at build time; real queries only run at request time
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://build:build@localhost/build";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
