import { EmailExecutor } from "./emailExecutor";
import { ActionExecutionResult, ActionQueueExecutor, QueuedAction } from "../types";

const executors = new Map<string, ActionQueueExecutor>();

function register(executor: ActionQueueExecutor): void {
  executors.set(executor.actionType, executor);
}

register(new EmailExecutor());

export function resolveExecutor(actionType: string): ActionQueueExecutor | undefined {
  return executors.get(actionType);
}

export async function runWithExecutor(action: QueuedAction): Promise<ActionExecutionResult> {
  const executor = resolveExecutor(action.type);

  if (!executor) {
    return {
      success: false,
      errorMessage: `No executor registered for action type ${action.type}`,
    };
  }

  return executor.execute(action);
}
