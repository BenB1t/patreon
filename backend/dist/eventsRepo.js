"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertEvent = insertEvent;
const db_1 = __importDefault(require("./db"));
// Centralize event persistence so future logic can compose around one choke point.
async function insertEvent(event) {
    const { type, source, creatorId, patronId, payload } = event;
    const result = await db_1.default.query(`INSERT INTO events (type, source, creator_id, patron_id, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, source, creator_id AS "creatorId", patron_id AS "patronId", payload, created_at AS "createdAt"`, [type, source, creatorId, patronId ?? null, payload]);
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
//# sourceMappingURL=eventsRepo.js.map