"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueAction = enqueueAction;
exports.fetchPendingActions = fetchPendingActions;
exports.markActionSuccess = markActionSuccess;
exports.markActionFailure = markActionFailure;
exports.recordActionAttempt = recordActionAttempt;
const db_1 = __importDefault(require("./db"));
function mapRow(row) {
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
async function enqueueAction(action) {
    const result = await db_1.default.query(`INSERT INTO action_queue (type, payload)
     VALUES ($1, $2)
     RETURNING id, type, payload, status, attempts, last_error, created_at, updated_at`, [action.type, action.payload]);
    const row = result.rows[0];
    if (!row) {
        throw new Error("Failed to enqueue action");
    }
    return mapRow(row);
}
async function fetchPendingActions(limit) {
    const result = await db_1.default.query(`SELECT id, type, payload, status, attempts, last_error, created_at, updated_at
     FROM action_queue
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT $1`, [limit]);
    return result.rows.map(mapRow);
}
async function markActionSuccess(actionId, attempts) {
    await db_1.default.query(`UPDATE action_queue
     SET status = 'success', attempts = $2, last_error = NULL, updated_at = NOW()
     WHERE id = $1`, [actionId, attempts]);
}
async function markActionFailure(actionId, attempts, errorMessage) {
    await db_1.default.query(`UPDATE action_queue
     SET status = 'failed', attempts = $2, last_error = $3, updated_at = NOW()
     WHERE id = $1`, [actionId, attempts, errorMessage]);
}
async function recordActionAttempt(actionId, attempts, errorMessage) {
    await db_1.default.query(`UPDATE action_queue
     SET attempts = $2, last_error = $3, updated_at = NOW()
     WHERE id = $1`, [actionId, attempts, errorMessage]);
}
//# sourceMappingURL=actionQueueRepo.js.map