"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("homepage exposes a focused, accessible advisor composer without conversion prompts", () => {
  const html = read("index.html");

  assert.ok(html.includes("data-chat-form"));
  assert.match(html, /textarea[^>]*maxlength="1000"[^>]*data-chat-input/);
  assert.ok(html.includes("data-chat-send"));
  assert.match(html, /data-chat-status[^>]*role="status"/);
  assert.ok(html.includes("data-chat-clear"));
  assert.ok(html.indexOf("chat-history.js") < html.indexOf("script.js"));
});

test("advisor UI calls the private endpoint, restores history, and renders model text safely", () => {
  const script = read("script.js");

  assert.ok(script.includes("window.BizYakoChatHistory"));
  assert.ok(script.includes('fetch("/api/chat"'));
  assert.ok(script.includes("chatHistory.append") || script.includes("chatHistory.save"));
  assert.ok(script.includes("chatHistory.clear"));
  assert.ok(script.includes("bubbleText.textContent ="));
  assert.ok(script.includes("data-chat-typing"));
  assert.ok(script.includes("appendChatDemoLink"));
  assert.ok(script.includes('fetch("/api/contact"'));
});

test("WhatsApp handoffs use the approved BizYako number everywhere", () => {
  const homepage = read("index.html");
  const demo = read("product-demo.html");

  assert.doesNotMatch(homepage + demo, /254700000000/);
  assert.ok(homepage.includes("wa.me/254754959895"));
  assert.ok(demo.includes("wa.me/254754959895"));
});

test("provider secrets and configuration remain absent from browser assets", () => {
  const browserSource = [
    read("index.html"),
    read("script.js"),
    read("chat-history.js"),
    read("product-demo.html"),
    read("product-demo.js"),
  ].join(String.fromCharCode(10));

  assert.doesNotMatch(browserSource, /SILICONFLOW_API_KEY|Authorization|api.siliconflow.com/);
});
