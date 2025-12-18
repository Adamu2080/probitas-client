import type { ClientResult } from "@probitas/client";
import type { RedisFailureError, RedisOperationError } from "./errors.ts";

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * Base interface for Redis operation results.
 * All Redis result types extend this interface.
 */
interface RedisResultBase<K extends string> extends ClientResult {
  readonly kind: K;
  readonly duration: number;
}

// ============================================================================
// RedisGetResult
// ============================================================================

/**
 * Base interface for GET result with common fields.
 */
interface RedisGetResultBase extends RedisResultBase<"redis:get"> {
  readonly kind: "redis:get";
  readonly value: string | null;
}

/**
 * Successful GET result.
 */
export interface RedisGetResultSuccess extends RedisGetResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly value: string | null;
}

/**
 * GET result with Redis error.
 */
export interface RedisGetResultError extends RedisGetResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: RedisOperationError;
  readonly value: null;
}

/**
 * GET result with connection failure.
 */
export interface RedisGetResultFailure extends RedisGetResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: RedisFailureError;
  readonly value: null;
}

/**
 * Redis GET result.
 */
export type RedisGetResult =
  | RedisGetResultSuccess
  | RedisGetResultError
  | RedisGetResultFailure;

// ============================================================================
// RedisSetResult
// ============================================================================

/**
 * Base interface for SET result with common fields.
 */
interface RedisSetResultBase extends RedisResultBase<"redis:set"> {
  readonly kind: "redis:set";
  readonly value: "OK" | null;
}

/**
 * Successful SET result.
 */
export interface RedisSetResultSuccess extends RedisSetResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly value: "OK";
}

/**
 * SET result with Redis error.
 */
export interface RedisSetResultError extends RedisSetResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: RedisOperationError;
  readonly value: null;
}

/**
 * SET result with connection failure.
 */
export interface RedisSetResultFailure extends RedisSetResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: RedisFailureError;
  readonly value: null;
}

/**
 * Redis SET result.
 */
export type RedisSetResult =
  | RedisSetResultSuccess
  | RedisSetResultError
  | RedisSetResultFailure;

// ============================================================================
// RedisCountResult
// ============================================================================

/**
 * Base interface for count result with common fields.
 */
interface RedisCountResultBase extends RedisResultBase<"redis:count"> {
  readonly kind: "redis:count";
  readonly value: number | null;
}

/**
 * Successful count result.
 */
export interface RedisCountResultSuccess extends RedisCountResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly value: number;
}

/**
 * Count result with Redis error.
 */
export interface RedisCountResultError extends RedisCountResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: RedisOperationError;
  readonly value: null;
}

/**
 * Count result with connection failure.
 */
export interface RedisCountResultFailure extends RedisCountResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: RedisFailureError;
  readonly value: null;
}

/**
 * Redis numeric result (DEL, LPUSH, SADD, etc.).
 */
export type RedisCountResult =
  | RedisCountResultSuccess
  | RedisCountResultError
  | RedisCountResultFailure;

// ============================================================================
// RedisArrayResult
// ============================================================================

/**
 * Base interface for array result with common fields.
 */
interface RedisArrayResultBase<T = string>
  extends RedisResultBase<"redis:array"> {
  readonly kind: "redis:array";
  readonly value: readonly T[] | null;
}

/**
 * Successful array result.
 */
export interface RedisArrayResultSuccess<T = string>
  extends RedisArrayResultBase<T> {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly value: readonly T[];
}

/**
 * Array result with Redis error.
 */
export interface RedisArrayResultError<T = string>
  extends RedisArrayResultBase<T> {
  readonly processed: true;
  readonly ok: false;
  readonly error: RedisOperationError;
  readonly value: null;
}

/**
 * Array result with connection failure.
 */
export interface RedisArrayResultFailure<T = string>
  extends RedisArrayResultBase<T> {
  readonly processed: false;
  readonly ok: false;
  readonly error: RedisFailureError;
  readonly value: null;
}

/**
 * Redis array result (LRANGE, SMEMBERS, etc.).
 */
export type RedisArrayResult<T = string> =
  | RedisArrayResultSuccess<T>
  | RedisArrayResultError<T>
  | RedisArrayResultFailure<T>;

// ============================================================================
// RedisHashResult
// ============================================================================

/**
 * Base interface for hash result with common fields.
 */
interface RedisHashResultBase extends RedisResultBase<"redis:hash"> {
  readonly kind: "redis:hash";
  readonly value: Record<string, string> | null;
}

/**
 * Successful hash result.
 */
export interface RedisHashResultSuccess extends RedisHashResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly value: Record<string, string>;
}

/**
 * Hash result with Redis error.
 */
export interface RedisHashResultError extends RedisHashResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: RedisOperationError;
  readonly value: null;
}

/**
 * Hash result with connection failure.
 */
export interface RedisHashResultFailure extends RedisHashResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: RedisFailureError;
  readonly value: null;
}

/**
 * Redis hash result (HGETALL).
 */
export type RedisHashResult =
  | RedisHashResultSuccess
  | RedisHashResultError
  | RedisHashResultFailure;

// ============================================================================
// RedisCommonResult
// ============================================================================

/**
 * Base interface for common result with common fields.
 */
interface RedisCommonResultBase<T> extends RedisResultBase<"redis:common"> {
  readonly kind: "redis:common";
  readonly value: T | null;
}

/**
 * Successful common result.
 */
// deno-lint-ignore no-explicit-any
export interface RedisCommonResultSuccess<T = any>
  extends RedisCommonResultBase<T> {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly value: T;
}

/**
 * Common result with Redis error.
 */
// deno-lint-ignore no-explicit-any
export interface RedisCommonResultError<T = any>
  extends RedisCommonResultBase<T> {
  readonly processed: true;
  readonly ok: false;
  readonly error: RedisOperationError;
  readonly value: null;
}

/**
 * Common result with connection failure.
 */
// deno-lint-ignore no-explicit-any
export interface RedisCommonResultFailure<T = any>
  extends RedisCommonResultBase<T> {
  readonly processed: false;
  readonly ok: false;
  readonly error: RedisFailureError;
  readonly value: null;
}

/**
 * Redis operation result (common/generic).
 *
 * Used for operations without a more specific result type.
 */
// deno-lint-ignore no-explicit-any
export type RedisCommonResult<T = any> =
  | RedisCommonResultSuccess<T>
  | RedisCommonResultError<T>
  | RedisCommonResultFailure<T>;

// ============================================================================
// Union Type
// ============================================================================

/**
 * Union of all Redis result types.
 */
// deno-lint-ignore no-explicit-any
export type RedisResult<T = any> =
  | RedisCommonResult<T>
  | RedisGetResult
  | RedisSetResult
  | RedisCountResult
  | RedisArrayResult<T>
  | RedisHashResult;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a successful GET result.
 */
export function createRedisGetResultSuccess(params: {
  value: string | null;
  duration: number;
}): RedisGetResultSuccess {
  return {
    kind: "redis:get",
    processed: true,
    ok: true,
    error: null,
    value: params.value,
    duration: params.duration,
  };
}

/**
 * Create an error GET result.
 */
export function createRedisGetResultError(params: {
  error: RedisOperationError;
  duration: number;
}): RedisGetResultError {
  return {
    kind: "redis:get",
    processed: true,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a failure GET result.
 */
export function createRedisGetResultFailure(params: {
  error: RedisFailureError;
  duration: number;
}): RedisGetResultFailure {
  return {
    kind: "redis:get",
    processed: false,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a successful SET result.
 */
export function createRedisSetResultSuccess(params: {
  duration: number;
}): RedisSetResultSuccess {
  return {
    kind: "redis:set",
    processed: true,
    ok: true,
    error: null,
    value: "OK",
    duration: params.duration,
  };
}

/**
 * Create an error SET result.
 */
export function createRedisSetResultError(params: {
  error: RedisOperationError;
  duration: number;
}): RedisSetResultError {
  return {
    kind: "redis:set",
    processed: true,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a failure SET result.
 */
export function createRedisSetResultFailure(params: {
  error: RedisFailureError;
  duration: number;
}): RedisSetResultFailure {
  return {
    kind: "redis:set",
    processed: false,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a successful count result.
 */
export function createRedisCountResultSuccess(params: {
  value: number;
  duration: number;
}): RedisCountResultSuccess {
  return {
    kind: "redis:count",
    processed: true,
    ok: true,
    error: null,
    value: params.value,
    duration: params.duration,
  };
}

/**
 * Create an error count result.
 */
export function createRedisCountResultError(params: {
  error: RedisOperationError;
  duration: number;
}): RedisCountResultError {
  return {
    kind: "redis:count",
    processed: true,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a failure count result.
 */
export function createRedisCountResultFailure(params: {
  error: RedisFailureError;
  duration: number;
}): RedisCountResultFailure {
  return {
    kind: "redis:count",
    processed: false,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a successful array result.
 */
export function createRedisArrayResultSuccess<T = string>(params: {
  value: readonly T[];
  duration: number;
}): RedisArrayResultSuccess<T> {
  return {
    kind: "redis:array",
    processed: true,
    ok: true,
    error: null,
    value: params.value,
    duration: params.duration,
  };
}

/**
 * Create an error array result.
 */
export function createRedisArrayResultError<T = string>(params: {
  error: RedisOperationError;
  duration: number;
}): RedisArrayResultError<T> {
  return {
    kind: "redis:array",
    processed: true,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a failure array result.
 */
export function createRedisArrayResultFailure<T = string>(params: {
  error: RedisFailureError;
  duration: number;
}): RedisArrayResultFailure<T> {
  return {
    kind: "redis:array",
    processed: false,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a successful hash result.
 */
export function createRedisHashResultSuccess(params: {
  value: Record<string, string>;
  duration: number;
}): RedisHashResultSuccess {
  return {
    kind: "redis:hash",
    processed: true,
    ok: true,
    error: null,
    value: params.value,
    duration: params.duration,
  };
}

/**
 * Create an error hash result.
 */
export function createRedisHashResultError(params: {
  error: RedisOperationError;
  duration: number;
}): RedisHashResultError {
  return {
    kind: "redis:hash",
    processed: true,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a failure hash result.
 */
export function createRedisHashResultFailure(params: {
  error: RedisFailureError;
  duration: number;
}): RedisHashResultFailure {
  return {
    kind: "redis:hash",
    processed: false,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a successful common result.
 */
export function createRedisCommonResultSuccess<T>(params: {
  value: T;
  duration: number;
}): RedisCommonResultSuccess<T> {
  return {
    kind: "redis:common",
    processed: true,
    ok: true,
    error: null,
    value: params.value,
    duration: params.duration,
  };
}

/**
 * Create an error common result.
 */
export function createRedisCommonResultError<T>(params: {
  error: RedisOperationError;
  duration: number;
}): RedisCommonResultError<T> {
  return {
    kind: "redis:common",
    processed: true,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}

/**
 * Create a failure common result.
 */
export function createRedisCommonResultFailure<T>(params: {
  error: RedisFailureError;
  duration: number;
}): RedisCommonResultFailure<T> {
  return {
    kind: "redis:common",
    processed: false,
    ok: false,
    error: params.error,
    value: null,
    duration: params.duration,
  };
}
