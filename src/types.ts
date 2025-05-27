/**
 * Represents the various states a message can be in within the Done queue system.
 */
export enum MessageStatus {
  /** Message has been created but not yet queued */
  CREATED = "CREATED",
  /** Message is queued and waiting for delivery */
  QUEUED = "QUEUED",
  /** Message is currently being delivered */
  DELIVER = "DELIVER",
  /** Message was successfully sent */
  SENT = "SENT",
  /** Message failed and is being retried */
  RETRY = "RETRY",
  /** Message moved to dead letter queue after max retries */
  DLQ = "DLQ",
  /** Message has been archived */
  ARCHIVED = "ARCHIVED",
}

/**
 * Represents a complete message object from the Done queue system.
 */
export interface DoneMessage {
  /** Unique identifier for the message, typically starts with 'msg_' */
  id: string;
  /** The URL that will be called when the message is delivered */
  callbackUrl: string;
  /** Optional message body/payload as a string */
  body?: string;
  /** Optional headers to include in the callback request */
  headers?: Record<string, string>;
  /** When the message is scheduled to be delivered */
  scheduledAt: Date;
  /** Current status of the message */
  status: MessageStatus;
  /** Number of delivery attempts made */
  attempts: number;
  /** Maximum number of delivery attempts allowed */
  maxAttempts: number;
  /** When the message was created */
  createdAt: Date;
  /** When the message was last updated */
  updatedAt: Date;
  /** When the last delivery attempt was made */
  lastAttemptAt?: Date;
  /** Error message if the last attempt failed */
  error?: string;
}

/**
 * Configuration options for the Done client.
 */
export interface DoneClientConfig {
  /** Base URL of the Done API instance */
  baseUrl: string;
  /** Authentication token for API access */
  authToken: string;
}

/**
 * Options for sending a message through the Done queue.
 */
export interface SendMessageOptions {
  /**
   * Delay before delivery. Can be a duration string (e.g., "5m", "1h")
   * or a specific Date object
   */
  delay?: string | Date;
  /** Earliest time the message should be delivered */
  notBefore?: Date;
  /**
   * Custom headers to include in the callback request.
   * These will be prefixed with "Done-" in the API call
   */
  headers?: Record<string, string>;
  /** Maximum number of delivery attempts (default: 3) */
  maxAttempts?: number;
  /** URL to call if message delivery ultimately fails */
  failureCallback?: string;
}

/**
 * Response from sending a message to the Done queue.
 */
export interface SendMessageResponse {
  /** Unique identifier for the created message */
  messageId: string;
  /** When the message is scheduled to be delivered */
  scheduledAt: Date;
}

/**
 * Simplified message information returned when querying by status.
 */
export interface MessageStatusInfo {
  /** Unique identifier for the message */
  id: string;
  /** Current status of the message */
  status: MessageStatus;
  /** Number of delivery attempts made */
  attempts: number;
  /** When the message is scheduled to be delivered */
  scheduledAt: Date;
  /** When the last delivery attempt was made */
  lastAttemptAt?: Date | undefined;
  /** Error message if the last attempt failed */
  error?: string | undefined;
}
