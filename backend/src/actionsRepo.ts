import { QueryResult } from "pg";

import pool from "./db";
import { ActionInsert, ActionRecord } from "./types";

// Keep action writes isolated so auditability stays straightforward.
export async function insertAction(action: ActionInsert): Promise<ActionRecord> {
  const { eventId, actionType, creatorId, patronId, metadata } = action;

  const result: QueryResult<{ id: number; created_at: string }> = await pool.query(
    `INSERT INTO actions (event_id, action_type, creator_id, patron_id, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [eventId, actionType, creatorId, patronId ?? null, metadata]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to persist action");
  }

  return {
    ...action,
    id: row.id,
    createdAt: new Date(row.created_at),
  };
}
