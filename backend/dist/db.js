"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const types_1 = require("./types");
const pool = new pg_1.Pool({
    connectionString: (0, types_1.requireEnv)("DATABASE_URL"),
    max: 10,
    ssl: { rejectUnauthorized: false },
});
pool
    .connect()
    .then((client) => {
    client.release();
})
    .catch((error) => {
    console.error("Failed to initialize Postgres connection pool", error);
    process.exit(1);
});
// Touch the database immediately so boot fails fast on bad credentials.
exports.default = pool;
//# sourceMappingURL=db.js.map