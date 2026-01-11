import "dotenv/config";

import { startServer } from "./server";

const DEFAULT_PORT = 3000;

function resolvePort(rawValue: string | undefined): number {
  if (!rawValue) {
    return DEFAULT_PORT;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${rawValue}`);
  }

  return parsed;
}

async function bootstrap(): Promise<void> {
  const port = resolvePort(process.env.PORT);

  try {
    await startServer(port);
    console.log(`HTTP server listening on port ${port}`);
  } catch (error) {
    console.error("Server failed to start", error);
    process.exit(1);
  }
}

// Ensure asynchronous errors bubble up instead of being swallowed silently.
bootstrap().catch((error) => {
  console.error("Unexpected bootstrap failure", error);
  process.exit(1);
});
