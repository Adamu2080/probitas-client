import {
  ConstraintError,
  DeadlockError,
  QuerySyntaxError,
  SqlError,
  type SqlErrorOptions,
} from "@probitas/client-sql";

/**
 * MySQL-specific error kinds.
 */
export type MySqlErrorKind = "access_denied" | "connection_refused";

/**
 * Options for MySqlError constructor.
 */
export interface MySqlErrorOptions extends SqlErrorOptions {
  /** MySQL error code (e.g., 1045, 1062). */
  readonly errno?: number;
}

/**
 * Base error class for MySQL-specific errors.
 * Extends SqlError with MySQL-specific properties like errno.
 */
export class MySqlError extends SqlError {
  override readonly name: string = "MySqlError";
  readonly errno?: number;

  constructor(
    message: string,
    options?: MySqlErrorOptions,
  ) {
    super(message, "unknown", options);
    this.errno = options?.errno;
  }
}

/**
 * Error thrown when access is denied (wrong credentials).
 */
export class AccessDeniedError extends MySqlError {
  override readonly name = "AccessDeniedError";
  readonly mysqlKind = "access_denied" as const;

  constructor(message: string, options?: MySqlErrorOptions) {
    super(message, options);
  }
}

/**
 * Error thrown when connection is refused.
 */
export class ConnectionRefusedError extends MySqlError {
  override readonly name = "ConnectionRefusedError";
  readonly mysqlKind = "connection_refused" as const;

  constructor(message: string, options?: MySqlErrorOptions) {
    super(message, options);
  }
}

// MySQL Error Codes
// See: https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html
const ER_ACCESS_DENIED_ERROR = 1045;
const ER_DUP_ENTRY = 1062;
const ER_NO_REFERENCED_ROW_2 = 1452;
const ER_ROW_IS_REFERENCED_2 = 1451;
const ER_LOCK_DEADLOCK = 1213;
const ER_PARSE_ERROR = 1064;
const ER_CHECK_CONSTRAINT_VIOLATED = 3819;

/**
 * Convert a mysql2 error to the appropriate error class.
 */
export function convertMySqlError(error: unknown): SqlError {
  if (!(error instanceof Error)) {
    return new MySqlError(String(error));
  }

  // mysql2 errors have errno and sqlState properties
  const err = error as Error & {
    errno?: number;
    sqlState?: string;
    code?: string;
  };

  const options: MySqlErrorOptions = {
    cause: error,
    errno: err.errno,
    sqlState: err.sqlState,
  };

  // Check for connection errors first
  if (err.code === "ECONNREFUSED") {
    return new ConnectionRefusedError(err.message, options);
  }

  if (err.errno === ER_ACCESS_DENIED_ERROR) {
    return new AccessDeniedError(err.message, options);
  }

  if (err.errno === ER_PARSE_ERROR) {
    return new QuerySyntaxError(err.message, options);
  }

  if (
    err.errno === ER_DUP_ENTRY ||
    err.errno === ER_NO_REFERENCED_ROW_2 ||
    err.errno === ER_ROW_IS_REFERENCED_2 ||
    err.errno === ER_CHECK_CONSTRAINT_VIOLATED
  ) {
    // Extract constraint name from error message if possible
    const constraintMatch = err.message.match(
      /for key '([^']+)'|CONSTRAINT `([^`]+)`/,
    );
    const constraint = constraintMatch?.[1] ?? constraintMatch?.[2] ??
      "unknown";
    return new ConstraintError(err.message, constraint, options);
  }

  if (err.errno === ER_LOCK_DEADLOCK) {
    return new DeadlockError(err.message, options);
  }

  return new MySqlError(err.message, options);
}
