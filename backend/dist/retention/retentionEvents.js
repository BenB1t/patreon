"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetentionEventType = void 0;
exports.handleRetentionEvent = handleRetentionEvent;
const sendgridEmail_1 = require("../email/sendgridEmail");
var RetentionEventType;
(function (RetentionEventType) {
    RetentionEventType["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    RetentionEventType["PATRON_DISENGAGING"] = "PATRON_DISENGAGING";
})(RetentionEventType || (exports.RetentionEventType = RetentionEventType = {}));
async function handleRetentionEvent(event) {
    switch (event.type) {
        case RetentionEventType.PAYMENT_FAILED:
            await handlePaymentFailed(event);
            return;
        default:
            console.info("Retention event ignored", { type: event.type });
    }
}
async function handlePaymentFailed(event) {
    const subject = "Your membership is about to lapse";
    const body = `Hi there,

It looks like your recent payment to ${event.creatorName} didn’t go through. If you’d still like to keep the benefits you enjoy, you can update your payment method anytime.

Thanks for supporting creators!`;
    await (0, sendgridEmail_1.sendEmail)({
        to: event.patronEmail,
        subject,
        text: body,
    });
}
//# sourceMappingURL=retentionEvents.js.map