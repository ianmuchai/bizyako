const editor = document.querySelector("[data-slide-editor]");
const specsBox = document.querySelector("[data-poster-specs]");
const saveButton = document.querySelector("[data-save-carousel]");
const statusText = document.querySelector("[data-admin-status]");

let slides = [];

const staticPosterSpecs = {
  recommended: "1920 x 1080 px",
  ratio: "16:9 landscape",
  safeZone: "Keep important text inside the center 60% width and center 72% height.",
  formats: "PNG, JPG, JPEG, WebP, AVIF, or SVG",
  maxGuidance: "Use compressed WebP/JPG under 500 KB where possible. PNG is okay for graphic posters.",
};

const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[character];
  });

const field = (slide, index, key, label, type = "text", help = "") => `
  <label>
    <span>${label}</span>
    ${type === "textarea" ? `<textarea data-slide-index="${index}" data-slide-key="${key}" rows="3">${escapeHtml(slide[key])}</textarea>` : `<input data-slide-index="${index}" data-slide-key="${key}" type="text" value="${escapeHtml(slide[key])}" />`}
    ${help ? `<small>${help}</small>` : ""}
  </label>
`;

const renderSpecs = (specs = {}) => {
  const specItems = [
    ["Recommended size", specs.recommended || "1920 x 1080 px"],
    ["Aspect ratio", specs.ratio || "16:9 landscape"],
    ["Safe zone", specs.safeZone || "Keep important text inside the center 60% width and center 72% height."],
    ["Formats", specs.formats || "PNG, JPG, JPEG, WebP, AVIF, or SVG"],
    ["File guidance", specs.maxGuidance || "Use compressed WebP/JPG under 500 KB where possible."],
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
    meta.innerHTML = `<strong>${width} x ${height}px</strong><span>${ideal ? "Perfect 1920 x 1080 poster." : closeRatio ? "Correct 16:9 ratio. 1920 x 1080 is still recommended." : "Not 16:9. Redesign or crop this poster before publishing."}</span>`;
  };
  image.onerror = () => {
    meta.classList.remove("good");
    meta.classList.add("warn");
    meta.innerHTML = "<strong>Preview unavailable</strong><span>Check the image path, URL, or uploaded file.</span>";
  };
  image.src = src;
};

const renderSlides = () => {
  editor.innerHTML = slides.map((slide, index) => `
    <article class="admin-slide-card">
      <div class="admin-slide-preview">
        <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.label || `Slide ${index + 1}`)} preview" />
        <div class="admin-image-meta" data-image-meta><strong>Checking image...</strong><span>Recommended: 1920 x 1080 px</span></div>
      </div>
      <div class="admin-slide-fields">
        <div class="admin-slide-title-row">
          <div>
            <p class="eyebrow">Carousel Poster</p>
            <h2>Poster ${index + 1}</h2>
          </div>
          <span>1920 x 1080</span>
        </div>
        <label class="admin-upload-field">
          <span>Replace poster image</span>
          <input data-slide-index="${index}" data-image-upload type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml" />
          <small>Upload PNG, JPG, WebP, AVIF, or SVG. WebP/JPG under 500 KB is best for speed.</small>
        </label>
        ${field(slide, index, "image", "Image path, URL, or uploaded data", "text", "Use assets/name.webp for committed files, a full https:// URL, or upload a local file above.")}
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
        ${field(slide, index, "product", "Optional product id", "text", "Use law, erp, pos, analytics, isp, or agents when the slide should activate a product.")}
      </div>
    </article>
  `).join("");

  editor.querySelectorAll(".admin-slide-card").forEach((card, index) => {
    updateImageMeta(card, slides[index].image);
  });

  editor.querySelectorAll("input[data-slide-key], textarea[data-slide-key]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.slideIndex);
      slides[index][input.dataset.slideKey] = input.value;
      const card = input.closest(".admin-slide-card");
      if (input.dataset.slideKey === "image") {
        card.querySelector("img").src = input.value;
        updateImageMeta(card, input.value);
      }
    });
  });

  editor.querySelectorAll("[data-image-upload]").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const index = Number(input.dataset.slideIndex);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        slides[index].image = dataUrl;
        const card = input.closest(".admin-slide-card");
        const imageInput = card.querySelector('[data-slide-key="image"]');
        imageInput.value = dataUrl;
        card.querySelector("img").src = dataUrl;
        updateImageMeta(card, dataUrl);
        statusText.textContent = `Poster ${index + 1} image loaded. Save locally, then push/deploy to publish.`;
      };
      reader.readAsDataURL(file);
    });
  });
};

async function loadCarousel() {
  try {
    const response = await fetch("/api/carousel");
    if (!response.ok) throw new Error("Carousel API unavailable");
    const payload = await response.json();
    slides = (payload.slides || []).slice(0, 5);
    renderSpecs(payload.posterSpecs || staticPosterSpecs);
    renderSlides();
    return;
  } catch (error) {
    const response = await fetch("data/carouselSlides.json");
    const staticSlides = await response.json();
    slides = (Array.isArray(staticSlides) ? staticSlides : []).slice(0, 5);
    renderSpecs(staticPosterSpecs);
    renderSlides();
    statusText.textContent = "Static hosting mode: preview and dimension checks work here, but saving requires the local BizYako Node server.";
  }
}

saveButton.addEventListener("click", async () => {
  statusText.textContent = "Saving carousel posters...";
  saveButton.disabled = true;
  try {
    const response = await fetch("/api/carousel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides }),
    });
    const result = await response.json();
    statusText.textContent = result.message || (result.ok ? "Saved. Push to GitHub/Vercel to publish." : "Could not save.");
  } catch (error) {
    statusText.textContent = "Could not save. Run BizYako locally to write poster changes.";
  }
  saveButton.disabled = false;
});

loadCarousel().catch(() => {
  statusText.textContent = "Could not load carousel data.";
});

