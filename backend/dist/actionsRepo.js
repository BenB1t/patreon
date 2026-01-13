"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertAction = insertAction;
const db_1 = __importDefault(require("./db"));
// Keep action writes isolated so auditability stays straightforward.
async function insertAction(action) {
    const { eventId, actionType, creatorId, patronId, metadata } = action;
    const result = await db_1.default.query(`INSERT INTO actions (event_id, action_type, creator_id, patron_id, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`, [eventId, actionType, creatorId, patronId ?? null, metadata]);
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
//# sourceMappingURL=actionsRepo.js.map