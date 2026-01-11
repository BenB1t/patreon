import { QueryResult } from "pg";

import pool from "./db";
import { EventInsert, EventRecord } from "./types";

interface EventRow {
  id: number;
  type: string;
  source: string;
  creatorId: string;
  patronId: string | null;
  payload: unknown;
  createdAt: string;
}

// Centralize event persistence so future logic can compose around one choke point.
export async function insertEvent(event: EventInsert): Promise<EventRecord> {
  const { type, source, creatorId, patronId, payload } = event;

  const result: QueryResult<EventRow> = await pool.query(
    `INSERT INTO events (type, source, creator_id, patron_id, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, source, creator_id AS "creatorId", patron_id AS "patronId", payload, created_at AS "createdAt"`,
    [type, source, creatorId, patronId ?? null, payload]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to persist event");
  }

  return {
    id: row.id,
    type: row.type,
    source: row.source,
    creatorId: row.creatorId,
    patronId: row.patronId ?? undefined,
    payload: row.payload,
    createdAt: new Date(row.createdAt),
  };
}
