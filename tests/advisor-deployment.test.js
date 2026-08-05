"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("advisor environment template is complete and contains no credential value", () => {
  const environment = read(".env.example");
  const values = Object.fromEntries(environment
    .split(String.fromCharCode(10))
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }));

  assert.equal(values.SILICONFLOW_API_KEY, "");
  assert.equal(values.SILICONFLOW_BASE_URL, "https://api.siliconflow.com/v1");
  assert.equal(values.SILICONFLOW_MODEL, "openai/gpt-oss-120b");
  assert.equal(values.SILICONFLOW_MODEL_2, "google/gemma-4-31B-it");
  assert.equal(Object.keys(values).length, 4);
});

test("Git ignores real environments while allowing only the blank example", () => {
  const gitignore = read(".gitignore");
  const vercelignore = read(".vercelignore");

  assert.ok(gitignore.lastIndexOf("!.env.example") > gitignore.lastIndexOf(".env*"));
  assert.ok(vercelignore.includes(".env*"));
});

test("owner runbook covers advisor setup, rotation, privacy, and live checks", () => {
  const runbook = read("SECURITY.md");

  [
    "SILICONFLOW_API_KEY",
    "SILICONFLOW_BASE_URL",
    "SILICONFLOW_MODEL",
    "SILICONFLOW_MODEL_2",
    "Vercel",
    "Namecheap cPanel",
    "rotate",
    "/api/chat",
    "30 days",
  ].forEach((term) => assert.ok(runbook.includes(term), "Missing runbook term: " + term));
});
