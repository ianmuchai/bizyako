"use strict";

(function exposeChatHistory(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BizYakoChatHistory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createModule() {
  const STORAGE_KEY = "bizyako.advisor.history.v1";
  const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
  const MAX_MESSAGES = 40;
  const MAX_BYTES = 64 * 1024;
  const MAX_CONTENT_LENGTH = 2_000;
  const VERSION = 1;

  function byteLength(value) {
    if (typeof TextEncoder === "function") return new TextEncoder().encode(value).byteLength;
    if (typeof Buffer !== "undefined") return Buffer.byteLength(value, "utf8");
    return unescape(encodeURIComponent(value)).length;
  }

  function normalizeMessage(message, timestamp) {
    if (!message || typeof message !== "object" || Array.isArray(message)) return null;
    if (message.role !== "user" && message.role !== "assistant") return null;
    if (typeof message.content !== "string") return null;
    const content = message.content.replace(/\0/g, "").trim().slice(0, MAX_CONTENT_LENGTH);
    if (!content) return null;
    const createdAt = Number.isFinite(message.createdAt) && message.createdAt > 0
      ? Math.floor(message.createdAt)
      : timestamp;
    return { role: message.role, content, createdAt };
  }

  function sanitizeMessages(messages, timestamp) {
    if (!Array.isArray(messages)) return [];
    return messages
      .map((message) => normalizeMessage(message, timestamp))
      .filter(Boolean)
      .slice(-MAX_MESSAGES);
  }

  function createChatHistory({ storage, now = Date.now, key = STORAGE_KEY } = {}) {
    let resolvedStorage = storage;
    if (!resolvedStorage) {
      try {
        resolvedStorage = root?.localStorage;
      } catch {
        resolvedStorage = null;
      }
    }

    function clear() {
      try {
        resolvedStorage?.removeItem(key);
      } catch {}
    }

    function load() {
      let serialized;
      try {
        serialized = resolvedStorage?.getItem(key);
      } catch {
        return [];
      }
      if (!serialized) return [];

      let envelope;
      try {
        envelope = JSON.parse(serialized);
      } catch {
        clear();
        return [];
      }
      const timestamp = now();
      if (
        !envelope
        || envelope.version !== VERSION
        || !Number.isFinite(envelope.expiresAt)
        || envelope.expiresAt <= timestamp
        || !Array.isArray(envelope.messages)
      ) {
        clear();
        return [];
      }
      return sanitizeMessages(envelope.messages, timestamp);
    }

    function save(messages) {
      const timestamp = now();
      const bounded = sanitizeMessages(messages, timestamp);
      const envelope = {
        version: VERSION,
        updatedAt: timestamp,
        expiresAt: timestamp + RETENTION_MS,
        messages: bounded,
      };

      let serialized = JSON.stringify(envelope);
      while (envelope.messages.length && byteLength(serialized) > MAX_BYTES) {
        envelope.messages.shift();
        serialized = JSON.stringify(envelope);
      }
      if (byteLength(serialized) > MAX_BYTES) {
        clear();
        return [];
      }

      try {
        resolvedStorage?.setItem(key, serialized);
      } catch {}
      return envelope.messages.map((message) => ({ ...message }));
    }

    function append(message) {
      return save([...load(), message]);
    }

    return { append, clear, load, save };
  }

  return {
    MAX_BYTES,
    MAX_MESSAGES,
    RETENTION_MS,
    STORAGE_KEY,
    createChatHistory,
  };
});
