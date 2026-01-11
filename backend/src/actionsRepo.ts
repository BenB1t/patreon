import pool from "./db";
import { ActionInsert } from "./types";

// Keep action writes isolated so auditability stays straightforward.
export async function insertAction(action: ActionInsert): Promise<void> {
  const { eventId, actionType, creatorId, patronId, metadata } = action;

  await pool.query(
    `INSERT INTO actions (event_id, action_type, creator_id, patron_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [eventId, actionType, creatorId, patronId ?? null, metadata]
  );
}
