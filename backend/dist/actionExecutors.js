"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAction = executeAction;
const executors = {};
class OfferPauseExecutor {
    actionType = "offer_pause";
    // Logging-only placeholder keeps executions idempotent until providers are wired up.
    async execute(action) {
        console.info("[executor:offer_pause] executing intent", {
            actionId: action.id,
            eventId: action.eventId,
            creatorId: action.creatorId,
            patronId: action.patronId,
            metadata: action.metadata,
            createdAt: action.createdAt.toISOString(),
        });
    }
}
const offerPauseExecutor = new OfferPauseExecutor();
executors[offerPauseExecutor.actionType] = offerPauseExecutor;
async function executeAction(action) {
    const executor = executors[action.actionType];
    if (!executor) {
        console.info("No executor registered for action", {
            actionId: action.id,
            actionType: action.actionType,
        });
        return;
    }
    try {
        await executor.execute(action);
    }
    catch (error) {
        console.error("Action execution failed", {
            actionId: action.id,
            actionType: action.actionType,
            error,
        });
    }
}
//# sourceMappingURL=actionExecutors.js.map