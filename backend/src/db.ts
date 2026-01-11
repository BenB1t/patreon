import { Pool, PoolClient } from "pg";

import { requireEnv } from "./types";

const pool = new Pool({
  connectionString: requireEnv("DATABASE_URL"),
  max: 10,
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then((client: PoolClient) => {
    client.release();
  })
  .catch((error: unknown) => {
    console.error("Failed to initialize Postgres connection pool", error);
    process.exit(1);
  });

// Touch the database immediately so boot fails fast on bad credentials.
export default pool;
