import pool from "./db";
import { EventInsert } from "./types";

// Centralize event persistence so future logic can compose around one choke point.
export async function insertEvent(event: EventInsert): Promise<void> {
  const { type, source, creatorId, patronId, payload } = event;

  await pool.query(
    `INSERT INTO events (type, source, creator_id, patron_id, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [type, source, creatorId, patronId ?? null, payload]
  );
}
