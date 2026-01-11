"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.startServer = startServer;
const node_buffer_1 = require("node:buffer");
const node_http_1 = require("node:http");
const node_url_1 = require("node:url");
const db_1 = __importDefault(require("./db"));
const redis_1 = __importDefault(require("./redis"));
const HEALTH_KEY_TTL_SECONDS = 60;
async function handleRequest(req, res) {
    try {
        const method = req.method ?? "GET";
        const rawUrl = req.url ?? "/";
        const url = new node_url_1.URL(rawUrl, "http://localhost");
        if (method === "GET" && url.pathname === "/health") {
            await handleHealth(res);
            return;
        }
        sendJson(res, 404, { status: "error", message: "Not Found" });
    }
    catch (error) {
        console.error("Request handling failed", error);
        sendJson(res, 500, { status: "error", message: "Internal Server Error" });
    }
}
async function handleHealth(res) {
    try {
        const key = `health:${Date.now().toString(36)}`;
        await redis_1.default.set(key, "ok", { ex: HEALTH_KEY_TTL_SECONDS });
        await db_1.default.query("SELECT 1");
        const payload = { status: "ok" };
        sendJson(res, 200, payload);
    }
    catch (error) {
        console.error("Health check failed", error);
        const payload = { status: "error", message: "Dependency check failed" };
        sendJson(res, 500, payload);
    }
}
function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Content-Length": node_buffer_1.Buffer.byteLength(body),
    });
    res.end(body);
}
function createServer() {
    const server = (0, node_http_1.createServer)((req, res) => {
        void handleRequest(req, res);
    });
    return server;
}
function startServer(port) {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.on("error", (error) => {
            reject(error);
        });
        server.listen(port, () => {
            resolve(server);
        });
    });
}
//# sourceMappingURL=server.js.map