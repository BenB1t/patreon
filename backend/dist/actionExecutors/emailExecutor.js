"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailExecutor = void 0;
function validatePayload(payload) {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }
    const candidate = payload;
    return (typeof candidate.email === "string" &&
        candidate.email.length > 0 &&
        typeof candidate.subject === "string" &&
        typeof candidate.body === "string");
}
// Placeholder executor keeps provider-specific code isolated for future integrations.
class EmailExecutor {
    actionType = "SEND_EMAIL";
    async execute(action) {
        if (!validatePayload(action.payload)) {
            return {
                success: false,
                errorMessage: "Invalid email payload",
            };
        }
        console.info("[EmailExecutor] sending email", {
            actionId: action.id,
            to: action.payload.email,
            subject: action.payload.subject,
            metadata: action.payload.metadata,
        });
        return { success: true };
    }
}
exports.EmailExecutor = EmailExecutor;
//# sourceMappingURL=emailExecutor.js.map