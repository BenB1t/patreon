"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const types_1 = require("../types");
const apiKey = (0, types_1.requireEnv)("SENDGRID_API_KEY");
const sender = (0, types_1.requireEnv)("EMAIL_FROM");
mail_1.default.setApiKey(apiKey);
async function sendEmail(input) {
    if (!input.to || input.to.length === 0) {
        throw new Error("Recipient email is required");
    }
    const message = {
        to: input.to,
        from: sender,
        subject: input.subject,
        text: input.text ?? " ",
    };
    if (typeof input.html === "string") {
        message.html = input.html;
    }
    try {
        await mail_1.default.send(message);
    }
    catch (error) {
        const err = error;
        console.error("SendGrid sendEmail failed", {
            message: err.message,
            responseBody: err.response?.body,
        });
        throw new Error("Failed to send email via SendGrid");
    }
}
//# sourceMappingURL=sendgridEmail.js.map