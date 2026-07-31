const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MAX_IMAGE_BYTES,
  validateCarouselPayload,
  validateContactPayload,
} = require("../lib/security/validation");

const validContact = (overrides = {}) => ({
  name: "Amina Kamau",
  need: "ERP workflow",
  message: "We need approvals, inventory, reporting, and finance in one workspace.",
  website: "",
  formStartedAt: Date.now() - 5_000,
  ...overrides,
});

const validSlide = (overrides = {}) => ({
  id: "suite",
  label: "Suite",
  image: "assets/bizyako-hero-vibrant.png",
  kicker: "Your Business, Powered by AI.",
  status: "Unified suite live",
  title: "Business software that feels built for you.",
  copy: "Modern CRM, ERP, POS, analytics, ISP management, and AI tools.",
  primary: "Explore products",
  secondary: "Book a demo",
  primaryHref: "#products",
  secondaryHref: "#contact",
  ...overrides,
});

const dataUrl = (mime, bytes) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

test("contact validation accepts the public form shape and normalizes text", () => {
  const result = validateContactPayload(validContact({ name: "  Amina Kamau  " }));

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Amina Kamau");
  assert.equal(result.value.website, undefined);
  assert.equal(result.value.formStartedAt, undefined);
});

test("contact validation rejects unknown fields, honeypots, rushed submits, and oversized values", () => {
  assert.equal(validateContactPayload(validContact({ admin: true })).ok, false);
  assert.match(validateContactPayload(validContact({ website: "spam.example" })).message, /unable/i);
  assert.match(validateContactPayload(validContact({ formStartedAt: Date.now() - 50 })).message, /moment/i);
  assert.equal(validateContactPayload(validContact({ name: "x" })).ok, false);
  assert.equal(validateContactPayload(validContact({ message: "x".repeat(4_001) })).ok, false);
});

test("carousel validation preserves approved local raster assets and product links", () => {
  const result = validateCarouselPayload({ slides: [validSlide({ product: "agents" })] });

  assert.equal(result.ok, true);
  assert.equal(result.slides.length, 1);
  assert.equal(result.slides[0].image, "assets/bizyako-hero-vibrant.png");
  assert.equal(result.slides[0].product, "agents");
});

test("carousel validation accepts real PNG, JPEG, WebP, and AVIF signatures", () => {
  const images = [
    dataUrl("image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    dataUrl("image/jpeg", [0xff, 0xd8, 0xff, 0xe0, 0x00]),
    dataUrl("image/webp", Buffer.from("RIFF0000WEBP", "ascii")),
    dataUrl("image/avif", Buffer.from("0000ftypavif0000", "ascii")),
  ];

  for (const [index, image] of images.entries()) {
    assert.equal(validateCarouselPayload({ slides: [validSlide({ id: `slide-${index}`, image })] }).ok, true);
  }
});

test("carousel validation rejects active SVG, spoofed raster bytes, and oversized decoded images", () => {
  const svg = dataUrl("image/svg+xml", Buffer.from("<svg onload=alert(1)></svg>"));
  const spoofedPng = dataUrl("image/png", Buffer.from("<svg></svg>"));
  const oversized = dataUrl("image/png", Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(MAX_IMAGE_BYTES),
  ]));

  assert.equal(validateCarouselPayload({ slides: [validSlide({ image: svg })] }).ok, false);
  assert.equal(validateCarouselPayload({ slides: [validSlide({ image: spoofedPng })] }).ok, false);
  assert.match(validateCarouselPayload({ slides: [validSlide({ image: oversized })] }).message, /2 MB/i);
});

test("carousel validation rejects traversal paths, unsafe links, invalid products, unknown fields, and more than five slides", () => {
  assert.equal(validateCarouselPayload({ slides: [validSlide({ image: "assets/../server.js" })] }).ok, false);
  assert.equal(validateCarouselPayload({ slides: [validSlide({ primaryHref: "javascript:alert(1)" })] }).ok, false);
  assert.equal(validateCarouselPayload({ slides: [validSlide({ product: "root-shell" })] }).ok, false);
  assert.equal(validateCarouselPayload({ slides: [validSlide({ debug: true })] }).ok, false);

  const sixSlides = Array.from({ length: 6 }, (_, index) => validSlide({ id: `slide-${index}` }));
  assert.match(validateCarouselPayload({ slides: sixSlides }).message, /five/i);
});