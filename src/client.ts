import type {
  DoneClientConfig,
  DoneMessage,
  MessageStatus,
  MessageStatusInfo,
  SendMessageOptions,
  SendMessageResponse,
} from "./types.ts";

/**
 * Client for interacting with the Done message queue API.
 *
 * @example
 * ```typescript
 * const client = DoneClient.create("https://your-done-instance.com", "your-auth-token");
 *
 * // Send a message
 * const response = await client.sendMessage("https://webhook.example.com", {
 *   userId: 123
 * });
 *
 * // Send with delay
 * await client.sendMessage("https://webhook.example.com", { data: "test" }, {
 *   delay: "5m"
 * });
 * ```
 */
export class DoneClient {
  private config: DoneClientConfig;

  /**
   * Creates a new DoneClient instance.
   *
   * @param config - Configuration options for the client
   */
  constructor(config: DoneClientConfig) {
    this.config = config;
  }

  /**
   * Sends a message to the Done queue for delayed delivery.
   *
   * @param callbackUrl - The URL that will be called when the message is delivered
   * @param body - Optional message payload to include in the callback
   * @param options - Additional options for message delivery
   * @returns Promise resolving to message ID and scheduled delivery time
   *
   * @example
   * ```typescript
   * // Send immediate message
   * const response = await client.sendMessage("https://api.example.com/webhook", {
   *   orderId: "12345",
   *   action: "process"
   * });
   *
   * // Send with 5 minute delay
   * await client.sendMessage("https://api.example.com/webhook", { data: "test" }, {
   *   delay: "5m"
   * });
   *
   * // Send with custom headers
   * await client.sendMessage("https://api.example.com/webhook", { data: "test" }, {
   *   headers: {
   *     "Authorization": "Bearer token123",
   *     "X-Custom-ID": "order-456"
   *   }
   * });
   * ```
   *
   * @throws Error if the API request fails
   */
  async sendMessage(
    callbackUrl: string,
    body?: unknown,
    options?: SendMessageOptions,
  ): Promise<SendMessageResponse> {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.authToken}`,
      "Content-Type": "application/json",
    };

    if (options?.delay) {
      if (typeof options.delay === "string") {
        headers["Done-Delay"] = options.delay;
      } else {
        headers["Done-Delay"] = options.delay.toISOString();
      }
    }

    if (options?.notBefore) {
      headers["Done-Not-Before"] = options.notBefore.toISOString();
    }

    if (options?.maxAttempts) {
      headers["Done-Max-Attempts"] = options.maxAttempts.toString();
    }

    if (options?.failureCallback) {
      headers["Done-Failure-Callback"] = options.failureCallback;
    }

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers[`Done-${key}`] = value;
      }
    }

    const fetchOptions: RequestInit = {
      method: "POST",
      headers,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(
      `${this.config.baseUrl}/v1/${callbackUrl}`,
      fetchOptions,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to send message: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return {
      messageId: result.messageId,
      scheduledAt: new Date(result.scheduledAt),
    };
  }

  /**
   * Retrieves detailed information about a specific message.
   *
   * @param messageId - The unique identifier of the message to retrieve
   * @returns Promise resolving to the complete message object
   *
   * @example
   * ```typescript
   * const message = await client.getMessage("msg_abc123");
   * console.log(`Message status: ${message.status}`);
   * console.log(`Attempts: ${message.attempts}/${message.maxAttempts}`);
   * ```
   *
   * @throws Error if the message is not found or API request fails
   */
  async getMessage(messageId: string): Promise<DoneMessage> {
    const response = await fetch(`${this.config.baseUrl}/v1/${messageId}`, {
      headers: {
        "Authorization": `Bearer ${this.config.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get message: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      scheduledAt: new Date(data.scheduledAt),
      lastAttemptAt: data.lastAttemptAt
        ? new Date(data.lastAttemptAt)
        : undefined,
    };
  }

  /**
   * Retrieves a list of messages filtered by their current status.
   *
   * @param status - The message status to filter by
   * @returns Promise resolving to an array of message status information
   *
   * @example
   * ```typescript
   * import { MessageStatus } from "jsr:@dnl-fm/done-client";
   *
   * // Get all queued messages
   * const queuedMessages = await client.getMessagesByStatus(MessageStatus.QUEUED);
   *
   * // Get all failed messages
   * const failedMessages = await client.getMessagesByStatus(MessageStatus.DLQ);
   *
   * for (const msg of queuedMessages) {
   *   console.log(`Message ${msg.id}: ${msg.attempts} attempts`);
   * }
   * ```
   *
   * @throws Error if the API request fails
   */
  async getMessagesByStatus(
    status: MessageStatus,
  ): Promise<MessageStatusInfo[]> {
    const response = await fetch(
      `${this.config.baseUrl}/v1/by-status/${status}`,
      {
        headers: {
          "Authorization": `Bearer ${this.config.authToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get messages by status: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json() as MessageStatusInfo[];
    return data.map((item) => ({
      ...item,
      scheduledAt: new Date(item.scheduledAt),
      lastAttemptAt: item.lastAttemptAt
        ? new Date(item.lastAttemptAt)
        : undefined,
    }));
  }

  /**
   * Creates a new DoneClient instance with the provided configuration.
   * This is a convenience method for creating clients.
   *
   * @param baseUrl - Base URL of the Done API instance
   * @param authToken - Authentication token for API access
   * @returns A new DoneClient instance
   *
   * @example
   * ```typescript
   * const client = DoneClient.create(
   *   "https://your-done-instance.com",
   *   "your-auth-token"
   * );
   * ```
   */
  static create(baseUrl: string, authToken: string): DoneClient {
    return new DoneClient({ baseUrl, authToken });
  }
}
