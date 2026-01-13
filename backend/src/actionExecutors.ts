import { ActionExecutor, ActionRecord } from "./types";

const executors: Record<string, ActionExecutor> = {};

class OfferPauseExecutor implements ActionExecutor {
  public readonly actionType = "offer_pause";

  // Logging-only placeholder keeps executions idempotent until providers are wired up.
  public async execute(action: ActionRecord): Promise<void> {
    console.info("[executor:offer_pause] executing intent", {
      actionId: action.id,
      eventId: action.eventId,
      creatorId: action.creatorId,
      patronId: action.patronId,
      metadata: action.metadata,
      createdAt: action.createdAt.toISOString(),
    });
  }
}

const offerPauseExecutor = new OfferPauseExecutor();
executors[offerPauseExecutor.actionType] = offerPauseExecutor;

export async function executeAction(action: ActionRecord): Promise<void> {
  const executor = executors[action.actionType];
  if (!executor) {
    console.info("No executor registered for action", {
      actionId: action.id,
      actionType: action.actionType,
    });
    return;
  }

  try {
    await executor.execute(action);
  } catch (error) {
    console.error("Action execution failed", {
      actionId: action.id,
      actionType: action.actionType,
      error,
    });
  }
}
