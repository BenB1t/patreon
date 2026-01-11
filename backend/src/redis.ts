import { Redis } from "@upstash/redis";

import { requireEnv } from "./types";

const redisClient = new Redis({
  url: requireEnv("UPSTASH_REDIS_REST_URL"),
  token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
});

// Keep a single client instance so connection reuse stays predictable under load.
export default redisClient;
