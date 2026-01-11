"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("@upstash/redis");
const types_1 = require("./types");
const redisClient = new redis_1.Redis({
    url: (0, types_1.requireEnv)("UPSTASH_REDIS_REST_URL"),
    token: (0, types_1.requireEnv)("UPSTASH_REDIS_REST_TOKEN"),
});
// Keep a single client instance so connection reuse stays predictable under load.
exports.default = redisClient;
//# sourceMappingURL=redis.js.map