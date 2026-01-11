"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEvent = evaluateEvent;
const RULE_TARGET_TYPE = "patron.intent.manage_membership";
const ACTION_OFFER_PAUSE = "offer_pause";
// Deterministic evaluation keeps reasoning predictable and testable.
function evaluateEvent(event) {
    if (event.type === RULE_TARGET_TYPE) {
        return {
            actionType: ACTION_OFFER_PAUSE,
            metadata: {
                source: event.source,
                evaluatedAt: event.createdAt.toISOString(),
            },
        };
    }
    return null;
}
//# sourceMappingURL=decisionEngine.js.map