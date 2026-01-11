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

export function requireEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Missing environment variable: ${key}`);
}
