"use strict";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_CAROUSEL_BYTES = 8 * 1024 * 1024;
const MIN_FORM_AGE_MS = 1_500;
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;
const PRODUCT_IDS = new Set(["law", "erp", "pos", "analytics", "isp", "agents", "mobile", "pwa", "websites"]);
const CONTACT_FIELDS = new Set(["name", "contact", "need", "message", "website", "formStartedAt"]);
const SLIDE_FIELDS = new Set([
  "id", "label", "image", "kicker", "status", "title", "copy", "primary", "secondary",
  "primaryHref", "secondaryHref", "product",
]);
const APPROVED_LINK_HOSTS = new Set(["bizyako.com", "www.bizyako.com", "bizyako.vercel.app", "x.com", "www.x.com", "instagram.com", "www.instagram.com"]);

const textRules = {
  id: { min: 1, max: 48 },
  label: { min: 1, max: 40 },
  kicker: { min: 1, max: 120 },
  status: { min: 1, max: 80 },
  title: { min: 4, max: 180 },
  copy: { min: 10, max: 600 },
  primary: { min: 1, max: 48 },
  secondary: { min: 1, max: 48 },
};

function failure(message) {
  return { ok: false, message };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasUnknownFields(value, allowed) {
  return Object.keys(value).some((key) => !allowed.has(key));
}

function normalizeText(value, { min, max, multiline = false }) {
  if (typeof value !== "string") return null;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return null;
  const normalized = multiline
    ? value.replace(/\r\n?/g, "\n").trim()
    : value.replace(/\s+/g, " ").trim();
  if (normalized.length < min || normalized.length > max) return null;
  return normalized;
}

function validateContactPayload(payload) {
  if (!isPlainObject(payload) || hasUnknownFields(payload, CONTACT_FIELDS)) {
    return failure("Please check the submitted details.");
  }

  if (typeof payload.website !== "string" || payload.website.trim() !== "") {
    return failure("We were unable to accept this request.");
  }

  const formStartedAt = Number(payload.formStartedAt);
  const age = Date.now() - formStartedAt;
  if (!Number.isFinite(formStartedAt) || age < MIN_FORM_AGE_MS || age > MAX_FORM_AGE_MS) {
    return failure("Please take a moment and submit the form again.");
  }

  const name = normalizeText(payload.name, { min: 2, max: 100 });
  const contact = payload.contact === undefined ? "" : normalizeText(payload.contact, { min: 7, max: 160 });
  const need = normalizeText(payload.need, { min: 2, max: 160 });
  const message = normalizeText(payload.message, { min: 10, max: 4_000, multiline: true });
  if (!name || !need || !message || (payload.contact !== undefined && !contact)) {
    return failure("Please check the submitted details.");
  }

  return { ok: true, value: { name, ...(contact ? { contact } : {}), need, message }, message: "Request accepted." };
}

function hasSignature(mime, bytes) {
  if (mime === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/webp") {
    return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (mime === "image/avif") {
    if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") return false;
    return ["avif", "avis"].includes(bytes.subarray(8, 12).toString("ascii"));
  }
  return false;
}

function validateDataImage(value) {
  const match = /^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value);
  if (!match) return failure("Images must be PNG, JPEG, WebP, or AVIF.");
  const mime = match[1].toLowerCase();
  const encoded = match[2];
  if (!encoded || encoded.length % 4 !== 0) return failure("The uploaded image data is invalid.");

  const estimatedBytes = Math.floor((encoded.length * 3) / 4) - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
  if (estimatedBytes > MAX_IMAGE_BYTES) return failure("Each carousel image must be 2 MB or smaller.");

  let bytes;
  try {
    bytes = Buffer.from(encoded, "base64");
  } catch {
    return failure("The uploaded image data is invalid.");
  }
  if (bytes.length > MAX_IMAGE_BYTES) return failure("Each carousel image must be 2 MB or smaller.");
  if (!hasSignature(mime, bytes)) return failure("The uploaded image content does not match its file type.");
  return { ok: true, value };
}

function validateLocalImage(value) {
  if (value.includes("\\") || value.includes("\0") || value.includes("%") || value.includes("?") || value.includes("#")) {
    return failure("The carousel image path is invalid.");
  }
  const normalized = value.startsWith("/") ? value.slice(1) : value;
  if (!/^assets\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:png|jpe?g|webp|avif)$/i.test(normalized)) {
    return failure("Carousel images must use an approved local raster asset.");
  }
  if (normalized.split("/").some((segment) => segment === "." || segment === ".." || !segment)) {
    return failure("The carousel image path is invalid.");
  }
  return { ok: true, value: normalized };
}

function validateImage(value) {
  if (typeof value !== "string" || value.length === 0) return failure("A carousel image is required.");
  if (value.startsWith("data:")) return validateDataImage(value);
  return validateLocalImage(value.trim());
}

function validateHref(value) {
  if (typeof value !== "string" || value.length < 1 || value.length > 500 || /[\u0000-\u001f\u007f\\]/.test(value)) return null;
  const normalized = value.trim();
  if (/^#[A-Za-z][A-Za-z0-9_-]*$/.test(normalized)) return normalized;
  if (normalized.startsWith("//") || /%(?:00|2e|2f|5c)/i.test(normalized)) return null;

  try {
    const parsed = new URL(normalized, "https://bizyako.com/");
    const isRelative = !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(normalized);
    if (isRelative) {
      if (parsed.origin !== "https://bizyako.com" || parsed.pathname.split("/").includes("..")) return null;
      return normalized;
    }
    if (parsed.protocol !== "https:" || !APPROVED_LINK_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function validateSlide(slide) {
  if (!isPlainObject(slide) || hasUnknownFields(slide, SLIDE_FIELDS)) return failure("A carousel slide contains unsupported fields.");
  const output = {};
  for (const [field, rules] of Object.entries(textRules)) {
    const value = normalizeText(slide[field], rules);
    if (!value) return failure(`Carousel field ${field} is invalid.`);
    output[field] = value;
  }
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(output.id)) return failure("Carousel slide IDs must use lowercase letters, numbers, and hyphens.");

  const image = validateImage(slide.image);
  if (!image.ok) return image;
  output.image = image.value;

  const primaryHref = validateHref(slide.primaryHref);
  const secondaryHref = validateHref(slide.secondaryHref);
  if (!primaryHref || !secondaryHref) return failure("Carousel links must use approved BizYako destinations.");
  output.primaryHref = primaryHref;
  output.secondaryHref = secondaryHref;

  if (slide.product !== undefined) {
    if (typeof slide.product !== "string" || !PRODUCT_IDS.has(slide.product)) return failure("The selected carousel product is invalid.");
    output.product = slide.product;
  }
  return { ok: true, value: output };
}

function validateCarouselPayload(payload) {
  if (!isPlainObject(payload) || hasUnknownFields(payload, new Set(["slides"]))) {
    return failure("The carousel request is invalid.");
  }
  let payloadBytes;
  try {
    payloadBytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
  } catch {
    return failure("The carousel request is invalid.");
  }
  if (payloadBytes > MAX_CAROUSEL_BYTES) return failure("The carousel request must be 8 MB or smaller.");
  if (!Array.isArray(payload.slides) || payload.slides.length < 1 || payload.slides.length > 5) {
    return failure("The carousel must contain between one and five slides.");
  }

  const slides = [];
  const ids = new Set();
  for (const slide of payload.slides) {
    const result = validateSlide(slide);
    if (!result.ok) return result;
    if (ids.has(result.value.id)) return failure("Carousel slide IDs must be unique.");
    ids.add(result.value.id);
    slides.push(result.value);
  }
  return { ok: true, slides, message: "Carousel validated." };
}

module.exports = {
  MAX_CAROUSEL_BYTES,
  MAX_IMAGE_BYTES,
  PRODUCT_IDS,
  validateCarouselPayload,
  validateContactPayload,
};