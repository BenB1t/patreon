"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExecutor = resolveExecutor;
exports.runWithExecutor = runWithExecutor;
const emailExecutor_1 = require("./emailExecutor");
const executors = new Map();
function register(executor) {
    executors.set(executor.actionType, executor);
}
register(new emailExecutor_1.EmailExecutor());
function resolveExecutor(actionType) {
    return executors.get(actionType);
}
async function runWithExecutor(action) {
    const executor = resolveExecutor(action.type);
    if (!executor) {
        return {
            success: false,
            errorMessage: `No executor registered for action type ${action.type}`,
        };
    }
    return executor.execute(action);
}
//# sourceMappingURL=index.js.map