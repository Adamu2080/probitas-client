import type { SqsMessage, SqsMessages } from "./types.ts";

/**
 * Create an SqsMessages array with helper methods.
 */
export function createSqsMessages(messages: SqsMessage[]): SqsMessages {
  const arr = [...messages] as SqsMessage[] & {
    first(): SqsMessage | undefined;
    firstOrThrow(): SqsMessage;
    last(): SqsMessage | undefined;
    lastOrThrow(): SqsMessage;
  };

  arr.first = function (): SqsMessage | undefined {
    return this[0];
  };

  arr.firstOrThrow = function (): SqsMessage {
    const msg = this[0];
    if (!msg) {
      throw new Error("No messages available");
    }
    return msg;
  };

  arr.last = function (): SqsMessage | undefined {
    return this[this.length - 1];
  };

  arr.lastOrThrow = function (): SqsMessage {
    const msg = this[this.length - 1];
    if (!msg) {
      throw new Error("No messages available");
    }
    return msg;
  };

  return arr as SqsMessages;
}
