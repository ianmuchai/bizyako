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
  "robots.txt",
  "sitemap.xml",
  path.join("data", "site-static.json"),
  path.join(".well-known", "security.txt"),
];

const publicDirectories = ["assets"];

const PERFORMANCE_BUDGETS = Object.freeze({
  files: Object.freeze({
    "index.html": 45 * 1024,
    "styles.css": 110 * 1024,
    "script.js": 70 * 1024,
    "assets/bizyako-carousel-impact.webp": 150 * 1024,
  }),
  firstView: 400 * 1024,
  firstViewFiles: Object.freeze([
    "index.html",
    "styles.css",
    "script.js",
    "chat-history.js",
    "assets/bizyako-logo.png",
    "assets/bizyako-carousel-impact.webp",
  ]),
});

function enforcePerformanceBudgets(root) {
  for (const [relativePath, limit] of Object.entries(PERFORMANCE_BUDGETS.files)) {
    const bytes = fs.statSync(path.join(root, relativePath)).size;
    if (bytes > limit) {
      throw new Error(`Performance budget exceeded for ${relativePath}: ${bytes} > ${limit} bytes.`);
    }
  }

  const firstViewBytes = PERFORMANCE_BUDGETS.firstViewFiles.reduce(
    (total, relativePath) => total + fs.statSync(path.join(root, relativePath)).size,
    0
  );
  if (firstViewBytes > PERFORMANCE_BUDGETS.firstView) {
    throw new Error(`First-view performance budget exceeded: ${firstViewBytes} > ${PERFORMANCE_BUDGETS.firstView} bytes.`);
  }

  return { firstViewBytes };
}

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

  enforcePerformanceBudgets(resolvedRoot);

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

module.exports = {
  PERFORMANCE_BUDGETS,
  buildStaticOutput,
  enforcePerformanceBudgets,
  publicDirectories,
  publicFiles,
};