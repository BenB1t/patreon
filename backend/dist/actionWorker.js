"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startActionWorker = startActionWorker;
exports.processPendingActions = processPendingActions;
const actionQueueRepo_1 = require("./actionQueueRepo");
const actionExecutors_1 = require("./actionExecutors");
const ACTION_BATCH_LIMIT = 10;
const WORKER_INTERVAL_MS = 5_000;
function startActionWorker() {
    let isRunning = false;
    const tick = async () => {
        if (isRunning) {
            return;
        }
        isRunning = true;
        try {
            await processPendingActions();
        }
        catch (error) {
            console.error("Action worker tick failed", error);
        }
        finally {
            isRunning = false;
        }
    };
    void tick();
    const timer = setInterval(() => {
        void tick();
    }, WORKER_INTERVAL_MS);
    return () => {
        clearInterval(timer);
    };
}
async function processPendingActions() {
    const pending = await (0, actionQueueRepo_1.fetchPendingActions)(ACTION_BATCH_LIMIT);
    for (const action of pending) {
        await handleAction(action);
    }
}
async function handleAction(action) {
    const attempts = action.attempts + 1;
    try {
        const result = await (0, actionExecutors_1.runWithExecutor)(action);
        if (result.success) {
            await (0, actionQueueRepo_1.markActionSuccess)(action.id, attempts);
        }
        else {
            await (0, actionQueueRepo_1.markActionFailure)(action.id, attempts, result.errorMessage ?? "Execution failed");
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown execution error";
        await (0, actionQueueRepo_1.markActionFailure)(action.id, attempts, message);
    }
}
//# sourceMappingURL=actionWorker.js.map