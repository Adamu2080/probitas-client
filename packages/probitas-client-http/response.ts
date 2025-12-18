import type { ClientResult } from "@probitas/client";
import type { HttpFailureError } from "./errors.ts";

/**
 * Base interface for all HTTP response types.
 *
 * Provides common properties and methods shared by Success, Error, and Failure responses.
 */
interface HttpResponseBase extends ClientResult {
  /** Result kind discriminator. Always `"http"` for HTTP responses. */
  readonly kind: "http";

  /** Whether the request was processed by the server. */
  readonly processed: boolean;

  /** Whether the response was successful. */
  readonly ok: boolean;

  /** Error that occurred during the operation. */
  readonly error: Error | HttpFailureError | null;

  /** Response time in milliseconds. */
  readonly duration: number;

  /** Request URL. */
  readonly url: string;

  /** Response body as raw bytes (null if no body or failure). */
  readonly body: Uint8Array | null;

  /** Get body as ArrayBuffer (null if no body or failure). */
  arrayBuffer(): ArrayBuffer | null;

  /** Get body as Blob (null if no body or failure). */
  blob(): Blob | null;

  /** Get body as text (null if no body or failure). */
  text(): string | null;

  /**
   * Get body as parsed JSON (null if no body or failure).
   * @template T - defaults to any for test convenience
   */
  // deno-lint-ignore no-explicit-any
  json<T = any>(): T | null;

  /** Get raw Web standard Response (null for failure). */
  raw(): globalThis.Response | null;
}

/**
 * HTTP response for successful requests (2xx status codes).
 *
 * Wraps Web standard Response, allowing body to be read synchronously
 * and multiple times (unlike the streaming-based standard Response).
 */
export interface HttpResponseSuccess extends HttpResponseBase {
  /** Server processed the request. */
  readonly processed: true;

  /** Response was successful (2xx). */
  readonly ok: true;

  /** No error for successful responses. */
  readonly error: null;

  /** HTTP status code (200-299). */
  readonly status: number;

  /** HTTP status text. */
  readonly statusText: string;

  /** Response headers. */
  readonly headers: Headers;

  /** Get raw Web standard Response. */
  raw(): globalThis.Response;
}

/**
 * HTTP response for error responses (4xx/5xx status codes).
 *
 * Server received and processed the request, but returned an error status.
 */
export interface HttpResponseError extends HttpResponseBase {
  /** Server processed the request. */
  readonly processed: true;

  /** Response was not successful (4xx/5xx). */
  readonly ok: false;

  /** Error describing the HTTP error. */
  readonly error: Error;

  /** HTTP status code (4xx/5xx). */
  readonly status: number;

  /** HTTP status text. */
  readonly statusText: string;

  /** Response headers. */
  readonly headers: Headers;

  /** Get raw Web standard Response. */
  raw(): globalThis.Response;
}

/**
 * HTTP response for request failures (network errors, timeouts, etc.).
 *
 * Request could not be processed by the server (network error, DNS failure,
 * connection refused, timeout, aborted, etc.).
 */
export interface HttpResponseFailure extends HttpResponseBase {
  /** Server did not process the request. */
  readonly processed: false;

  /** Request failed. */
  readonly ok: false;

  /** Error describing the failure (ConnectionError, TimeoutError, AbortError). */
  readonly error: HttpFailureError;

  /** No HTTP status (request didn't reach server). */
  readonly status: null;

  /** No HTTP status text (request didn't reach server). */
  readonly statusText: null;

  /** No headers (request didn't reach server). */
  readonly headers: null;

  /** No body (request didn't reach server). */
  readonly body: null;

  /** No raw response (request didn't reach server). */
  raw(): null;
}

/**
 * HTTP response union type representing all possible response states.
 *
 * - **Success (2xx)**: `processed: true, ok: true, error: null`
 * - **Error (4xx/5xx)**: `processed: true, ok: false, error: Error`
 * - **Failure (network error)**: `processed: false, ok: false, error: Error`
 *
 * @example Type narrowing by ok
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * await using http = createHttpClient({ url: "http://localhost:3000" });
 * const response = await http.get("/users");
 * if (response.ok) {
 *   // TypeScript knows: HttpResponseSuccess
 *   console.log(response.status); // number
 * } else {
 *   // TypeScript knows: HttpResponseError | HttpResponseFailure
 *   console.log(response.error); // Error
 * }
 * ```
 *
 * @example Type narrowing by processed
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * await using http = createHttpClient({ url: "http://localhost:3000" });
 * const response = await http.get("/users");
 * if (response.processed) {
 *   // TypeScript knows: HttpResponseSuccess | HttpResponseError
 *   console.log(response.status); // number
 * } else {
 *   // TypeScript knows: HttpResponseFailure
 *   console.log(response.error); // Error (network error)
 * }
 * ```
 */
export type HttpResponse =
  | HttpResponseSuccess
  | HttpResponseError
  | HttpResponseFailure;

/**
 * Implementation of HttpResponseSuccess.
 */
class HttpResponseSuccessImpl implements HttpResponseSuccess {
  readonly kind = "http" as const;
  readonly processed = true as const;
  readonly ok = true as const;
  readonly error = null;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  readonly body: Uint8Array | null;
  readonly duration: number;

  #raw: globalThis.Response;
  #textCache: string | null | undefined;
  #jsonCache: unknown | undefined;
  #jsonParsed = false;

  constructor(
    raw: globalThis.Response,
    body: Uint8Array | null,
    duration: number,
  ) {
    this.status = raw.status;
    this.statusText = raw.statusText;
    this.headers = raw.headers;
    this.url = raw.url;
    this.body = body;
    this.duration = duration;
    this.#raw = raw;
  }

  raw(): globalThis.Response {
    return this.#raw;
  }

  arrayBuffer(): ArrayBuffer | null {
    if (this.body === null) {
      return null;
    }
    const buffer = new ArrayBuffer(this.body.byteLength);
    new Uint8Array(buffer).set(this.body);
    return buffer;
  }

  blob(): Blob | null {
    if (this.body === null) {
      return null;
    }
    const contentType = this.headers.get("content-type") ?? "";
    return new Blob([this.arrayBuffer()!], { type: contentType });
  }

  text(): string | null {
    if (this.body === null) {
      return null;
    }
    if (this.#textCache === undefined) {
      this.#textCache = new TextDecoder().decode(this.body);
    }
    return this.#textCache;
  }

  // deno-lint-ignore no-explicit-any
  json<T = any>(): T | null {
    if (this.body === null) {
      return null;
    }
    if (!this.#jsonParsed) {
      const textValue = this.text();
      this.#jsonCache = textValue !== null ? JSON.parse(textValue) : null;
      this.#jsonParsed = true;
    }
    return this.#jsonCache as T;
  }
}

/**
 * Implementation of HttpResponseError.
 */
class HttpResponseErrorImpl implements HttpResponseError {
  readonly kind = "http" as const;
  readonly processed = true as const;
  readonly ok = false as const;
  readonly error: Error;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  readonly body: Uint8Array | null;
  readonly duration: number;

  #raw: globalThis.Response;
  #textCache: string | null | undefined;
  #jsonCache: unknown | undefined;
  #jsonParsed = false;

  constructor(
    raw: globalThis.Response,
    body: Uint8Array | null,
    duration: number,
    error: Error,
  ) {
    this.error = error;
    this.status = raw.status;
    this.statusText = raw.statusText;
    this.headers = raw.headers;
    this.url = raw.url;
    this.body = body;
    this.duration = duration;
    this.#raw = raw;
  }

  raw(): globalThis.Response {
    return this.#raw;
  }

  arrayBuffer(): ArrayBuffer | null {
    if (this.body === null) {
      return null;
    }
    const buffer = new ArrayBuffer(this.body.byteLength);
    new Uint8Array(buffer).set(this.body);
    return buffer;
  }

  blob(): Blob | null {
    if (this.body === null) {
      return null;
    }
    const contentType = this.headers.get("content-type") ?? "";
    return new Blob([this.arrayBuffer()!], { type: contentType });
  }

  text(): string | null {
    if (this.body === null) {
      return null;
    }
    if (this.#textCache === undefined) {
      this.#textCache = new TextDecoder().decode(this.body);
    }
    return this.#textCache;
  }

  // deno-lint-ignore no-explicit-any
  json<T = any>(): T | null {
    if (this.body === null) {
      return null;
    }
    if (!this.#jsonParsed) {
      const textValue = this.text();
      this.#jsonCache = textValue !== null ? JSON.parse(textValue) : null;
      this.#jsonParsed = true;
    }
    return this.#jsonCache as T;
  }
}

/**
 * Implementation of HttpResponseFailure.
 */
class HttpResponseFailureImpl implements HttpResponseFailure {
  readonly kind = "http" as const;
  readonly processed = false as const;
  readonly ok = false as const;
  readonly error: HttpFailureError;
  readonly status = null;
  readonly statusText = null;
  readonly headers = null;
  readonly url: string;
  readonly body = null;
  readonly duration: number;

  constructor(url: string, duration: number, error: HttpFailureError) {
    this.url = url;
    this.duration = duration;
    this.error = error;
  }

  raw(): null {
    return null;
  }

  arrayBuffer(): null {
    return null;
  }

  blob(): null {
    return null;
  }

  text(): null {
    return null;
  }

  // deno-lint-ignore no-explicit-any
  json<T = any>(): T | null {
    return null;
  }
}

/**
 * Create HttpResponseSuccess with pre-loaded body.
 */
export function createHttpResponseSuccess(
  raw: globalThis.Response,
  body: Uint8Array | null,
  duration: number,
): HttpResponseSuccess {
  return new HttpResponseSuccessImpl(raw, body, duration);
}

/**
 * Create HttpResponseError with pre-loaded body.
 *
 * Use this when body is already consumed (e.g., for error message construction).
 */
export function createHttpResponseError(
  raw: globalThis.Response,
  body: Uint8Array | null,
  duration: number,
  error: Error,
): HttpResponseError {
  return new HttpResponseErrorImpl(raw, body, duration, error);
}

/**
 * Create HttpResponseFailure for network errors.
 *
 * Used when the request could not reach the server.
 */
export function createHttpResponseFailure(
  url: string,
  duration: number,
  error: HttpFailureError,
): HttpResponseFailure {
  return new HttpResponseFailureImpl(url, duration, error);
}

/**
 * @deprecated Use createHttpResponseSuccess or createHttpResponseError instead.
 * This function is kept for backward compatibility.
 */
export async function createHttpResponse(
  raw: globalThis.Response,
  duration: number,
): Promise<HttpResponse> {
  let body: Uint8Array | null = null;

  if (raw.body !== null) {
    const arrayBuffer = await raw.arrayBuffer();
    if (arrayBuffer.byteLength > 0) {
      body = new Uint8Array(arrayBuffer);
    }
  }

  if (raw.ok) {
    return new HttpResponseSuccessImpl(raw, body, duration);
  }
  const error = new Error(`HTTP ${raw.status}: ${raw.statusText}`);
  return createHttpResponseError(raw, body, duration, error);
}
