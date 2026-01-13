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

// Placeholder executor keeps provider-specific code isolated for future integrations.
export class EmailExecutor implements ActionQueueExecutor {
  public readonly actionType = "SEND_EMAIL";

  public async execute(action: QueuedAction): Promise<ActionExecutionResult> {
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
