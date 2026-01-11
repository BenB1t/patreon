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
    await db_1.default.query(`INSERT INTO events (type, source, creator_id, patron_id, payload)
     VALUES ($1, $2, $3, $4, $5)`, [type, source, creatorId, patronId ?? null, payload]);
}
//# sourceMappingURL=eventsRepo.js.map