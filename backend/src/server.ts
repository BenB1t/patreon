import { Buffer } from "node:buffer";
import { createServer as createHttpServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { URL } from "node:url";
import { z } from "zod";

import { insertAction } from "./actionsRepo";
import { enqueueAction } from "./actionQueueRepo";
import { evaluateEvent } from "./decisionEngine";
import pool from "./db";
import { insertEvent } from "./eventsRepo";
import redisClient from "./redis";
import { ActionPayload, ErrorResponse, EventRecord, HealthResponse, JsonResponse } from "./types";

const HEALTH_KEY_TTL_SECONDS = 60;
const ACTION_COOLDOWN_SECONDS = 7 * 24 * 60 * 60;
const eventSchema = z.object({
  type: z.string().min(1),
  source: z.string().min(1),
  creatorId: z.string().min(1),
  patronId: z.string().min(1).optional(),
  payload: z.unknown().refine((value) => value !== undefined, {
    message: "payload is required",
  }),
});

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const method = req.method ?? "GET";
    const rawUrl = req.url ?? "/";
    const url = new URL(rawUrl, "http://localhost");

    if (method === "GET" && url.pathname === "/health") {
      await handleHealth(res);
      return;
    }

    if (method === "POST" && url.pathname === "/events") {
      await handleEventIngest(req, res);
      return;
    }

    sendJson(res, 404, { status: "error", message: "Not Found" });
  } catch (error) {
    console.error("Request handling failed", error);
    sendJson(res, 500, { status: "error", message: "Internal Server Error" });
  }
}

async function handleHealth(res: ServerResponse): Promise<void> {
  try {
    const key = `health:${Date.now().toString(36)}`;
    await redisClient.set(key, "ok", { ex: HEALTH_KEY_TTL_SECONDS });
    await pool.query("SELECT 1");

    const payload: HealthResponse = { status: "ok" };
    sendJson(res, 200, payload);
  } catch (error) {
    console.error("Health check failed", error);
    const payload: ErrorResponse = { status: "error", message: "Dependency check failed" };
    sendJson(res, 500, payload);
  }
}

async function handleEventIngest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const rawBody = await readRequestBody(req);
    if (rawBody.length === 0) {
      sendJson(res, 400, { status: "error", message: "Request body required" });
      return;
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      sendJson(res, 400, { status: "error", message: "Invalid JSON payload" });
      return;
    }

    const validationResult = eventSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      sendJson(res, 400, { status: "error", message: "Invalid event payload" });
      return;
    }

    const persistedEvent = await insertEvent(validationResult.data);
    await processEventDecision(persistedEvent);
    sendJson(res, 202, { status: "ok" });
  } catch (error) {
    console.error("Event ingestion failed", error);
    sendJson(res, 500, { status: "error", message: "Unable to ingest event" });
  }
}

async function processEventDecision(event: EventRecord): Promise<void> {
  const decision = evaluateEvent(event);
  if (!decision) {
    return;
  }

  const { actionType, metadata } = decision;
  const patronId = event.patronId;

  if (patronId) {
    const cooldownKey = buildCooldownKey(event.creatorId, patronId, actionType);
    const cooldownResult = await redisClient.set(cooldownKey, "1", {
      ex: ACTION_COOLDOWN_SECONDS,
      nx: true,
    });

    if (cooldownResult !== "OK") {
      await insertAction({
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

  const persistedAction = await insertAction({
    eventId: event.id,
    actionType,
    creatorId: event.creatorId,
    patronId,
    metadata,
  });

  const payload = buildEmailPayload(event, persistedAction.id, metadata);
  await enqueueAction({
    type: "SEND_EMAIL",
    payload,
  });
}

function buildEmailPayload(
  event: EventRecord,
  actionId: number,
  decisionMetadata: Record<string, unknown>
): ActionPayload {
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

function buildCooldownKey(creatorId: string, patronId: string, actionType: string): string {
  return `cooldown:${creatorId}:${patronId}:${actionType}`;
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("aborted", () => {
      reject(new Error("Request aborted"));
    });
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: JsonResponse): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export function createServer(): Server {
  const server = createHttpServer((req, res) => {
    void handleRequest(req, res);
  });

  return server;
}

export function startServer(port: number): Promise<Server> {
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
