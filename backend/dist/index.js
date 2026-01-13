"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const actionWorker_1 = require("./actionWorker");
const server_1 = require("./server");
const DEFAULT_PORT = 3000;
function resolvePort(rawValue) {
    if (!rawValue) {
        return DEFAULT_PORT;
    }
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error(`Invalid PORT value: ${rawValue}`);
    }
    return parsed;
}
async function bootstrap() {
    const port = resolvePort(process.env.PORT);
    try {
        await (0, server_1.startServer)(port);
        console.log(`HTTP server listening on port ${port}`);
        const stopWorker = (0, actionWorker_1.startActionWorker)();
        const shutdown = () => {
            stopWorker();
            process.exit(0);
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    }
    catch (error) {
        console.error("Server failed to start", error);
        process.exit(1);
    }
}
// Ensure asynchronous errors bubble up instead of being swallowed silently.
bootstrap().catch((error) => {
    console.error("Unexpected bootstrap failure", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map