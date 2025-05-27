export enum MessageStatus {
  CREATED = "CREATED",
  QUEUED = "QUEUED",
  DELIVER = "DELIVER",
  SENT = "SENT",
  RETRY = "RETRY",
  DLQ = "DLQ",
  ARCHIVED = "ARCHIVED"
}

export interface DoneMessage {
  id: string;
  callbackUrl: string;
  body?: string;
  headers?: Record<string, string>;
  scheduledAt: Date;
  status: MessageStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

export interface DoneClientConfig {
  baseUrl: string;
  authToken: string;
}

export interface SendMessageOptions {
  delay?: string | Date;
  notBefore?: Date;
  headers?: Record<string, string>;
  maxAttempts?: number;
  failureCallback?: string;
}

export interface SendMessageResponse {
  messageId: string;
  scheduledAt: Date;
}

export interface MessageStatusInfo {
  id: string;
  status: MessageStatus;
  attempts: number;
  scheduledAt: Date;
  lastAttemptAt?: Date | undefined;
  error?: string | undefined;
}