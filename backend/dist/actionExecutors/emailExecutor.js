"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailExecutor = void 0;
const sendgridEmail_1 = require("../email/sendgridEmail");
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
class EmailExecutor {
    actionType = "SEND_EMAIL";
    async execute(action) {
        if (!validatePayload(action.payload)) {
            return {
                success: false,
                errorMessage: "Invalid email payload",
            };
        }
        try {
            await (0, sendgridEmail_1.sendEmail)({
                to: action.payload.email,
                subject: action.payload.subject,
                text: action.payload.body,
            });
            return { success: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown email failure";
            return {
                success: false,
                errorMessage: message,
            };
        }
    }
}
exports.EmailExecutor = EmailExecutor;
//# sourceMappingURL=emailExecutor.js.map