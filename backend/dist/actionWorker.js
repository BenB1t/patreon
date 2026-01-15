"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startActionWorker = startActionWorker;
exports.processPendingActions = processPendingActions;
const actionQueueRepo_1 = require("./actionQueueRepo");
const actionExecutors_1 = require("./actionExecutors");
const ACTION_BATCH_LIMIT = 10;
const WORKER_INTERVAL_MS = 5_000;
const MAX_ACTION_ATTEMPTS = 3;
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
    if (pending.length === 0) {
        return;
    }
    for (const action of pending) {
        await handleAction(action);
    }
}
async function handleAction(action) {
    if (action.attempts >= MAX_ACTION_ATTEMPTS) {
        await (0, actionQueueRepo_1.markActionFailure)(action.id, action.attempts, "Retry limit exceeded");
        return;
    }
    const attempts = action.attempts + 1;
    try {
        const result = await (0, actionExecutors_1.runWithExecutor)(action);
        if (result.success) {
            await (0, actionQueueRepo_1.markActionSuccess)(action.id, attempts);
        }
        else {
            await handleExecutionFailure(action.id, attempts, result.errorMessage ?? "Execution failed");
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown execution error";
        await handleExecutionFailure(action.id, attempts, message);
    }
}
async function handleExecutionFailure(actionId, attempts, message) {
    if (attempts >= MAX_ACTION_ATTEMPTS) {
        await (0, actionQueueRepo_1.markActionFailure)(actionId, attempts, message);
        return;
    }
    await (0, actionQueueRepo_1.recordActionAttempt)(actionId, attempts, message);
}
//# sourceMappingURL=actionWorker.js.map