import { Buffer } from "node:buffer";
import { createServer as createHttpServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { URL } from "node:url";

import pool from "./db";
import redisClient from "./redis";
import { ErrorResponse, HealthResponse, JsonResponse } from "./types";

const HEALTH_KEY_TTL_SECONDS = 60;

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const method = req.method ?? "GET";
    const rawUrl = req.url ?? "/";
    const url = new URL(rawUrl, "http://localhost");

    if (method === "GET" && url.pathname === "/health") {
      await handleHealth(res);
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
