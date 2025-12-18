import { AbortError, TimeoutError } from "@probitas/client";
import type {
  BodyInit,
  HttpClient,
  HttpClientConfig,
  HttpConnectionConfig,
  HttpOptions,
  QueryValue,
} from "./types.ts";
import type { HttpResponse } from "./response.ts";
import {
  HttpBadRequestError,
  HttpConflictError,
  HttpError,
  type HttpFailureError,
  HttpForbiddenError,
  HttpInternalServerError,
  HttpNetworkError,
  HttpNotFoundError,
  HttpTooManyRequestsError,
  HttpUnauthorizedError,
} from "./errors.ts";
import {
  createHttpResponseError,
  createHttpResponseFailure,
  createHttpResponseSuccess,
} from "./response.ts";
import { getLogger } from "@probitas/logger";

const logger = getLogger("probitas", "client", "http");

/**
 * Format request/response body for logging preview (truncated for large bodies).
 */
function formatBodyPreview(body: unknown): string | undefined {
  if (!body) return undefined;
  if (typeof body === "string") {
    return body.length > 500 ? body.slice(0, 500) + "..." : body;
  }
  if (body instanceof Uint8Array) {
    return `<binary ${body.length} bytes>`;
  }
  if (body instanceof FormData || body instanceof URLSearchParams) {
    return `<${body.constructor.name}>`;
  }
  try {
    const str = JSON.stringify(body);
    return str.length > 500 ? str.slice(0, 500) + "..." : str;
  } catch {
    return "<unserializable>";
  }
}

/**
 * Resolve URL from string or HttpConnectionConfig.
 */
function resolveBaseUrl(url: string | HttpConnectionConfig): string {
  if (typeof url === "string") {
    return url;
  }
  const protocol = url.protocol ?? "http";
  const host = url.host ?? "localhost";
  const port = url.port;
  const path = url.path ?? "";

  // Build URL with port if specified
  const portSuffix = port ? `:${port}` : "";
  return `${protocol}://${host}${portSuffix}${path}`;
}

/**
 * Build URL with query parameters.
 */
function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, QueryValue | QueryValue[]>,
): string {
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, String(v));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Convert BodyInit to fetch-compatible body and headers.
 */
function prepareBody(
  body?: BodyInit,
): { body?: BodyInit; headers?: Record<string, string> } {
  if (body === undefined) {
    return {};
  }

  if (typeof body === "string" || body instanceof Uint8Array) {
    return { body };
  }

  if (body instanceof FormData || body instanceof URLSearchParams) {
    return { body };
  }

  // Plain object - serialize as JSON
  return {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

/**
 * Merge headers from multiple sources.
 */
function mergeHeaders(
  ...sources: (Record<string, string> | undefined)[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const source of sources) {
    if (source) {
      Object.assign(result, source);
    }
  }
  return result;
}

/**
 * Serialize cookies to Cookie header value.
 */
function serializeCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/**
 * Parse Set-Cookie header value and extract cookie name/value.
 * Only extracts the name=value pair, ignoring attributes.
 */
function parseSetCookie(
  setCookie: string,
): { name: string; value: string } | null {
  const match = setCookie.match(/^([^=]+)=([^;]*)/);
  if (!match) return null;
  return { name: match[1].trim(), value: match[2].trim() };
}

/**
 * Format body detail for error message.
 */
function formatBodyDetail(bodyText: string | null): string {
  if (!bodyText) {
    return "";
  }

  // Try to parse as JSON and format with Deno.inspect
  let detail = bodyText;
  try {
    const parsed = JSON.parse(bodyText);
    detail = Deno.inspect(parsed, {
      compact: false,
      sorted: true,
      trailingComma: true,
    });
  } catch {
    // Not JSON, skip.
  }
  const indented = detail
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  return `\n\n${indented}`;
}

/**
 * Create appropriate HttpError based on status code.
 */
function createHttpError(
  status: number,
  statusText: string,
  bodyText: string | null,
): HttpError {
  const detail = formatBodyDetail(bodyText);
  const message = `${status}: ${statusText}${detail}`;

  switch (status) {
    case 400:
      return new HttpBadRequestError(message);
    case 401:
      return new HttpUnauthorizedError(message);
    case 403:
      return new HttpForbiddenError(message);
    case 404:
      return new HttpNotFoundError(message);
    case 409:
      return new HttpConflictError(message);
    case 429:
      return new HttpTooManyRequestsError(message);
    case 500:
      return new HttpInternalServerError(message);
    default:
      return new HttpError(message, status, statusText);
  }
}

/**
 * Convert fetch error to appropriate client error.
 */
function convertFetchError(error: unknown): HttpFailureError {
  if (error instanceof AbortError || error instanceof TimeoutError) {
    return error;
  }
  if (error instanceof HttpNetworkError) {
    return error;
  }
  if (error instanceof Error) {
    // AbortError from AbortSignal
    if (error.name === "AbortError") {
      return new AbortError("Request was aborted", { cause: error });
    }
    // TimeoutError (DOMException with TimeoutError name)
    if (error.name === "TimeoutError") {
      return new TimeoutError("Request timed out", 0, { cause: error });
    }
    // TypeError from fetch usually indicates network error
    if (error instanceof TypeError) {
      return new HttpNetworkError(
        `Connection failed: ${error.message}`,
        { cause: error },
      );
    }
    // DOMException for network errors
    if (error.name === "NetworkError") {
      return new HttpNetworkError(
        `Network error: ${error.message}`,
        { cause: error },
      );
    }
    // Wrap other errors in HttpNetworkError
    return new HttpNetworkError(error.message, { cause: error });
  }
  // Unknown error type
  return new HttpNetworkError(String(error));
}

/**
 * HttpClient implementation.
 */
class HttpClientImpl implements HttpClient {
  readonly config: HttpClientConfig;
  readonly #baseUrl: string;
  readonly #cookieJar: Map<string, string>;
  readonly #cookiesEnabled: boolean;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.#baseUrl = resolveBaseUrl(config.url);
    // Cookies are enabled by default
    this.#cookiesEnabled = !(config.cookies?.disabled ?? false);
    this.#cookieJar = new Map();

    // Log client creation
    logger.debug("HTTP client created", {
      url: this.#baseUrl,
      cookiesEnabled: this.#cookiesEnabled,
      redirect: config.redirect ?? "follow",
    });

    // Initialize with initial cookies if provided
    if (config.cookies?.initial) {
      for (const [name, value] of Object.entries(config.cookies.initial)) {
        this.#cookieJar.set(name, value);
      }
      logger.debug("Initial cookies set", {
        count: Object.keys(config.cookies.initial).length,
      });
    }
  }

  get(path: string, options?: HttpOptions): Promise<HttpResponse> {
    return this.#request("GET", path, undefined, options);
  }

  post(
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse> {
    return this.#request("POST", path, body, options);
  }

  put(
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse> {
    return this.#request("PUT", path, body, options);
  }

  patch(
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse> {
    return this.#request("PATCH", path, body, options);
  }

  delete(path: string, options?: HttpOptions): Promise<HttpResponse> {
    return this.#request("DELETE", path, undefined, options);
  }

  request(
    method: string,
    path: string,
    options?: HttpOptions & { body?: BodyInit },
  ): Promise<HttpResponse> {
    return this.#request(method, path, options?.body, options);
  }

  getCookies(): Record<string, string> {
    return Object.fromEntries(this.#cookieJar);
  }

  setCookie(name: string, value: string): void {
    if (!this.#cookiesEnabled) {
      throw new Error(
        "Cookie handling is disabled. Remove cookies.disabled: true from HttpClientConfig.",
      );
    }
    this.#cookieJar.set(name, value);
  }

  clearCookies(): void {
    this.#cookieJar.clear();
  }

  async #request(
    method: string,
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse> {
    const url = buildUrl(this.#baseUrl, path, options?.query);
    const prepared = prepareBody(body);
    const headers = mergeHeaders(
      this.config.headers,
      prepared.headers,
      options?.headers,
    );

    // Add Cookie header if cookies are enabled and jar is not empty
    if (this.#cookiesEnabled && this.#cookieJar.size > 0) {
      headers["Cookie"] = serializeCookies(Object.fromEntries(this.#cookieJar));
    }

    // Log request start
    logger.info("HTTP request starting", {
      method,
      url,
      headers: Object.keys(headers),
      hasBody: prepared.body !== undefined,
      queryParams: options?.query ? Object.keys(options.query) : [],
    });
    logger.trace("HTTP request details", {
      headers,
      bodyPreview: formatBodyPreview(prepared.body),
    });

    const fetchFn = this.config.fetch ?? globalThis.fetch;
    const redirect = options?.redirect ?? this.config.redirect ?? "follow";
    const startTime = performance.now();

    // Determine whether to throw on error (request option > config > default false)
    const shouldThrow = options?.throwOnError ?? this.config.throwOnError ??
      false;

    // Attempt fetch - may fail due to network errors
    let rawResponse: globalThis.Response;
    try {
      rawResponse = await fetchFn(url, {
        method,
        headers,
        body: prepared.body as globalThis.BodyInit,
        signal: options?.signal,
        redirect,
      });
    } catch (fetchError) {
      const duration = performance.now() - startTime;
      const error = convertFetchError(fetchError);

      // Return failure response or throw based on throwOnError
      if (shouldThrow) {
        throw error;
      }
      return createHttpResponseFailure(url, duration, error);
    }

    const duration = performance.now() - startTime;

    // Read body first (needed for both success/error response and error message)
    let responseBody: Uint8Array | null = null;
    if (rawResponse.body !== null) {
      const arrayBuffer = await rawResponse.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        responseBody = new Uint8Array(arrayBuffer);
      }
    }

    // Create appropriate response type based on status
    let response: HttpResponse;
    if (rawResponse.ok) {
      response = createHttpResponseSuccess(rawResponse, responseBody, duration);
    } else {
      const bodyText = responseBody
        ? new TextDecoder().decode(responseBody)
        : null;
      const httpError = createHttpError(
        rawResponse.status,
        rawResponse.statusText,
        bodyText,
      );
      response = createHttpResponseError(
        rawResponse,
        responseBody,
        duration,
        httpError,
      );
    }

    // Log response
    logger.info("HTTP response received", {
      method,
      url,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration.toFixed(2)}ms`,
      contentType: response.headers?.get("content-type"),
      contentLength: response.body?.length,
    });
    logger.trace("HTTP response details", {
      headers: Object.fromEntries(rawResponse.headers.entries()),
      bodyPreview: response.body ? formatBodyPreview(response.text) : undefined,
    });

    // Store cookies from Set-Cookie headers if cookies are enabled
    if (this.#cookiesEnabled) {
      // Use getSetCookie() if available (modern API), otherwise fallback to get()
      const setCookies = rawResponse.headers.getSetCookie?.() ??
        (rawResponse.headers.get("set-cookie")?.split(/,(?=\s*\w+=)/) ?? []);
      const parsedCount = setCookies.length;
      for (const cookieStr of setCookies) {
        const parsed = parseSetCookie(cookieStr.trim());
        if (parsed) {
          this.#cookieJar.set(parsed.name, parsed.value);
        }
      }
      if (parsedCount > 0) {
        logger.debug("Cookies received and stored", {
          count: parsedCount,
        });
      }
    }

    // Throw error if required
    if (!response.ok && shouldThrow) {
      throw response.error;
    }

    return response;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }
}

/**
 * Create a new HTTP client instance.
 *
 * The client provides methods for making HTTP requests with automatic
 * cookie handling, response body pre-loading, and error handling.
 *
 * @param config - Client configuration including URL and default options
 * @returns A new HTTP client instance
 *
 * @example Basic usage with string URL
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * const http = createHttpClient({ url: "http://localhost:3000" });
 *
 * const response = await http.get("/users/123");
 * console.log(response.json());
 *
 * await http.close();
 * ```
 *
 * @example With connection config object
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * const http = createHttpClient({
 *   url: { host: "api.example.com", port: 443, protocol: "https" },
 * });
 * await http.close();
 * ```
 *
 * @example With default headers
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * const http = createHttpClient({
 *   url: "http://localhost:3000",
 *   headers: {
 *     "Authorization": "Bearer token123",
 *     "Accept": "application/json",
 *   },
 * });
 * await http.close();
 * ```
 *
 * @example Using `await using` for automatic cleanup
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * await using http = createHttpClient({ url: "http://localhost:3000" });
 * const response = await http.get("/health");
 * console.log(response.ok);
 * ```
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClientImpl(config);
}
