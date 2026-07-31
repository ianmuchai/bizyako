"use strict";

const crypto = require("node:crypto");
const { hashPassword } = require("../lib/security/auth");

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
const password = Array.from({ length: 24 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join("");
const passwordHash = hashPassword(password);
const sessionSecret = crypto.randomBytes(32).toString("base64url");

process.stdout.write([
  "BizYako security credentials (store these in a password manager):",
  `ONE_TIME_ADMIN_PASSWORD=${password}`,
  `BIZYAKO_ADMIN_PASSWORD_HASH=${passwordHash}`,
  `BIZYAKO_SESSION_SECRET=${sessionSecret}`,
  "",
  "Set the two BIZYAKO_ values as hosting environment variables. The one-time password is used only to sign in.",
  "Do not commit or upload this output.",
  "",
].join("\n"));