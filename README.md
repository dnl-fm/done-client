# Done Client for TypeScript/Deno

A TypeScript client library for interacting with the Done message queue API.

## Installation

```typescript
import { DoneClient } from "jsr:@dnl-fm/done-client";
```

## Usage

```typescript
import { DoneClient } from "jsr:@dnl-fm/done-client";

// Create client
const client = DoneClient.create("https://your-done-instance.com", "your-auth-token");

// Send immediate message
const response = await client.sendMessage("https://example.com/webhook", {
  userId: 123,
  action: "process"
});

// Send delayed message (5 minutes)
await client.sendMessage("https://example.com/webhook", { data: "test" }, {
  delay: "5m"
});

// Send message at specific time
await client.sendMessage("https://example.com/webhook", { data: "test" }, {
  delay: new Date("2024-01-01T12:00:00Z")
});

// Send message with custom callback headers
// Headers are automatically prefixed with "Done-" and will be included in the callback
await client.sendMessage("https://example.com/webhook", { data: "test" }, {
  headers: {
    "Authorization": "Bearer token123",  // Becomes "Authorization: Bearer token123" in callback
    "X-Custom-ID": "order-456",         // Becomes "x-custom-id: order-456" in callback
    "Content-Type": "application/json"  // Becomes "content-type: application/json" in callback
  }
});

// Send message with all options
await client.sendMessage("https://example.com/webhook", { data: "test" }, {
  delay: "10m",
  notBefore: new Date("2024-01-01T09:00:00Z"),
  maxAttempts: 5,
  failureCallback: "https://example.com/failure-webhook",
  headers: {
    "Authorization": "Bearer token123",
    "X-Tenant-ID": "tenant-abc"
  }
});

// Get message details
const message = await client.getMessage("message-id");

// List messages by status
import { MessageStatus } from "jsr:@dnl-fm/done-client";
const queuedMessages = await client.getMessagesByStatus(MessageStatus.QUEUED);
```

## Callback Headers

When you specify headers in the `headers` option, Done will include them in the callback request to your webhook:

```typescript
// When you send:
await client.sendMessage("https://example.com/webhook", { name: "John" }, {
  headers: {
    "Authorization": "Bearer secret123",
    "X-User-ID": "user456"
  }
});

// Done will make this callback request:
// POST https://example.com/webhook
// Authorization: Bearer secret123
// x-user-id: user456
// done-message-id: msg_...
// done-status: deliver
// done-retried: 0
// user-agent: Done Light
//
// { "name": "John" }
```

## API

### `DoneClient.create(baseUrl, authToken)`

Creates a new Done client instance.

**Returns:** `DoneClient`

### `sendMessage(callbackUrl, body?, options?)`

Sends a message to the queue.

**Options:**
- `delay`: Delay as string ("5m", "1h") or Date object
- `notBefore`: Earliest execution time
- `headers`: Custom headers to include in the callback request. These are automatically prefixed with "Done-" in the API call and the prefix is stripped when making the callback
- `maxAttempts`: Maximum retry attempts
- `failureCallback`: URL to call on failure

**Returns:** `Promise<SendMessageResponse>`
```typescript
{
  messageId: string;
  scheduledAt: Date;
}
```

### `getMessage(messageId)`

Retrieves message details by ID.

**Returns:** `Promise<DoneMessage>`
```typescript
{
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
```

### `getMessagesByStatus(status)`

Lists messages by status using `MessageStatus` enum values.

**Parameters:**
- `status`: `MessageStatus.CREATED | MessageStatus.QUEUED | MessageStatus.DELIVER | MessageStatus.SENT | MessageStatus.RETRY | MessageStatus.DLQ | MessageStatus.ARCHIVED`

**Returns:** `Promise<MessageStatusInfo[]>`
```typescript
{
  id: string;
  status: MessageStatus;
  attempts: number;
  scheduledAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}
```