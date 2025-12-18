import type { AbortError, ClientResult, TimeoutError } from "@probitas/client";
import type {
  SqsBatchFailedEntry,
  SqsBatchSuccessEntry,
  SqsConnectionError,
  SqsError,
  SqsMessage,
} from "./types.ts";

/**
 * Error types that indicate the operation was not processed.
 * These are errors that occur before the operation reaches the SQS service.
 */
type SqsFailureError = SqsConnectionError | AbortError | TimeoutError;

// ============================================================================
// SqsSendResult
// ============================================================================

/**
 * Base interface for send result with common fields.
 */
interface SqsSendResultBase extends ClientResult {
  readonly kind: "sqs:send";
}

/**
 * Successful send result.
 */
export interface SqsSendResultSuccess extends SqsSendResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  /** Unique identifier for the sent message. */
  readonly messageId: string;
  /** MD5 hash of the message body (for integrity verification). */
  readonly md5OfBody: string;
  /** Sequence number for FIFO queues (present only for FIFO queues). */
  readonly sequenceNumber: string | null;
}

/**
 * Send result with SQS error.
 */
export interface SqsSendResultError extends SqsSendResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
  readonly messageId: null;
  readonly md5OfBody: null;
  readonly sequenceNumber: null;
}

/**
 * Send result with connection failure.
 */
export interface SqsSendResultFailure extends SqsSendResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
  readonly messageId: null;
  readonly md5OfBody: null;
  readonly sequenceNumber: null;
}

/**
 * Result of sending a message.
 */
export type SqsSendResult =
  | SqsSendResultSuccess
  | SqsSendResultError
  | SqsSendResultFailure;

// ============================================================================
// SqsSendBatchResult
// ============================================================================

/**
 * Base interface for batch send result with common fields.
 */
interface SqsSendBatchResultBase extends ClientResult {
  readonly kind: "sqs:send-batch";
}

/**
 * Successful batch send result.
 *
 * Note: `ok: true` even if some messages failed (partial failure).
 * Check `failed.length > 0` to detect partial failures.
 */
export interface SqsSendBatchResultSuccess extends SqsSendBatchResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  /** Array of successfully sent messages. */
  readonly successful: readonly SqsBatchSuccessEntry[];
  /** Array of messages that failed to send (may be non-empty even with ok: true). */
  readonly failed: readonly SqsBatchFailedEntry[];
}

/**
 * Batch send result with SQS error.
 */
export interface SqsSendBatchResultError extends SqsSendBatchResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
  readonly successful: readonly [];
  readonly failed: readonly [];
}

/**
 * Batch send result with connection failure.
 */
export interface SqsSendBatchResultFailure extends SqsSendBatchResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
  readonly successful: null;
  readonly failed: null;
}

/**
 * Result of batch sending messages.
 */
export type SqsSendBatchResult =
  | SqsSendBatchResultSuccess
  | SqsSendBatchResultError
  | SqsSendBatchResultFailure;

// ============================================================================
// SqsReceiveResult
// ============================================================================

/**
 * Base interface for receive result with common fields.
 */
interface SqsReceiveResultBase extends ClientResult {
  readonly kind: "sqs:receive";
}

/**
 * Successful receive result.
 */
export interface SqsReceiveResultSuccess extends SqsReceiveResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  /** Array of received messages (may be empty). */
  readonly messages: readonly SqsMessage[];
}

/**
 * Receive result with SQS error.
 */
export interface SqsReceiveResultError extends SqsReceiveResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
  readonly messages: readonly [];
}

/**
 * Receive result with connection failure.
 */
export interface SqsReceiveResultFailure extends SqsReceiveResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
  readonly messages: null;
}

/**
 * Result of receiving messages.
 */
export type SqsReceiveResult =
  | SqsReceiveResultSuccess
  | SqsReceiveResultError
  | SqsReceiveResultFailure;

// ============================================================================
// SqsDeleteResult
// ============================================================================

/**
 * Base interface for delete result with common fields.
 */
interface SqsDeleteResultBase extends ClientResult {
  readonly kind: "sqs:delete";
}

/**
 * Successful delete result.
 */
export interface SqsDeleteResultSuccess extends SqsDeleteResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
}

/**
 * Delete result with SQS error.
 */
export interface SqsDeleteResultError extends SqsDeleteResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
}

/**
 * Delete result with connection failure.
 */
export interface SqsDeleteResultFailure extends SqsDeleteResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
}

/**
 * Result of deleting a message.
 */
export type SqsDeleteResult =
  | SqsDeleteResultSuccess
  | SqsDeleteResultError
  | SqsDeleteResultFailure;

// ============================================================================
// SqsDeleteBatchResult
// ============================================================================

/**
 * Base interface for batch delete result with common fields.
 */
interface SqsDeleteBatchResultBase extends ClientResult {
  readonly kind: "sqs:delete-batch";
}

/**
 * Successful batch delete result.
 *
 * Note: `ok: true` even if some messages failed (partial failure).
 * Check `failed.length > 0` to detect partial failures.
 */
export interface SqsDeleteBatchResultSuccess extends SqsDeleteBatchResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  /** Array of message IDs that were successfully deleted. */
  readonly successful: readonly string[];
  /** Array of messages that failed to delete (may be non-empty even with ok: true). */
  readonly failed: readonly SqsBatchFailedEntry[];
}

/**
 * Batch delete result with SQS error.
 */
export interface SqsDeleteBatchResultError extends SqsDeleteBatchResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
  readonly successful: readonly [];
  readonly failed: readonly [];
}

/**
 * Batch delete result with connection failure.
 */
export interface SqsDeleteBatchResultFailure extends SqsDeleteBatchResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
  readonly successful: null;
  readonly failed: null;
}

/**
 * Result of batch deleting messages.
 */
export type SqsDeleteBatchResult =
  | SqsDeleteBatchResultSuccess
  | SqsDeleteBatchResultError
  | SqsDeleteBatchResultFailure;

// ============================================================================
// SqsEnsureQueueResult
// ============================================================================

/**
 * Base interface for ensure queue result with common fields.
 */
interface SqsEnsureQueueResultBase extends ClientResult {
  readonly kind: "sqs:ensure-queue";
}

/**
 * Successful ensure queue result.
 */
export interface SqsEnsureQueueResultSuccess extends SqsEnsureQueueResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  /** URL of the queue (existing or newly created). */
  readonly queueUrl: string;
}

/**
 * Ensure queue result with SQS error.
 */
export interface SqsEnsureQueueResultError extends SqsEnsureQueueResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
  readonly queueUrl: null;
}

/**
 * Ensure queue result with connection failure.
 */
export interface SqsEnsureQueueResultFailure extends SqsEnsureQueueResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
  readonly queueUrl: null;
}

/**
 * Result of ensuring a queue exists.
 */
export type SqsEnsureQueueResult =
  | SqsEnsureQueueResultSuccess
  | SqsEnsureQueueResultError
  | SqsEnsureQueueResultFailure;

// ============================================================================
// SqsDeleteQueueResult
// ============================================================================

/**
 * Base interface for delete queue result with common fields.
 */
interface SqsDeleteQueueResultBase extends ClientResult {
  readonly kind: "sqs:delete-queue";
}

/**
 * Successful delete queue result.
 */
export interface SqsDeleteQueueResultSuccess extends SqsDeleteQueueResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
}

/**
 * Delete queue result with SQS error.
 */
export interface SqsDeleteQueueResultError extends SqsDeleteQueueResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: SqsError;
}

/**
 * Delete queue result with connection failure.
 */
export interface SqsDeleteQueueResultFailure extends SqsDeleteQueueResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: SqsFailureError;
}

/**
 * Result of deleting a queue.
 */
export type SqsDeleteQueueResult =
  | SqsDeleteQueueResultSuccess
  | SqsDeleteQueueResultError
  | SqsDeleteQueueResultFailure;

// ============================================================================
// Union Type
// ============================================================================

/**
 * Union type of all SQS result types.
 */
export type SqsResult =
  | SqsSendResult
  | SqsSendBatchResult
  | SqsReceiveResult
  | SqsDeleteResult
  | SqsDeleteBatchResult
  | SqsEnsureQueueResult
  | SqsDeleteQueueResult;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a successful send result.
 */
export function createSqsSendResultSuccess(params: {
  messageId: string;
  md5OfBody: string;
  sequenceNumber: string | null;
  duration: number;
}): SqsSendResultSuccess {
  return {
    kind: "sqs:send",
    processed: true,
    ok: true,
    error: null,
    messageId: params.messageId,
    md5OfBody: params.md5OfBody,
    sequenceNumber: params.sequenceNumber,
    duration: params.duration,
  };
}

/**
 * Create an error send result.
 */
export function createSqsSendResultError(params: {
  error: SqsError;
  duration: number;
}): SqsSendResultError {
  return {
    kind: "sqs:send",
    processed: true,
    ok: false,
    error: params.error,
    messageId: null,
    md5OfBody: null,
    sequenceNumber: null,
    duration: params.duration,
  };
}

/**
 * Create a failure send result.
 */
export function createSqsSendResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsSendResultFailure {
  return {
    kind: "sqs:send",
    processed: false,
    ok: false,
    error: params.error,
    messageId: null,
    md5OfBody: null,
    sequenceNumber: null,
    duration: params.duration,
  };
}

/**
 * Create a successful batch send result.
 */
export function createSqsSendBatchResultSuccess(params: {
  successful: readonly SqsBatchSuccessEntry[];
  failed: readonly SqsBatchFailedEntry[];
  duration: number;
}): SqsSendBatchResultSuccess {
  return {
    kind: "sqs:send-batch",
    processed: true,
    ok: true,
    error: null,
    successful: params.successful,
    failed: params.failed,
    duration: params.duration,
  };
}

/**
 * Create an error batch send result.
 */
export function createSqsSendBatchResultError(params: {
  error: SqsError;
  duration: number;
}): SqsSendBatchResultError {
  return {
    kind: "sqs:send-batch",
    processed: true,
    ok: false,
    error: params.error,
    successful: [],
    failed: [],
    duration: params.duration,
  };
}

/**
 * Create a failure batch send result.
 */
export function createSqsSendBatchResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsSendBatchResultFailure {
  return {
    kind: "sqs:send-batch",
    processed: false,
    ok: false,
    error: params.error,
    successful: null,
    failed: null,
    duration: params.duration,
  };
}

/**
 * Create a successful receive result.
 */
export function createSqsReceiveResultSuccess(params: {
  messages: readonly SqsMessage[];
  duration: number;
}): SqsReceiveResultSuccess {
  return {
    kind: "sqs:receive",
    processed: true,
    ok: true,
    error: null,
    messages: params.messages,
    duration: params.duration,
  };
}

/**
 * Create an error receive result.
 */
export function createSqsReceiveResultError(params: {
  error: SqsError;
  duration: number;
}): SqsReceiveResultError {
  return {
    kind: "sqs:receive",
    processed: true,
    ok: false,
    error: params.error,
    messages: [],
    duration: params.duration,
  };
}

/**
 * Create a failure receive result.
 */
export function createSqsReceiveResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsReceiveResultFailure {
  return {
    kind: "sqs:receive",
    processed: false,
    ok: false,
    error: params.error,
    messages: null,
    duration: params.duration,
  };
}

/**
 * Create a successful delete result.
 */
export function createSqsDeleteResultSuccess(params: {
  duration: number;
}): SqsDeleteResultSuccess {
  return {
    kind: "sqs:delete",
    processed: true,
    ok: true,
    error: null,
    duration: params.duration,
  };
}

/**
 * Create an error delete result.
 */
export function createSqsDeleteResultError(params: {
  error: SqsError;
  duration: number;
}): SqsDeleteResultError {
  return {
    kind: "sqs:delete",
    processed: true,
    ok: false,
    error: params.error,
    duration: params.duration,
  };
}

/**
 * Create a failure delete result.
 */
export function createSqsDeleteResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsDeleteResultFailure {
  return {
    kind: "sqs:delete",
    processed: false,
    ok: false,
    error: params.error,
    duration: params.duration,
  };
}

/**
 * Create a successful batch delete result.
 */
export function createSqsDeleteBatchResultSuccess(params: {
  successful: readonly string[];
  failed: readonly SqsBatchFailedEntry[];
  duration: number;
}): SqsDeleteBatchResultSuccess {
  return {
    kind: "sqs:delete-batch",
    processed: true,
    ok: true,
    error: null,
    successful: params.successful,
    failed: params.failed,
    duration: params.duration,
  };
}

/**
 * Create an error batch delete result.
 */
export function createSqsDeleteBatchResultError(params: {
  error: SqsError;
  duration: number;
}): SqsDeleteBatchResultError {
  return {
    kind: "sqs:delete-batch",
    processed: true,
    ok: false,
    error: params.error,
    successful: [],
    failed: [],
    duration: params.duration,
  };
}

/**
 * Create a failure batch delete result.
 */
export function createSqsDeleteBatchResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsDeleteBatchResultFailure {
  return {
    kind: "sqs:delete-batch",
    processed: false,
    ok: false,
    error: params.error,
    successful: null,
    failed: null,
    duration: params.duration,
  };
}

/**
 * Create a successful ensure queue result.
 */
export function createSqsEnsureQueueResultSuccess(params: {
  queueUrl: string;
  duration: number;
}): SqsEnsureQueueResultSuccess {
  return {
    kind: "sqs:ensure-queue",
    processed: true,
    ok: true,
    error: null,
    queueUrl: params.queueUrl,
    duration: params.duration,
  };
}

/**
 * Create an error ensure queue result.
 */
export function createSqsEnsureQueueResultError(params: {
  error: SqsError;
  duration: number;
}): SqsEnsureQueueResultError {
  return {
    kind: "sqs:ensure-queue",
    processed: true,
    ok: false,
    error: params.error,
    queueUrl: null,
    duration: params.duration,
  };
}

/**
 * Create a failure ensure queue result.
 */
export function createSqsEnsureQueueResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsEnsureQueueResultFailure {
  return {
    kind: "sqs:ensure-queue",
    processed: false,
    ok: false,
    error: params.error,
    queueUrl: null,
    duration: params.duration,
  };
}

/**
 * Create a successful delete queue result.
 */
export function createSqsDeleteQueueResultSuccess(params: {
  duration: number;
}): SqsDeleteQueueResultSuccess {
  return {
    kind: "sqs:delete-queue",
    processed: true,
    ok: true,
    error: null,
    duration: params.duration,
  };
}

/**
 * Create an error delete queue result.
 */
export function createSqsDeleteQueueResultError(params: {
  error: SqsError;
  duration: number;
}): SqsDeleteQueueResultError {
  return {
    kind: "sqs:delete-queue",
    processed: true,
    ok: false,
    error: params.error,
    duration: params.duration,
  };
}

/**
 * Create a failure delete queue result.
 */
export function createSqsDeleteQueueResultFailure(params: {
  error: SqsFailureError;
  duration: number;
}): SqsDeleteQueueResultFailure {
  return {
    kind: "sqs:delete-queue",
    processed: false,
    ok: false,
    error: params.error,
    duration: params.duration,
  };
}
