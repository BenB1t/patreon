import { sendEmail } from "../email/sendgridEmail";

export enum RetentionEventType {
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PATRON_DISENGAGING = "PATRON_DISENGAGING",
}

interface RetentionEventInput {
  type: RetentionEventType;
  patronEmail: string;
  creatorName: string;
}

export async function handleRetentionEvent(event: RetentionEventInput): Promise<void> {
  switch (event.type) {
    case RetentionEventType.PAYMENT_FAILED:
      await handlePaymentFailed(event);
      return;
    default:
      console.info("Retention event ignored", { type: event.type });
  }
}

async function handlePaymentFailed(event: RetentionEventInput): Promise<void> {
  const subject = "Your membership is about to lapse";
  const body = `Hi there,

It looks like your recent payment to ${event.creatorName} didn’t go through. If you’d still like to keep the benefits you enjoy, you can update your payment method anytime.

Thanks for supporting creators!`;

  await sendEmail({
    to: event.patronEmail,
    subject,
    text: body,
  });
}
