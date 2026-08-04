"use strict";

const fs = require("node:fs");
const path = require("node:path");

const publicFiles = [
  "index.html",
  "by-admin.html",
  "product-demo.html",
  "styles.css",
  "script.js",
  "chat-history.js",
  "admin.js",
  "product-demo.js",
  "service-worker.js",
  "manifest.webmanifest",
  path.join("data", "site-static.json"),
  path.join(".well-known", "security.txt"),
];

const publicDirectories = ["assets"];

function copyRequiredFile(root, output, relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.statSync(source).isFile()) {
    throw new Error(`Expected public file is not a file: ${relativePath}`);
  }
  const destination = path.join(output, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function buildStaticOutput({ root = path.join(__dirname, ".."), output = path.join(root, "dist") } = {}) {
  const resolvedRoot = path.resolve(root);
  const resolvedOutput = path.resolve(output);
  if (resolvedOutput === resolvedRoot) {
    throw new Error("Vercel output directory cannot be the project root.");
  }

  fs.rmSync(resolvedOutput, { recursive: true, force: true });
  fs.mkdirSync(resolvedOutput, { recursive: true });

  for (const relativePath of publicFiles) {
    copyRequiredFile(resolvedRoot, resolvedOutput, relativePath);
  }
  for (const relativePath of publicDirectories) {
    const source = path.join(resolvedRoot, relativePath);
    if (!fs.statSync(source).isDirectory()) {
      throw new Error(`Expected public directory is not a directory: ${relativePath}`);
    }
    fs.cpSync(source, path.join(resolvedOutput, relativePath), { recursive: true });
  }

  return { output: resolvedOutput, files: [...publicFiles], directories: [...publicDirectories] };
}

if (require.main === module) {
  const result = buildStaticOutput();
  process.stdout.write(`Prepared allowlisted Vercel output at ${result.output}\n`);
}

module.exports = { buildStaticOutput, publicDirectories, publicFiles };