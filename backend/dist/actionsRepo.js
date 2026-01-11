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
    await db_1.default.query(`INSERT INTO actions (event_id, action_type, creator_id, patron_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`, [eventId, actionType, creatorId, patronId ?? null, metadata]);
}
//# sourceMappingURL=actionsRepo.js.map