# Logging Rules

Logging conventions for Probitas packages.

## Library

Use `@probitas/logger` (internally powered by `@logtape/logtape`).

## Error Handling and Logging

**Do not log when returning/throwing errors.** The caller should handle logging
at the appropriate level.

Exception: When context would be lost (e.g., in deeply nested async operations),
use `debug` level to preserve diagnostic information.

```ts
import { getLogger } from "@probitas/logger";

interface Data {
  value: string;
}

interface Result {
  success: boolean;
}

interface Worker {
  process(data: Data): Promise<Result>;
}

const logger = getLogger("example");
const worker: Worker = {
  async process(data: Data): Promise<Result> {
    console.log(data);
    return { success: true };
  },
};
const workerId = "worker-1";

function doWork(data: Data): Result {
  console.log(data);
  return { success: true };
}

// Bad - Redundant logging
function processBad(data: Data): Result {
  try {
    return doWork(data);
  } catch (error) {
    logger.error("Process failed", { error }); // Don't log here
    throw error; // Caller will handle
  }
}

// Good - Let caller decide
function process(data: Data): Result {
  return doWork(data);
}

// Exception - Context would be lost
async function processInWorker(data: Data): Promise<Result> {
  try {
    return await worker.process(data);
  } catch (error) {
    // Debug log because worker context is lost when error crosses boundary
    logger.debug("Worker process failed", { workerId, data, error });
    throw error;
  }
}
```

## Log Level Conventions

This project separates logs into **developer-facing** and **end-user-facing**
categories. This differs from typical logging conventions.

### Developer-Facing (Package Internals)

For debugging and diagnosing the Probitas packages themselves:

| Level     | Purpose                                                  |
| --------- | -------------------------------------------------------- |
| **trace** | Byte sequences, detailed internal state, raw data dumps  |
| **debug** | Package behavior verification, internal flow diagnostics |
| **error** | Bugs in package code causing failures                    |
| **fatal** | Bugs in package code causing crashes                     |

Note: `debug` includes what typical logging frameworks call `info` for internal
operations.

### End-User-Facing (Scenario Execution)

For users debugging their own scenarios:

| Level    | Purpose                                                           |
| -------- | ----------------------------------------------------------------- |
| **info** | Scenario execution details, step progress, user-relevant context  |
| **warn** | Issues in user's scenario code, recoverable problems in scenarios |

Note: `info` includes what typical logging frameworks call `debug` for scenario
diagnostics.

## Summary Table

```
┌─────────────────────────────────────────────────────────────────┐
│                    Log Level Distribution                       │
├─────────────────────────────────────────────────────────────────┤
│  trace  │  debug  │  info   │  warn   │  error  │  fatal  │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│◄──── Developer (Package) ────►│◄─ User (Scenario) ─►│◄─ Dev ─►│
│         internals              │    execution        │  bugs   │
└─────────────────────────────────────────────────────────────────┘
```

## Examples

```ts
import { getLogger } from "@probitas/logger";

const logger = getLogger("probitas:runner");

const buffer = new Uint8Array([1, 2, 3]);
const stepName = "login";
const attempt = 2;
const backoff = 1000;
const state = "pending";
const expected = "running";
const details = { reason: "invariant violation" };

// Developer-facing: Package internals
logger.trace("Raw request bytes", { bytes: buffer });
logger.debug("Step retry triggered", { stepName, attempt, backoff });
logger.error("Unexpected state in runner", { state, expected });
logger.fatal("Runner crashed due to invalid invariant", { details });

const method = "GET";
const url = "http://example.com";
const headers = { "content-type": "application/json" };
const rawBody = '{"key":"value"}';
const status = 200;
const api = "oldMethod";
const suggestion = "Use newMethod instead";

// End-user-facing: Scenario execution (external system interactions)
logger.info("HTTP request", { method, url, headers, body: rawBody });
logger.info("HTTP response", { status, headers, body: rawBody });
logger.warn("Deprecated API used in scenario", { api, suggestion });
```

## What NOT to Log

- **Reporter output**: Don't log what Reporter already outputs (scenario
  execution, step results, etc.)
- **Expected behavior**: Don't log retries, timeouts, or other expected
  recoverable operations (use `debug` if needed for package debugging)
- **Redundant error context**: Don't log errors that will be thrown/returned to
  caller
