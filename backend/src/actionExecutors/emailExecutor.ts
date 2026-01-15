import { sendEmail } from "../email/sendgridEmail";
import { ActionExecutionResult, ActionQueueExecutor, EmailActionPayload, QueuedAction } from "../types";

function validatePayload(payload: unknown): payload is EmailActionPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const candidate = payload as Partial<EmailActionPayload>;
  return (
    typeof candidate.email === "string" &&
    candidate.email.length > 0 &&
    typeof candidate.subject === "string" &&
    typeof candidate.body === "string"
  );
}

export class EmailExecutor implements ActionQueueExecutor {
  public readonly actionType = "SEND_EMAIL";

  public async execute(action: QueuedAction): Promise<ActionExecutionResult> {
    if (!validatePayload(action.payload)) {
      return {
        success: false,
        errorMessage: "Invalid email payload",
      };
    }

    try {
      await sendEmail({
        to: action.payload.email,
        subject: action.payload.subject,
        text: action.payload.body,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email failure";
      return {
        success: false,
        errorMessage: message,
      };
    }
  }
}
