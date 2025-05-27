/**
 * @fileoverview Done Client for TypeScript/Deno
 *
 * A TypeScript client library for interacting with the Done message queue API.
 * This library provides a simple and type-safe way to send delayed messages,
 * query message status, and manage message queues.
 *
 * @example
 * ```typescript
 * import { DoneClient, MessageStatus } from "jsr:@dnl-fm/done-client";
 *
 * const client = DoneClient.create("https://your-done-instance.com", "your-auth-token");
 *
 * // Send a delayed message
 * await client.sendMessage("https://webhook.example.com", { data: "test" }, {
 *   delay: "5m"
 * });
 *
 * // Check message status
 * const queuedMessages = await client.getMessagesByStatus(MessageStatus.QUEUED);
 * ```
 *
 * @module done-client
 * @version 0.1.0
 * @author DNL.fm
 * @license MIT
 */

export { DoneClient } from "./client.ts";
export { MessageStatus } from "./types.ts";
export type {
  DoneClientConfig,
  DoneMessage,
  MessageStatusInfo,
  SendMessageOptions,
  SendMessageResponse,
} from "./types.ts";
