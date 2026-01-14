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
const zod_1 = require("zod");
const actionsRepo_1 = require("./actionsRepo");
const actionQueueRepo_1 = require("./actionQueueRepo");
const decisionEngine_1 = require("./decisionEngine");
const db_1 = __importDefault(require("./db"));
const eventsRepo_1 = require("./eventsRepo");
const retentionEvents_1 = require("./retention/retentionEvents");
const redis_1 = __importDefault(require("./redis"));
const HEALTH_KEY_TTL_SECONDS = 60;
const ACTION_COOLDOWN_SECONDS = 7 * 24 * 60 * 60;
const eventSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    source: zod_1.z.string().min(1),
    creatorId: zod_1.z.string().min(1),
    patronId: zod_1.z.string().min(1).optional(),
    payload: zod_1.z.unknown().refine((value) => value !== undefined, {
        message: "payload is required",
    }),
});
const paymentFailedWebhookSchema = zod_1.z.object({
    patronEmail: zod_1.z.string().email(),
    creatorName: zod_1.z.string().min(1),
});
async function handleRequest(req, res) {
    try {
        const method = req.method ?? "GET";
        const rawUrl = req.url ?? "/";
        const url = new node_url_1.URL(rawUrl, "http://localhost");
        if (method === "GET" && url.pathname === "/health") {
            await handleHealth(res);
            return;
        }
        if (method === "POST" && url.pathname === "/events") {
            await handleEventIngest(req, res);
            return;
        }
        if (method === "POST" && url.pathname === "/webhooks/payment-failed") {
            await handlePaymentFailedWebhook(req, res);
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
async function handleEventIngest(req, res) {
    try {
        const rawBody = await readRequestBody(req);
        if (rawBody.length === 0) {
            sendJson(res, 400, { status: "error", message: "Request body required" });
            return;
        }
        let parsedBody;
        try {
            parsedBody = JSON.parse(rawBody);
        }
        catch {
            sendJson(res, 400, { status: "error", message: "Invalid JSON payload" });
            return;
        }
        const validationResult = eventSchema.safeParse(parsedBody);
        if (!validationResult.success) {
            sendJson(res, 400, { status: "error", message: "Invalid event payload" });
            return;
        }
        const persistedEvent = await (0, eventsRepo_1.insertEvent)(validationResult.data);
        await processEventDecision(persistedEvent);
        sendJson(res, 202, { status: "ok" });
    }
    catch (error) {
        console.error("Event ingestion failed", error);
        sendJson(res, 500, { status: "error", message: "Unable to ingest event" });
    }
}
async function handlePaymentFailedWebhook(req, res) {
    try {
        const rawBody = await readRequestBody(req);
        if (rawBody.length === 0) {
            sendJson(res, 400, { status: "error", message: "Request body required" });
            return;
        }
        let parsedBody;
        try {
            parsedBody = JSON.parse(rawBody);
        }
        catch {
            sendJson(res, 400, { status: "error", message: "Invalid JSON payload" });
            return;
        }
        const validationResult = paymentFailedWebhookSchema.safeParse(parsedBody);
        if (!validationResult.success) {
            sendJson(res, 400, { status: "error", message: "Invalid event payload" });
            return;
        }
        const { patronEmail, creatorName } = validationResult.data;
        await (0, retentionEvents_1.handleRetentionEvent)({
            type: retentionEvents_1.RetentionEventType.PAYMENT_FAILED,
            patronEmail,
            creatorName,
        });
        sendJson(res, 200, { status: "ok" });
    }
    catch (error) {
        console.error("Payment failed webhook handling error", error);
        sendJson(res, 500, { status: "error", message: "Unable to process webhook" });
    }
}
async function processEventDecision(event) {
    const decision = (0, decisionEngine_1.evaluateEvent)(event);
    if (!decision) {
        return;
    }
    const { actionType, metadata } = decision;
    const patronId = event.patronId;
    if (patronId) {
        const cooldownKey = buildCooldownKey(event.creatorId, patronId, actionType);
        const cooldownResult = await redis_1.default.set(cooldownKey, "1", {
            ex: ACTION_COOLDOWN_SECONDS,
            nx: true,
        });
        if (cooldownResult !== "OK") {
            await (0, actionsRepo_1.insertAction)({
                eventId: event.id,
                actionType: "suppressed",
                creatorId: event.creatorId,
                patronId,
                metadata: {
                    reason: "cooldown_active",
                    suppressedActionType: actionType,
                    cooldownKey,
                },
            });
            return;
        }
    }
    const persistedAction = await (0, actionsRepo_1.insertAction)({
        eventId: event.id,
        actionType,
        creatorId: event.creatorId,
        patronId,
        metadata,
    });
    const payload = buildEmailPayload(event, persistedAction.id, metadata);
    await (0, actionQueueRepo_1.enqueueAction)({
        type: "SEND_EMAIL",
        payload,
    });
}
function buildEmailPayload(event, actionId, decisionMetadata) {
    const emailFromMetadata = decisionMetadata["email"];
    const recipientEmail = typeof emailFromMetadata === "string" && emailFromMetadata.length > 0
        ? emailFromMetadata
        : `${event.patronId ?? "patron"}@example.com`;
    const templateName = typeof decisionMetadata["template"] === "string" ? decisionMetadata["template"] : "offer_pause";
    return {
        email: recipientEmail,
        subject: "We'd love to keep you around",
        body: `Hi there! We noticed some activity that suggests you might pause your support. Template: ${templateName}.`,
        metadata: {
            actionId,
            eventId: event.id,
            creatorId: event.creatorId,
            patronId: event.patronId,
            template: templateName,
        },
    };
}
function buildCooldownKey(creatorId, patronId, actionType) {
    return `cooldown:${creatorId}:${patronId}:${actionType}`;
}
async function readRequestBody(req) {
    return await new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => {
            chunks.push(typeof chunk === "string" ? node_buffer_1.Buffer.from(chunk) : chunk);
        });
        req.on("end", () => {
            resolve(node_buffer_1.Buffer.concat(chunks).toString("utf8"));
        });
        req.on("error", (error) => {
            reject(error);
        });
        req.on("aborted", () => {
            reject(new Error("Request aborted"));
        });
    });
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