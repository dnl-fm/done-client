import type {
  DoneClientConfig,
  DoneMessage,
  MessageStatus,
  MessageStatusInfo,
  SendMessageOptions,
  SendMessageResponse,
} from "./types.ts";

export class DoneClient {
  private config: DoneClientConfig;

  constructor(config: DoneClientConfig) {
    this.config = config;
  }

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

    const response = await fetch(`${this.config.baseUrl}/v1/${callbackUrl}`, fetchOptions);

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      messageId: result.messageId,
      scheduledAt: new Date(result.scheduledAt),
    };
  }

  async getMessage(messageId: string): Promise<DoneMessage> {
    const response = await fetch(`${this.config.baseUrl}/v1/${messageId}`, {
      headers: {
        "Authorization": `Bearer ${this.config.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get message: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      scheduledAt: new Date(data.scheduledAt),
      lastAttemptAt: data.lastAttemptAt ? new Date(data.lastAttemptAt) : undefined,
    };
  }

  async getMessagesByStatus(status: MessageStatus): Promise<MessageStatusInfo[]> {
    const response = await fetch(`${this.config.baseUrl}/v1/by-status/${status}`, {
      headers: {
        "Authorization": `Bearer ${this.config.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get messages by status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as MessageStatusInfo[];
    return data.map((item) => ({
      ...item,
      scheduledAt: new Date(item.scheduledAt),
      lastAttemptAt: item.lastAttemptAt ? new Date(item.lastAttemptAt) : undefined,
    }));
  }

  static create(baseUrl: string, authToken: string): DoneClient {
    return new DoneClient({ baseUrl, authToken });
  }
}