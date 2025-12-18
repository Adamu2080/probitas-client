import type { ClientResult } from "@probitas/client";
import type { Document, MongoDocs } from "./types.ts";
import { MongoError, MongoNotFoundError } from "./errors.ts";

// =============================================================================
// Find Result Types
// =============================================================================

/**
 * Successful query result (find, aggregate).
 */
export interface MongoFindSuccess<T = Document> extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:find"` for MongoDB find operations.
   */
  readonly kind: "mongo:find";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * Array of documents matching the query.
   *
   * Includes helper methods like first(), last(), etc.
   */
  readonly docs: MongoDocs<T>;
}

/**
 * Failed query result (find, aggregate).
 */
export interface MongoFindFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:find"` for MongoDB find operations.
   */
  readonly kind: "mongo:find";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * Query result (find, aggregate) - success or failure.
 */
export type MongoFindResult<T = Document> =
  | MongoFindSuccess<T>
  | MongoFindFailure;

// =============================================================================
// InsertOne Result Types
// =============================================================================

/**
 * Successful insert one result.
 */
export interface MongoInsertOneSuccess extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:insert-one"` for single document inserts.
   */
  readonly kind: "mongo:insert-one";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * ID of the inserted document.
   *
   * Serialized as string for consistency.
   */
  readonly insertedId: string;
}

/**
 * Failed insert one result.
 */
export interface MongoInsertOneFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:insert-one"` for single document inserts.
   */
  readonly kind: "mongo:insert-one";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * Insert one result - success or failure.
 */
export type MongoInsertOneResult =
  | MongoInsertOneSuccess
  | MongoInsertOneFailure;

// =============================================================================
// InsertMany Result Types
// =============================================================================

/**
 * Successful insert many result.
 */
export interface MongoInsertManySuccess extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:insert-many"` for batch inserts.
   */
  readonly kind: "mongo:insert-many";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * Array of IDs for inserted documents.
   *
   * Order matches the input array.
   */
  readonly insertedIds: readonly string[];

  /**
   * Number of successfully inserted documents.
   */
  readonly insertedCount: number;
}

/**
 * Failed insert many result.
 */
export interface MongoInsertManyFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:insert-many"` for batch inserts.
   */
  readonly kind: "mongo:insert-many";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * Insert many result - success or failure.
 */
export type MongoInsertManyResult =
  | MongoInsertManySuccess
  | MongoInsertManyFailure;

// =============================================================================
// Update Result Types
// =============================================================================

/**
 * Successful update result.
 */
export interface MongoUpdateSuccess extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:update"` for update operations.
   */
  readonly kind: "mongo:update";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * Number of documents matching the filter.
   */
  readonly matchedCount: number;

  /**
   * Number of documents actually modified.
   *
   * May be less than matchedCount if documents already had the target values.
   */
  readonly modifiedCount: number;

  /**
   * ID of the upserted document (present only for upsert operations).
   */
  readonly upsertedId?: string;
}

/**
 * Failed update result.
 */
export interface MongoUpdateFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:update"` for update operations.
   */
  readonly kind: "mongo:update";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * Update result - success or failure.
 */
export type MongoUpdateResult = MongoUpdateSuccess | MongoUpdateFailure;

// =============================================================================
// Delete Result Types
// =============================================================================

/**
 * Successful delete result.
 */
export interface MongoDeleteSuccess extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:delete"` for delete operations.
   */
  readonly kind: "mongo:delete";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * Number of documents deleted.
   */
  readonly deletedCount: number;
}

/**
 * Failed delete result.
 */
export interface MongoDeleteFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:delete"` for delete operations.
   */
  readonly kind: "mongo:delete";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * Delete result - success or failure.
 */
export type MongoDeleteResult = MongoDeleteSuccess | MongoDeleteFailure;

// =============================================================================
// FindOne Result Types
// =============================================================================

/**
 * Successful findOne result.
 */
export interface MongoFindOneSuccess<T = Document> extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:find-one"` for single document queries.
   */
  readonly kind: "mongo:find-one";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * The found document (undefined if not found).
   */
  readonly doc: T | undefined;
}

/**
 * Failed findOne result.
 */
export interface MongoFindOneFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:find-one"` for single document queries.
   */
  readonly kind: "mongo:find-one";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * FindOne result - success or failure.
 */
export type MongoFindOneResult<T = Document> =
  | MongoFindOneSuccess<T>
  | MongoFindOneFailure;

// =============================================================================
// Count Result Types
// =============================================================================

/**
 * Successful count result.
 */
export interface MongoCountSuccess extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:count"` for count operations.
   */
  readonly kind: "mongo:count";

  /**
   * Indicates operation success.
   */
  readonly ok: true;

  /**
   * Number of documents matching the filter.
   */
  readonly count: number;
}

/**
 * Failed count result.
 */
export interface MongoCountFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"mongo:count"` for count operations.
   */
  readonly kind: "mongo:count";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: MongoError;
}

/**
 * Count result - success or failure.
 */
export type MongoCountResult = MongoCountSuccess | MongoCountFailure;

/**
 * Union of all MongoDB result types.
 */
// deno-lint-ignore no-explicit-any
export type MongoResult<T = any> =
  | MongoFindResult<T>
  | MongoInsertOneResult
  | MongoInsertManyResult
  | MongoUpdateResult
  | MongoDeleteResult
  | MongoFindOneResult<T>
  | MongoCountResult;

/**
 * Create a MongoDocs array from a regular array.
 */
export function createMongoDocs<T>(items: T[]): MongoDocs<T> {
  const arr = [...items] as unknown as MongoDocs<T>;

  Object.defineProperty(arr, "first", {
    value: function (): T | undefined {
      return this[0];
    },
    enumerable: false,
  });

  Object.defineProperty(arr, "firstOrThrow", {
    value: function (): T {
      if (this.length === 0) {
        throw new MongoNotFoundError("No documents found (firstOrThrow)");
      }
      return this[0];
    },
    enumerable: false,
  });

  Object.defineProperty(arr, "last", {
    value: function (): T | undefined {
      return this.length > 0 ? this[this.length - 1] : undefined;
    },
    enumerable: false,
  });

  Object.defineProperty(arr, "lastOrThrow", {
    value: function (): T {
      if (this.length === 0) {
        throw new MongoNotFoundError("No documents found (lastOrThrow)");
      }
      return this[this.length - 1];
    },
    enumerable: false,
  });

  return arr;
}

// =============================================================================
// Failure Result Factory Functions
// =============================================================================

/**
 * Create a MongoFindFailure result.
 */
export function createMongoFindFailure(
  error: MongoError,
  duration: number,
): MongoFindFailure {
  return {
    kind: "mongo:find",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a MongoFindOneFailure result.
 */
export function createMongoFindOneFailure(
  error: MongoError,
  duration: number,
): MongoFindOneFailure {
  return {
    kind: "mongo:find-one",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a MongoInsertOneFailure result.
 */
export function createMongoInsertOneFailure(
  error: MongoError,
  duration: number,
): MongoInsertOneFailure {
  return {
    kind: "mongo:insert-one",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a MongoInsertManyFailure result.
 */
export function createMongoInsertManyFailure(
  error: MongoError,
  duration: number,
): MongoInsertManyFailure {
  return {
    kind: "mongo:insert-many",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a MongoUpdateFailure result.
 */
export function createMongoUpdateFailure(
  error: MongoError,
  duration: number,
): MongoUpdateFailure {
  return {
    kind: "mongo:update",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a MongoDeleteFailure result.
 */
export function createMongoDeleteFailure(
  error: MongoError,
  duration: number,
): MongoDeleteFailure {
  return {
    kind: "mongo:delete",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a MongoCountFailure result.
 */
export function createMongoCountFailure(
  error: MongoError,
  duration: number,
): MongoCountFailure {
  return {
    kind: "mongo:count",
    ok: false,
    error,
    duration,
  };
}
