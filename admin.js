const editor = document.querySelector("[data-slide-editor]");
const specsBox = document.querySelector("[data-poster-specs]");
const saveButton = document.querySelector("[data-save-carousel]");
const statusText = document.querySelector("[data-admin-status]");

let slides = [];

const field = (slide, index, key, label, type = "text") => `
  <label>
    ${label}
    ${type === "textarea" ? `<textarea data-slide-index="${index}" data-slide-key="${key}" rows="3">${slide[key] || ""}</textarea>` : `<input data-slide-index="${index}" data-slide-key="${key}" type="text" value="${slide[key] || ""}" />`}
  </label>
`;

const renderSpecs = (specs = {}) => {
  specsBox.innerHTML = `
    <article><span>Recommended size</span><strong>${specs.recommended || "1920 x 1080 px"}</strong></article>
    <article><span>Aspect ratio</span><strong>${specs.ratio || "16:9 landscape"}</strong></article>
    <article><span>Safe zone</span><strong>${specs.safeZone || "Center text and faces."}</strong></article>
    <article><span>Formats</span><strong>${specs.formats || "PNG, JPG, WebP"}</strong></article>
  `;
};

const renderSlides = () => {
  editor.innerHTML = slides.map((slide, index) => `
    <article class="admin-slide-card">
      <div class="admin-slide-preview"><img src="${slide.image}" alt="${slide.label || `Slide ${index + 1}`} preview" /></div>
      <div class="admin-slide-fields">
        <h2>Poster ${index + 1}</h2>
        ${field(slide, index, "label", "Control label")}
        ${field(slide, index, "image", "Poster image path or URL")}
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
        ${field(slide, index, "product", "Optional product id")}
      </div>
    </article>
  `).join("");

  editor.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", () => {
      slides[Number(input.dataset.slideIndex)][input.dataset.slideKey] = input.value;
      const card = input.closest(".admin-slide-card");
      if (input.dataset.slideKey === "image") card.querySelector("img").src = input.value;
    });
  });
};

async function loadCarousel() {
  const response = await fetch("/api/carousel");
  const payload = await response.json();
  slides = (payload.slides || []).slice(0, 5);
  renderSpecs(payload.posterSpecs);
  renderSlides();
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
    statusText.textContent = result.message || (result.ok ? "Saved." : "Could not save.");
  } catch (error) {
    statusText.textContent = "Could not save. Run BizYako locally to write poster changes.";
  }
  saveButton.disabled = false;
});

loadCarousel().catch(() => {
  statusText.textContent = "Could not load carousel data.";
});
