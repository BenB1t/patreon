import { QueryResult } from "pg";

import pool from "./db";
import { ActionQueueInsert, ActionStatus, ActionPayload, QueuedAction } from "./types";

interface ActionRow {
  id: number;
  type: string;
  payload: ActionPayload;
  status: ActionStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ActionRow): QueuedAction {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function enqueueAction(action: ActionQueueInsert): Promise<QueuedAction> {
  const result: QueryResult<ActionRow> = await pool.query(
    `INSERT INTO action_queue (type, payload)
     VALUES ($1, $2)
     RETURNING id, type, payload, status, attempts, last_error, created_at, updated_at`,
    [action.type, action.payload]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to enqueue action");
  }

  return mapRow(row);
}

export async function fetchPendingActions(limit: number): Promise<QueuedAction[]> {
  const result: QueryResult<ActionRow> = await pool.query(
    `SELECT id, type, payload, status, attempts, last_error, created_at, updated_at
     FROM action_queue
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapRow);
}

export async function markActionSuccess(actionId: number, attempts: number): Promise<void> {
  await pool.query(
    `UPDATE action_queue
     SET status = 'success', attempts = $2, last_error = NULL, updated_at = NOW()
     WHERE id = $1`,
    [actionId, attempts]
  );
}

export async function markActionFailure(actionId: number, attempts: number, errorMessage: string): Promise<void> {
  await pool.query(
    `UPDATE action_queue
     SET status = 'failed', attempts = $2, last_error = $3, updated_at = NOW()
     WHERE id = $1`,
    [actionId, attempts, errorMessage]
  );
}

export async function recordActionAttempt(actionId: number, attempts: number, errorMessage: string): Promise<void> {
  await pool.query(
    `UPDATE action_queue
     SET attempts = $2, last_error = $3, updated_at = NOW()
     WHERE id = $1`,
    [actionId, attempts, errorMessage]
  );
}
