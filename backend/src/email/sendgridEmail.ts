import sgMail from "@sendgrid/mail";

import { requireEnv } from "../types";

const apiKey = requireEnv("SENDGRID_API_KEY");
const sender = requireEnv("EMAIL_FROM");

sgMail.setApiKey(apiKey);

interface SendEmailInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!input.to || input.to.length === 0) {
    throw new Error("Recipient email is required");
  }

  const message = {
    to: input.to,
    from: sender,
    subject: input.subject,
    text: input.text ?? " ",
  } as sgMail.MailDataRequired;

  if (typeof input.html === "string") {
    message.html = input.html;
  }

  try {
    await sgMail.send(message);
  } catch (error) {
    const err = error as Error & { response?: { body?: unknown } };
    console.error("SendGrid sendEmail failed", {
      message: err.message,
      responseBody: err.response?.body,
    });
    throw new Error("Failed to send email via SendGrid");
  }
}
