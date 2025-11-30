import type { CommonOptions } from "@probitas/client";

/**
 * TLS/SSL configuration for MySQL connections.
 */
export interface MySqlTlsConfig {
  /** Root CA certificate (PEM format). */
  readonly ca?: string;
  /** Client certificate (PEM format). */
  readonly cert?: string;
  /** Client private key (PEM format). */
  readonly key?: string;
  /** Skip server certificate verification (use only for testing). */
  readonly rejectUnauthorized?: boolean;
}

/**
 * Connection pool configuration.
 */
export interface MySqlPoolConfig {
  /**
   * Maximum number of connections in the pool.
   * @default 10
   */
  readonly connectionLimit?: number;

  /**
   * Minimum number of idle connections.
   * @default 0
   */
  readonly minConnections?: number;

  /**
   * Maximum number of connection requests the pool will queue.
   * @default 0 (unlimited)
   */
  readonly queueLimit?: number;

  /**
   * Whether to wait for connections to become available.
   * @default true
   */
  readonly waitForConnections?: boolean;

  /**
   * Time in milliseconds before connection is considered idle.
   * @default 10000
   */
  readonly idleTimeout?: number;
}

/**
 * Detailed connection configuration for MySQL.
 */
export interface MySqlConnectionConfig {
  /** MySQL server hostname. */
  readonly host: string;

  /**
   * MySQL server port.
   * @default 3306
   */
  readonly port?: number;

  /** Database user. */
  readonly user: string;

  /** Database password. */
  readonly password?: string;

  /** Database name. */
  readonly database: string;

  /** TLS/SSL configuration. */
  readonly tls?: MySqlTlsConfig;

  /**
   * Enable multiple statements in a single query.
   * @default false
   */
  readonly multipleStatements?: boolean;
}

/**
 * Configuration for creating a MySQL client.
 */
export interface MySqlClientConfig extends CommonOptions {
  /**
   * Connection configuration.
   * Can be a connection URL string (e.g., "mysql://user:pass@host:port/database")
   * or a detailed ConnectionConfig object.
   */
  readonly connection: string | MySqlConnectionConfig;

  /** Connection pool configuration. */
  readonly pool?: MySqlPoolConfig;

  /** Character set for the connection. */
  readonly charset?: string;

  /** Timezone for the connection. */
  readonly timezone?: string;
}
