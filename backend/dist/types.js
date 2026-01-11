"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEnv = requireEnv;
function requireEnv(key) {
    const value = process.env[key];
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    throw new Error(`Missing environment variable: ${key}`);
}
//# sourceMappingURL=types.js.map