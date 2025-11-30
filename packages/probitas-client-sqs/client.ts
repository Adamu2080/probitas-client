import {
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  type MessageAttributeValue,
  PurgeQueueCommand,
  type QueueAttributeName,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { AbortError, TimeoutError } from "@probitas/client";
import type { CommonOptions } from "@probitas/client";
import type {
  SqsBatchMessage,
  SqsClient,
  SqsClientConfig,
  SqsDeleteBatchResult,
  SqsDeleteResult,
  SqsMessage,
  SqsMessageAttribute,
  SqsReceiveOptions,
  SqsReceiveResult,
  SqsSendBatchResult,
  SqsSendOptions,
  SqsSendResult,
} from "./types.ts";
import {
  SqsCommandError,
  SqsConnectionError,
  SqsMessageNotFoundError,
  SqsMessageTooLargeError,
  SqsQueueNotFoundError,
} from "./errors.ts";
import { createSqsMessages } from "./messages.ts";

const MAX_MESSAGE_SIZE = 256 * 1024; // 256 KB

/**
 * Execute a promise with timeout and abort signal support.
 */
async function withOptions<T>(
  promise: Promise<T>,
  options: CommonOptions | undefined,
  operation: string,
): Promise<T> {
  if (!options?.timeout && !options?.signal) {
    return promise;
  }

  const controllers: { cleanup: () => void }[] = [];

  try {
    const racePromises: Promise<T>[] = [promise];

    if (options.timeout !== undefined) {
      const timeoutMs = options.timeout;
      let timeoutId: number;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new TimeoutError(`Operation timed out: ${operation}`, timeoutMs),
          );
        }, timeoutMs);
      });
      controllers.push({ cleanup: () => clearTimeout(timeoutId) });
      racePromises.push(timeoutPromise);
    }

    if (options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        throw new AbortError(`Operation aborted: ${operation}`);
      }

      const abortPromise = new Promise<never>((_, reject) => {
        const onAbort = () => {
          reject(new AbortError(`Operation aborted: ${operation}`));
        };
        signal.addEventListener("abort", onAbort, { once: true });
        controllers.push({
          cleanup: () => signal.removeEventListener("abort", onAbort),
        });
      });
      racePromises.push(abortPromise);
    }

    return await Promise.race(racePromises);
  } finally {
    for (const controller of controllers) {
      controller.cleanup();
    }
  }
}

/**
 * Convert AWS SDK errors to SQS-specific errors.
 */
function convertSqsError(
  error: unknown,
  operation: string,
  context?: { queueUrl?: string },
): never {
  if (error instanceof TimeoutError || error instanceof AbortError) {
    throw error;
  }

  if (error instanceof Error) {
    const message = error.message;
    const errorName = error.name;

    if (
      errorName === "QueueDoesNotExist" ||
      errorName === "AWS.SimpleQueueService.NonExistentQueue" ||
      message.includes("does not exist") ||
      message.includes("NonExistentQueue")
    ) {
      throw new SqsQueueNotFoundError(
        message,
        context?.queueUrl ?? "unknown",
        { cause: error },
      );
    }

    if (
      errorName === "ReceiptHandleIsInvalid" ||
      message.includes("ReceiptHandleIsInvalid") ||
      message.includes("receipt handle")
    ) {
      throw new SqsMessageNotFoundError(message, { cause: error });
    }

    throw new SqsCommandError(message, {
      operation,
      cause: error,
    });
  }

  throw new SqsCommandError(String(error), { operation });
}

/**
 * Convert SDK message attributes to our format.
 */
function convertMessageAttributes(
  attrs: Record<string, MessageAttributeValue> | undefined,
): Record<string, SqsMessageAttribute> | undefined {
  if (!attrs) return undefined;

  const result: Record<string, SqsMessageAttribute> = {};
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = {
      dataType: value.DataType as "String" | "Number" | "Binary",
      stringValue: value.StringValue,
      binaryValue: value.BinaryValue,
    };
  }
  return result;
}

/**
 * Convert our message attributes to SDK format.
 */
function toSdkMessageAttributes(
  attrs: Record<string, SqsMessageAttribute> | undefined,
): Record<string, MessageAttributeValue> | undefined {
  if (!attrs) return undefined;

  const result: Record<string, MessageAttributeValue> = {};
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = {
      DataType: value.dataType,
      StringValue: value.stringValue,
      BinaryValue: value.binaryValue,
    };
  }
  return result;
}

/**
 * Validate message size.
 */
function validateMessageSize(body: string): void {
  const size = new TextEncoder().encode(body).length;
  if (size > MAX_MESSAGE_SIZE) {
    throw new SqsMessageTooLargeError(
      `Message size ${size} exceeds maximum allowed size ${MAX_MESSAGE_SIZE}`,
      size,
      MAX_MESSAGE_SIZE,
    );
  }
}

/**
 * Create an SQS client.
 *
 * @example
 * ```typescript
 * const sqs = await createSqsClient({
 *   region: "ap-northeast-1",
 *   queueUrl: "https://sqs.ap-northeast-1.amazonaws.com/123456789/my-queue",
 *   endpoint: "http://localhost:4566",  // LocalStack
 * });
 *
 * // Send
 * const sendResult = await sqs.send(JSON.stringify({ type: "ORDER", orderId: "123" }));
 * expectSqsSendResult(sendResult).ok().hasMessageId();
 *
 * // Receive (Long polling)
 * const receiveResult = await sqs.receive({
 *   maxMessages: 10,
 *   waitTimeSeconds: 20,
 * });
 * expectSqsReceiveResult(receiveResult).ok().hasContent();
 *
 * // Process and delete
 * for (const msg of receiveResult.messages) {
 *   console.log(JSON.parse(msg.body));
 *   await sqs.delete(msg.receiptHandle);
 * }
 *
 * await sqs.close();
 * ```
 */
export function createSqsClient(
  config: SqsClientConfig,
): Promise<SqsClient> {
  let sqsClient: SQSClient;

  try {
    sqsClient = new SQSClient({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
    });
  } catch (error) {
    throw new SqsConnectionError(
      `Failed to create SQS client: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  return Promise.resolve(new SqsClientImpl(config, sqsClient));
}

class SqsClientImpl implements SqsClient {
  readonly config: SqsClientConfig;
  readonly #client: SQSClient;
  #closed = false;

  constructor(config: SqsClientConfig, client: SQSClient) {
    this.config = config;
    this.#client = client;
  }

  async send(
    body: string,
    options?: SqsSendOptions,
  ): Promise<SqsSendResult> {
    this.#ensureOpen();
    validateMessageSize(body);

    const startTime = performance.now();
    const operation = "send";

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.config.queueUrl,
        MessageBody: body,
        DelaySeconds: options?.delaySeconds,
        MessageAttributes: toSdkMessageAttributes(options?.messageAttributes),
        MessageGroupId: options?.messageGroupId,
        MessageDeduplicationId: options?.messageDeduplicationId,
      });

      const response = await withOptions(
        this.#client.send(command),
        options,
        operation,
      );

      return {
        ok: true,
        messageId: response.MessageId!,
        md5OfBody: response.MD5OfMessageBody!,
        sequenceNumber: response.SequenceNumber,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertSqsError(error, operation, { queueUrl: this.config.queueUrl });
    }
  }

  async sendBatch(
    messages: SqsBatchMessage[],
  ): Promise<SqsSendBatchResult> {
    this.#ensureOpen();

    for (const msg of messages) {
      validateMessageSize(msg.body);
    }

    const startTime = performance.now();
    const operation = "sendBatch";

    try {
      const command = new SendMessageBatchCommand({
        QueueUrl: this.config.queueUrl,
        Entries: messages.map((msg) => ({
          Id: msg.id,
          MessageBody: msg.body,
          DelaySeconds: msg.delaySeconds,
          MessageAttributes: toSdkMessageAttributes(msg.messageAttributes),
        })),
      });

      const response = await withOptions(
        this.#client.send(command),
        undefined,
        operation,
      );

      const successful = (response.Successful ?? []).map((entry) => ({
        messageId: entry.MessageId!,
        id: entry.Id!,
      }));

      const failed = (response.Failed ?? []).map((entry) => ({
        id: entry.Id!,
        code: entry.Code!,
        message: entry.Message ?? "",
      }));

      return {
        ok: failed.length === 0,
        successful,
        failed,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertSqsError(error, operation, { queueUrl: this.config.queueUrl });
    }
  }

  async receive(
    options?: SqsReceiveOptions,
  ): Promise<SqsReceiveResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const operation = "receive";

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.config.queueUrl,
        MaxNumberOfMessages: options?.maxMessages,
        VisibilityTimeout: options?.visibilityTimeout,
        WaitTimeSeconds: options?.waitTimeSeconds,
        MessageAttributeNames: options?.messageAttributeNames as
          | string[]
          | undefined,
        AttributeNames: options?.attributeNames as
          | QueueAttributeName[]
          | undefined,
      });

      const response = await withOptions(
        this.#client.send(command),
        options,
        operation,
      );

      const messages: SqsMessage[] = (response.Messages ?? []).map((msg) => ({
        messageId: msg.MessageId!,
        body: msg.Body!,
        receiptHandle: msg.ReceiptHandle!,
        attributes: (msg.Attributes as Record<string, string>) ?? {},
        messageAttributes: convertMessageAttributes(msg.MessageAttributes),
        md5OfBody: msg.MD5OfBody!,
      }));

      return {
        ok: true,
        messages: createSqsMessages(messages),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertSqsError(error, operation, { queueUrl: this.config.queueUrl });
    }
  }

  async delete(
    receiptHandle: string,
    options?: CommonOptions,
  ): Promise<SqsDeleteResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const operation = "delete";

    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.config.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await withOptions(
        this.#client.send(command),
        options,
        operation,
      );

      return {
        ok: true,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertSqsError(error, operation, { queueUrl: this.config.queueUrl });
    }
  }

  async deleteBatch(
    receiptHandles: string[],
    options?: CommonOptions,
  ): Promise<SqsDeleteBatchResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const operation = "deleteBatch";

    try {
      const command = new DeleteMessageBatchCommand({
        QueueUrl: this.config.queueUrl,
        Entries: receiptHandles.map((handle, index) => ({
          Id: String(index),
          ReceiptHandle: handle,
        })),
      });

      const response = await withOptions(
        this.#client.send(command),
        options,
        operation,
      );

      const successful = (response.Successful ?? []).map((entry) => entry.Id!);

      const failed = (response.Failed ?? []).map((entry) => ({
        id: entry.Id!,
        code: entry.Code!,
        message: entry.Message ?? "",
      }));

      return {
        ok: failed.length === 0,
        successful,
        failed,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertSqsError(error, operation, { queueUrl: this.config.queueUrl });
    }
  }

  async purge(options?: CommonOptions): Promise<SqsDeleteResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const operation = "purge";

    try {
      const command = new PurgeQueueCommand({
        QueueUrl: this.config.queueUrl,
      });

      await withOptions(
        this.#client.send(command),
        options,
        operation,
      );

      return {
        ok: true,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertSqsError(error, operation, { queueUrl: this.config.queueUrl });
    }
  }

  close(): Promise<void> {
    if (this.#closed) return Promise.resolve();
    this.#closed = true;

    try {
      this.#client.destroy();
    } catch {
      // Ignore close errors
    }
    return Promise.resolve();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

  #ensureOpen(): void {
    if (this.#closed) {
      throw new SqsCommandError("Client is closed", { operation: "" });
    }
  }
}
