/**
 * Retry configuration options.
 */
export interface RetryOptions {
  /**
   * Maximum number of attempts (1 = no retry).
   * @default 1
   */
  readonly maxAttempts?: number;

  /**
   * Backoff strategy.
   * @default "exponential"
   */
  readonly backoff?: "linear" | "exponential";

  /**
   * Initial delay in milliseconds.
   * @default 1000
   */
  readonly initialDelay?: number;

  /**
   * Maximum delay in milliseconds.
   * @default 30000
   */
  readonly maxDelay?: number;

  /**
   * Function to determine if the error should trigger a retry.
   */
  readonly retryOn?: (error: Error) => boolean;
}

/**
 * Common options shared across all clients.
 */
export interface CommonOptions {
  /**
   * Timeout in milliseconds.
   */
  readonly timeout?: number;

  /**
   * AbortSignal for cancellation.
   */
  readonly signal?: AbortSignal;

  /**
   * Retry configuration.
   */
  readonly retry?: RetryOptions;
}
