import { fetchPendingActions, markActionFailure, markActionSuccess, recordActionAttempt } from "./actionQueueRepo";
import { runWithExecutor } from "./actionExecutors";
import { QueuedAction } from "./types";

const ACTION_BATCH_LIMIT = 10;
const WORKER_INTERVAL_MS = 5_000;
const MAX_ACTION_ATTEMPTS = 3;

export function startActionWorker(): () => void {
  let isRunning = false;

  const tick = async (): Promise<void> => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    try {
      await processPendingActions();
    } catch (error) {
      console.error("Action worker tick failed", error);
    } finally {
      isRunning = false;
    }
  };

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, WORKER_INTERVAL_MS);

  return (): void => {
    clearInterval(timer);
  };
}

export async function processPendingActions(): Promise<void> {
  const pending = await fetchPendingActions(ACTION_BATCH_LIMIT);
  if (pending.length === 0) {
    return;
  }

  for (const action of pending) {
    await handleAction(action);
  }
}

async function handleAction(action: QueuedAction): Promise<void> {
  if (action.attempts >= MAX_ACTION_ATTEMPTS) {
    await markActionFailure(action.id, action.attempts, "Retry limit exceeded");
    return;
  }

  const attempts = action.attempts + 1;

  try {
    const result = await runWithExecutor(action);
    if (result.success) {
      await markActionSuccess(action.id, attempts);
    } else {
      await handleExecutionFailure(action.id, attempts, result.errorMessage ?? "Execution failed");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown execution error";
    await handleExecutionFailure(action.id, attempts, message);
  }
}

async function handleExecutionFailure(actionId: number, attempts: number, message: string): Promise<void> {
  if (attempts >= MAX_ACTION_ATTEMPTS) {
    await markActionFailure(actionId, attempts, message);
    return;
  }

  await recordActionAttempt(actionId, attempts, message);
}
