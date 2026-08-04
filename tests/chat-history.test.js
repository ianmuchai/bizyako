"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  RETENTION_MS,
  createChatHistory,
} = require("../chat-history");

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    peek(key) {
      return values.get(key);
    },
  };
}

test("chat history persists bounded messages and rolls its 30-day expiry", () => {
  const storage = createMemoryStorage();
  let timestamp = Date.UTC(2026, 7, 4);
  const history = createChatHistory({ storage, now: () => timestamp });

  assert.deepEqual(history.load(), []);
  history.save([
    { role: "user", content: "I need a POS.", createdAt: timestamp },
    { role: "assistant", content: "How many branches do you operate?", createdAt: timestamp },
  ]);

  assert.deepEqual(history.load().map(({ role, content }) => ({ role, content })), [
    { role: "user", content: "I need a POS." },
    { role: "assistant", content: "How many branches do you operate?" },
  ]);
  let envelope = JSON.parse(storage.peek("bizyako.advisor.history.v1"));
  assert.equal(envelope.expiresAt, timestamp + RETENTION_MS);

  timestamp += 10 * 24 * 60 * 60 * 1000;
  history.append({ role: "user", content: "Two branches.", createdAt: timestamp });
  envelope = JSON.parse(storage.peek("bizyako.advisor.history.v1"));
  assert.equal(envelope.expiresAt, timestamp + RETENTION_MS);

  timestamp = envelope.expiresAt + 1;
  assert.deepEqual(history.load(), []);
  assert.equal(storage.peek("bizyako.advisor.history.v1"), undefined);
});

test("chat history rejects unsafe records and keeps only the newest 40 messages", () => {
  const storage = createMemoryStorage();
  const history = createChatHistory({ storage, now: () => 5000 });
  const messages = Array.from({ length: 48 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `Message ${index}`,
    createdAt: index + 1,
  }));
  messages.push({ role: "system", content: "Never store this.", createdAt: 49 });
  messages.push({ role: "user", content: "", createdAt: 50 });

  const saved = history.save(messages);
  assert.equal(saved.length, 40);
  assert.equal(saved[0].content, "Message 8");
  assert.equal(saved.at(-1).content, "Message 47");
});

test("chat history stays below 64 KB by dropping the oldest messages", () => {
  const storage = createMemoryStorage();
  const history = createChatHistory({ storage, now: () => 9000 });
  const messages = Array.from({ length: 40 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `${index}:${"x".repeat(1990)}`,
    createdAt: index,
  }));

  const saved = history.save(messages);
  const serialized = storage.peek("bizyako.advisor.history.v1");
  assert.ok(Buffer.byteLength(serialized, "utf8") <= 64 * 1024);
  assert.ok(saved.length < 40);
  assert.match(saved[0].content, /^8:|^9:|^[1-3][0-9]:/);
});

test("chat history recovers from malformed or unavailable storage", () => {
  const storage = createMemoryStorage();
  storage.setItem("bizyako.advisor.history.v1", "{not json");
  const history = createChatHistory({ storage, now: () => 100 });

  assert.deepEqual(history.load(), []);
  assert.equal(storage.peek("bizyako.advisor.history.v1"), undefined);

  const unavailable = createChatHistory({
    storage: {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
      removeItem() { throw new Error("blocked"); },
    },
    now: () => 100,
  });
  assert.deepEqual(unavailable.load(), []);
  assert.deepEqual(unavailable.save([{ role: "user", content: "Hello" }]), [{ role: "user", content: "Hello", createdAt: 100 }]);
});

test("chat history can be cleared explicitly", () => {
  const storage = createMemoryStorage();
  const history = createChatHistory({ storage, now: () => 100 });
  history.append({ role: "user", content: "Hello" });

  history.clear();

  assert.deepEqual(history.load(), []);
  assert.equal(storage.peek("bizyako.advisor.history.v1"), undefined);
});
