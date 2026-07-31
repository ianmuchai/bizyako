"use strict";

const loginPanel = document.querySelector("[data-admin-login]");
const loginForm = document.querySelector("[data-admin-login-form]");
const loginStatus = document.querySelector("[data-admin-login-status]");
const adminShell = document.querySelector("[data-admin-shell]");
const logoutButton = document.querySelector("[data-admin-logout]");
const editor = document.querySelector("[data-slide-editor]");
const specsBox = document.querySelector("[data-poster-specs]");
const saveButton = document.querySelector("[data-save-carousel]");
const statusText = document.querySelector("[data-admin-status]");

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
let slides = [];
let csrfToken = "";

const staticPosterSpecs = {
  recommended: "1920 x 1080 px",
  ratio: "16:9 landscape",
  safeZone: "Keep important text inside the center 60% width and center 72% height.",
  formats: "PNG, JPG, JPEG, WebP, or AVIF",
  maxGuidance: "Use compressed WebP/JPG under 500 KB where possible. PNG is suitable for graphic posters.",
};

const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[character];
  });

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return { ok: false, message: "The server returned an unexpected response." };
  }
};

const field = (slide, index, key, label, type = "text", help = "") => `
  <label>
    <span>${escapeHtml(label)}</span>
    ${type === "textarea"
      ? `<textarea data-slide-index="${index}" data-slide-key="${key}" rows="3">${escapeHtml(slide[key])}</textarea>`
      : `<input data-slide-index="${index}" data-slide-key="${key}" type="text" value="${escapeHtml(slide[key])}" />`}
    ${help ? `<small>${escapeHtml(help)}</small>` : ""}
  </label>
`;

const showLogin = (message = "") => {
  csrfToken = "";
  slides = [];
  editor.innerHTML = "";
  adminShell.hidden = true;
  adminShell.setAttribute("inert", "");
  loginPanel.hidden = false;
  loginStatus.textContent = message;
};

const showEditor = (session) => {
  csrfToken = session.csrfToken;
  loginPanel.hidden = true;
  adminShell.hidden = false;
  adminShell.removeAttribute("inert");
  loginStatus.textContent = "";
};

const renderSpecs = (specs = {}) => {
  const specItems = [
    ["Recommended size", specs.recommended || staticPosterSpecs.recommended],
    ["Aspect ratio", specs.ratio || staticPosterSpecs.ratio],
    ["Safe zone", specs.safeZone || staticPosterSpecs.safeZone],
    ["Formats", specs.formats || staticPosterSpecs.formats],
    ["File guidance", specs.maxGuidance || staticPosterSpecs.maxGuidance],
  ];

  specsBox.innerHTML = specItems
    .map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`)
    .join("");
};

const updateImageMeta = (card, src) => {
  const meta = card.querySelector("[data-image-meta]");
  if (!meta || !src) return;
  const image = new Image();
  image.onload = () => {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const ratio = width && height ? width / height : 0;
    const ideal = width === 1920 && height === 1080;
    const closeRatio = Math.abs(ratio - 16 / 9) < 0.03;
    meta.classList.toggle("good", ideal || closeRatio);
    meta.classList.toggle("warn", !ideal && !closeRatio);
    meta.innerHTML = `<strong>${width} x ${height}px</strong><span>${ideal
      ? "Perfect 1920 x 1080 poster."
      : closeRatio
        ? "Correct 16:9 ratio. 1920 x 1080 remains recommended."
        : "Not 16:9. Redesign or crop this poster before publishing."}</span>`;
  };
  image.onerror = () => {
    meta.classList.remove("good");
    meta.classList.add("warn");
    meta.innerHTML = "<strong>Preview unavailable</strong><span>Check the local asset path or uploaded raster file.</span>";
  };
  image.src = src;
};

const hasRasterSignature = (mime, bytes) => {
  if (mime === "image/png") {
    return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((value, index) => bytes[index] === value);
  }
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/webp") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  if (mime === "image/avif") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp"
      && ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)));
  }
  return false;
};

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Unable to read image."));
  reader.readAsDataURL(file);
});

const renderSlides = () => {
  editor.innerHTML = slides.map((slide, index) => `
    <article class="admin-slide-card">
      <div class="admin-slide-preview">
        <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.label || `Slide ${index + 1}`)} preview" />
        <div class="admin-image-meta" data-image-meta><strong>Checking image...</strong><span>Recommended: 1920 x 1080 px</span></div>
      </div>
      <div class="admin-slide-fields">
        <div class="admin-slide-title-row">
          <div><p class="eyebrow">Carousel Poster</p><h2>Poster ${index + 1}</h2></div>
          <span>1920 x 1080</span>
        </div>
        <label class="admin-upload-field">
          <span>Replace poster image</span>
          <input data-slide-index="${index}" data-image-upload type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
          <small>Upload PNG, JPG, WebP, or AVIF up to 2 MB. Compressed WebP/JPG under 500 KB is best for speed.</small>
        </label>
        ${field(slide, index, "image", "Committed image path or uploaded data", "text", "Use an assets/name.webp path or upload a raster file above.")}
        ${field(slide, index, "label", "Carousel control label")}
        ${field(slide, index, "kicker", "Eyebrow/kicker")}
        ${field(slide, index, "status", "Status pill text")}
        ${field(slide, index, "title", "Hero headline", "textarea")}
        ${field(slide, index, "copy", "Hero paragraph", "textarea")}
        <div class="admin-field-row">
          ${field(slide, index, "primary", "Primary button")}
          ${field(slide, index, "primaryHref", "Primary link")}
        </div>
        <div class="admin-field-row">
          ${field(slide, index, "secondary", "Secondary button")}
          ${field(slide, index, "secondaryHref", "Secondary link")}
        </div>
        ${field(slide, index, "product", "Optional product id", "text", "Use law, erp, pos, analytics, isp, agents, mobile, pwa, or websites.")}
      </div>
    </article>
  `).join("");

  editor.querySelectorAll(".admin-slide-card").forEach((card, index) => updateImageMeta(card, slides[index].image));
  editor.querySelectorAll("input[data-slide-key], textarea[data-slide-key]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.slideIndex);
      slides[index][input.dataset.slideKey] = input.value;
      if (input.dataset.slideKey === "image") {
        const card = input.closest(".admin-slide-card");
        card.querySelector("img").src = input.value;
        updateImageMeta(card, input.value);
      }
    });
  });

  editor.querySelectorAll("[data-image-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const index = Number(input.dataset.slideIndex);
      if (!allowedImageTypes.has(file.type)) {
        statusText.textContent = `Poster ${index + 1}: choose a PNG, JPG, WebP, or AVIF file.`;
        input.value = "";
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        statusText.textContent = `Poster ${index + 1}: the image must be 2 MB or smaller.`;
        input.value = "";
        return;
      }

      try {
        const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
        if (!hasRasterSignature(file.type, bytes)) {
          statusText.textContent = `Poster ${index + 1}: the file contents do not match the selected image format.`;
          input.value = "";
          return;
        }
        const dataUrl = await readAsDataUrl(file);
        slides[index].image = dataUrl;
        const card = input.closest(".admin-slide-card");
        card.querySelector('[data-slide-key="image"]').value = dataUrl;
        card.querySelector("img").src = dataUrl;
        updateImageMeta(card, dataUrl);
        statusText.textContent = `Poster ${index + 1} is ready. Save locally, then push the data update to publish elsewhere.`;
      } catch {
        statusText.textContent = `Poster ${index + 1}: the image could not be read.`;
      }
    });
  });
};

async function loadCarousel() {
  const response = await fetch("/api/carousel", { credentials: "same-origin", cache: "no-store" });
  if (response.status === 401) {
    showLogin("Your session expired. Sign in again.");
    return;
  }
  if (!response.ok) throw new Error("Carousel API unavailable");
  const payload = await response.json();
  slides = (payload.slides || []).slice(0, 5);
  renderSpecs(payload.posterSpecs || staticPosterSpecs);
  renderSlides();
  statusText.textContent = "Five carousel posters loaded. Review dimensions and save when ready.";
}

async function inspectSession() {
  showLogin("Checking secure session...");
  try {
    const response = await fetch("/api/admin-auth", { credentials: "same-origin", cache: "no-store" });
    const session = await safeJson(response);
    if (!response.ok || !session.authenticated || !session.csrfToken) {
      showLogin(response.status === 503 ? "Administration is not configured on this host." : "Sign in to continue.");
      return;
    }
    showEditor(session);
    await loadCarousel();
  } catch {
    showLogin("The secure admin service is unavailable on this host.");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  const passwordInput = loginForm.elements.password;
  button.disabled = true;
  button.textContent = "Signing in...";
  loginStatus.textContent = "";
  try {
    const response = await fetch("/api/admin-auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value }),
    });
    const result = await safeJson(response);
    passwordInput.value = "";
    if (!response.ok || !result.authenticated || !result.csrfToken) {
      loginStatus.textContent = result.message || "Unable to sign in.";
      return;
    }
    showEditor(result);
    await loadCarousel();
  } catch {
    loginStatus.textContent = "The secure admin service is unavailable.";
  } finally {
    button.disabled = false;
    button.textContent = "Sign in securely";
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await fetch("/api/admin-auth", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrfToken },
    });
  } finally {
    logoutButton.disabled = false;
    showLogin("You have signed out securely.");
  }
});

saveButton.addEventListener("click", async () => {
  statusText.textContent = "Saving carousel posters...";
  saveButton.disabled = true;
  const payloadSlides = slides.map((slide) => {
    const output = { ...slide };
    if (!String(output.product || "").trim()) delete output.product;
    return output;
  });

  try {
    const response = await fetch("/api/carousel", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ slides: payloadSlides }),
    });
    const result = await safeJson(response);
    if (response.status === 401) {
      showLogin("Your session expired. Sign in again.");
      return;
    }
    statusText.textContent = result.message || (result.ok ? "Carousel posters saved." : "The carousel could not be saved.");
    if (result.ok && Array.isArray(result.slides)) slides = result.slides;
  } catch {
    statusText.textContent = "The carousel could not be saved. Check the secure local server and try again.";
  } finally {
    saveButton.disabled = false;
  }
});

inspectSession();