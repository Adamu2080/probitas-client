import { AbortError, ClientError, TimeoutError } from "@probitas/client";
import type { HttpResponse } from "./types.ts";

/**
 * Options for HttpError constructor.
 */
export interface HttpErrorOptions extends ErrorOptions {
  /** Associated HTTP response */
  readonly response?: HttpResponse;
}

/**
 * Base HTTP error class.
 */
export class HttpError extends ClientError {
  override readonly name: string = "HttpError";
  override readonly kind = "http" as const;

  /** HTTP status code */
  readonly status: number;

  /** HTTP status text */
  readonly statusText: string;

  /** Associated HTTP response (if available) */
  readonly response?: HttpResponse;

  constructor(
    message: string,
    status: number,
    statusText: string,
    options?: HttpErrorOptions,
  ) {
    super(message, "http", options);
    this.status = status;
    this.statusText = statusText;
    this.response = options?.response;
  }
}

/**
 * HTTP 400 Bad Request error.
 */
export class HttpBadRequestError extends HttpError {
  override readonly name = "HttpBadRequestError";
  override readonly status = 400 as const;
  override readonly statusText = "Bad Request";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 400, "Bad Request", options);
  }
}

/**
 * HTTP 401 Unauthorized error.
 */
export class HttpUnauthorizedError extends HttpError {
  override readonly name = "HttpUnauthorizedError";
  override readonly status = 401 as const;
  override readonly statusText = "Unauthorized";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 401, "Unauthorized", options);
  }
}

/**
 * HTTP 403 Forbidden error.
 */
export class HttpForbiddenError extends HttpError {
  override readonly name = "HttpForbiddenError";
  override readonly status = 403 as const;
  override readonly statusText = "Forbidden";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 403, "Forbidden", options);
  }
}

/**
 * HTTP 404 Not Found error.
 */
export class HttpNotFoundError extends HttpError {
  override readonly name = "HttpNotFoundError";
  override readonly status = 404 as const;
  override readonly statusText = "Not Found";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 404, "Not Found", options);
  }
}

/**
 * HTTP 409 Conflict error.
 */
export class HttpConflictError extends HttpError {
  override readonly name = "HttpConflictError";
  override readonly status = 409 as const;
  override readonly statusText = "Conflict";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 409, "Conflict", options);
  }
}

/**
 * HTTP 429 Too Many Requests error.
 */
export class HttpTooManyRequestsError extends HttpError {
  override readonly name = "HttpTooManyRequestsError";
  override readonly status = 429 as const;
  override readonly statusText = "Too Many Requests";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 429, "Too Many Requests", options);
  }
}

/**
 * HTTP 500 Internal Server Error.
 */
export class HttpInternalServerError extends HttpError {
  override readonly name = "HttpInternalServerError";
  override readonly status = 500 as const;
  override readonly statusText = "Internal Server Error";

  constructor(message: string, options?: HttpErrorOptions) {
    super(message, 500, "Internal Server Error", options);
  }
}

/**
 * Error thrown when a network-level failure occurs.
 *
 * This error indicates that the request could not be processed by the server
 * due to network issues (connection refused, DNS resolution failure, etc.).
 */
export class HttpNetworkError extends ClientError {
  override readonly name = "HttpNetworkError";
  override readonly kind = "network" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, "network", options);
  }
}

/**
 * Error types that indicate an operation was processed by the server.
 * These errors occur after the HTTP request reaches the server.
 */
export type HttpOperationError =
  | HttpBadRequestError
  | HttpUnauthorizedError
  | HttpForbiddenError
  | HttpNotFoundError
  | HttpConflictError
  | HttpTooManyRequestsError
  | HttpInternalServerError
  | HttpError;

/**
 * Error types that indicate the operation was not processed.
 * These are errors that occur before the request reaches the server.
 */
export type HttpFailureError =
  | HttpNetworkError
  | AbortError
  | TimeoutError;
