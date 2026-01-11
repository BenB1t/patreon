import { ActionDecision, EventRecord } from "./types";

const RULE_TARGET_TYPE = "patron.intent.manage_membership";
const ACTION_OFFER_PAUSE = "offer_pause";

// Deterministic evaluation keeps reasoning predictable and testable.
export function evaluateEvent(event: EventRecord): ActionDecision | null {
  if (event.type === RULE_TARGET_TYPE) {
    return {
      actionType: ACTION_OFFER_PAUSE,
      metadata: {
        source: event.source,
        evaluatedAt: event.createdAt.toISOString(),
      },
    };
  }

  return null;
}
