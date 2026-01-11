export type RequiredEnvKey =
  | "UPSTASH_REDIS_REST_URL"
  | "UPSTASH_REDIS_REST_TOKEN"
  | "DATABASE_URL";

export type OptionalEnvKey = "PORT";

export interface HealthResponse {
  status: "ok";
}

export interface ErrorResponse {
  status: "error";
  message?: string;
}

export type JsonResponse = HealthResponse | ErrorResponse;

export interface EventInsert {
  type: string;
  source: string;
  creatorId: string;
  patronId?: string;
  payload: unknown;
}

export type EventRecord = EventInsert & {
  id: number;
  createdAt: Date;
};

export interface ActionInsert {
  eventId: number;
  actionType: string;
  creatorId: string;
  patronId?: string;
  metadata: Record<string, unknown>;
}

export interface ActionDecision {
  actionType: string;
  metadata: Record<string, unknown>;
}

export function requireEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Missing environment variable: ${key}`);
}
