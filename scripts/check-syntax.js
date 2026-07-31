"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const ignoredDirectories = new Set([".git", ".vercel", ".worktrees", "node_modules"]);
const files = [];

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(fullPath);
  }
}

visit(root);
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Syntax check failed: ${path.relative(root, file)}\n`);
    process.exit(result.status || 1);
  }
}
process.stdout.write(`Syntax checked ${files.length} JavaScript files.\n`);