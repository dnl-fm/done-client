import { assertEquals, assertRejects } from "jsr:@std/assert";
import { DoneClient } from "../src/client.ts";
import { MessageStatus } from "../src/types.ts";

const TEST_BASE_URL = "https://api.example.com";
const TEST_AUTH_TOKEN = "test-token";

// Mock fetch for testing
let mockFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function setupMockFetch() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    return mockFetch(input, init);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

Deno.test("DoneClient - create client", () => {
  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  assertEquals(client instanceof DoneClient, true);
});

Deno.test("DoneClient - sendMessage with basic payload", async () => {
  const cleanup = setupMockFetch();
  
  mockFetch = async (input, init) => {
    assertEquals(input, `${TEST_BASE_URL}/v1/webhook-url`);
    assertEquals(init?.method, "POST");
    const headers = init?.headers as Record<string, string>;
    assertEquals(headers?.["Authorization"], `Bearer ${TEST_AUTH_TOKEN}`);
    assertEquals(headers?.["Content-Type"], "application/json");
    assertEquals(init?.body, JSON.stringify({ test: "data" }));
    
    return new Response(JSON.stringify({
      messageId: "msg-123",
      scheduledAt: "2024-01-01T12:00:00Z"
    }), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  const result = await client.sendMessage("webhook-url", { test: "data" });
  
  assertEquals(result.messageId, "msg-123");
  assertEquals(result.scheduledAt, new Date("2024-01-01T12:00:00Z"));
  
  cleanup();
});

Deno.test("DoneClient - sendMessage with delay", async () => {
  const cleanup = setupMockFetch();
  
  mockFetch = async (input, init) => {
    const headers = init?.headers as Record<string, string>;
    assertEquals(headers?.["Done-Delay"], "5m");
    
    return new Response(JSON.stringify({
      messageId: "msg-456",
      scheduledAt: "2024-01-01T12:05:00Z"
    }), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  const result = await client.sendMessage("webhook-url", { test: "data" }, {
    delay: "5m"
  });
  
  assertEquals(result.messageId, "msg-456");
  
  cleanup();
});

Deno.test("DoneClient - sendMessage with Date delay", async () => {
  const cleanup = setupMockFetch();
  const delayDate = new Date("2024-01-01T15:00:00Z");
  
  mockFetch = async (input, init) => {
    const headers = init?.headers as Record<string, string>;
    assertEquals(headers?.["Done-Delay"], delayDate.toISOString());
    
    return new Response(JSON.stringify({
      messageId: "msg-789",
      scheduledAt: delayDate.toISOString()
    }), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  await client.sendMessage("webhook-url", { test: "data" }, {
    delay: delayDate
  });
  
  cleanup();
});

Deno.test("DoneClient - sendMessage with all options", async () => {
  const cleanup = setupMockFetch();
  const notBefore = new Date("2024-01-01T10:00:00Z");
  
  mockFetch = async (input, init) => {
    const headers = init?.headers as Record<string, string>;
    assertEquals(headers?.["Done-Not-Before"], notBefore.toISOString());
    assertEquals(headers?.["Done-Max-Attempts"], "5");
    assertEquals(headers?.["Done-Failure-Callback"], "https://fail.example.com");
    assertEquals(headers?.["Done-Custom-Header"], "custom-value");
    
    return new Response(JSON.stringify({
      messageId: "msg-full",
      scheduledAt: "2024-01-01T12:00:00Z"
    }), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  await client.sendMessage("webhook-url", { test: "data" }, {
    notBefore,
    maxAttempts: 5,
    failureCallback: "https://fail.example.com",
    headers: { "Custom-Header": "custom-value" }
  });
  
  cleanup();
});

Deno.test("DoneClient - sendMessage without body", async () => {
  const cleanup = setupMockFetch();
  
  mockFetch = async (input, init) => {
    assertEquals(init?.body, undefined);
    
    return new Response(JSON.stringify({
      messageId: "msg-no-body",
      scheduledAt: "2024-01-01T12:00:00Z"
    }), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  await client.sendMessage("webhook-url");
  
  cleanup();
});

Deno.test("DoneClient - sendMessage handles errors", async () => {
  const cleanup = setupMockFetch();
  
  mockFetch = async () => {
    return new Response("Bad Request", { status: 400, statusText: "Bad Request" });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  
  await assertRejects(
    () => client.sendMessage("webhook-url", { test: "data" }),
    Error,
    "Failed to send message: 400 Bad Request"
  );
  
  cleanup();
});

Deno.test("DoneClient - getMessage", async () => {
  const cleanup = setupMockFetch();
  
  mockFetch = async (input, init) => {
    assertEquals(input, `${TEST_BASE_URL}/v1/msg-123`);
    const headers = init?.headers as Record<string, string>;
    assertEquals(headers?.["Authorization"], `Bearer ${TEST_AUTH_TOKEN}`);
    
    return new Response(JSON.stringify({
      id: "msg-123",
      callbackUrl: "https://example.com/webhook",
      body: { test: "data" },
      status: MessageStatus.QUEUED,
      attempts: 0,
      maxAttempts: 3,
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
      scheduledAt: "2024-01-01T12:05:00Z"
    }), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  const message = await client.getMessage("msg-123");
  
  assertEquals(message.id, "msg-123");
  assertEquals(message.status, MessageStatus.QUEUED);
  assertEquals(message.createdAt, new Date("2024-01-01T12:00:00Z"));
  assertEquals(message.scheduledAt, new Date("2024-01-01T12:05:00Z"));
  
  cleanup();
});

Deno.test("DoneClient - getMessagesByStatus", async () => {
  const cleanup = setupMockFetch();
  
  mockFetch = async (input, init) => {
    assertEquals(input, `${TEST_BASE_URL}/v1/by-status/QUEUED`);
    const headers = init?.headers as Record<string, string>;
    assertEquals(headers?.["Authorization"], `Bearer ${TEST_AUTH_TOKEN}`);
    
    return new Response(JSON.stringify([
      {
        id: "msg-1",
        status: MessageStatus.QUEUED,
        attempts: 0,
        scheduledAt: "2024-01-01T12:00:00Z"
      },
      {
        id: "msg-2",
        status: MessageStatus.QUEUED,
        attempts: 1,
        scheduledAt: "2024-01-01T12:00:00Z",
        lastAttemptAt: "2024-01-01T11:00:00Z"
      }
    ]), { status: 200 });
  };

  const client = DoneClient.create(TEST_BASE_URL, TEST_AUTH_TOKEN);
  const messages = await client.getMessagesByStatus(MessageStatus.QUEUED);
  
  assertEquals(messages.length, 2);
  assertEquals(messages[0].id, "msg-1");
  assertEquals(messages[0].scheduledAt, new Date("2024-01-01T12:00:00Z"));
  assertEquals(messages[1].lastAttemptAt, new Date("2024-01-01T11:00:00Z"));
  
  cleanup();
});