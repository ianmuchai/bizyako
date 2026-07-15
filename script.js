const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const tabs = document.querySelectorAll("[data-product]");
const productKicker = document.querySelector("[data-product-kicker]");
const productTitle = document.querySelector("[data-product-title]");
const productText = document.querySelector("[data-product-text]");
const productList = document.querySelector("[data-product-list]");
const productDemo = document.querySelector("[data-product-demo]");
const productPreview = document.querySelector("[data-product-preview]");
const contactForm = document.querySelector(".contact-form");
const industriesGrid = document.querySelector("[data-industries]");
const apiStatus = document.querySelector("[data-api-status]");
const demoModal = document.querySelector("[data-demo-modal]");
const demoForm = document.querySelector("[data-demo-form]");
const demoProductName = document.querySelector("[data-demo-product-name]");
const demoNeed = document.querySelector("[data-demo-need]");
const demoMessage = document.querySelector("[data-demo-message]");

let products = {};
let activeProductId = "law";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

const fallbackProducts = [
  {
    id: "law",
    kicker: "Legal operations",
    title: "Law firm CRM that keeps every matter visible.",
    text: "Track clients, matters, deadlines, billing, document movement, task ownership, and follow-ups from one focused workspace.",
    points: ["Client intake and matter pipelines", "Deadline, task, and fee tracking", "Partner-level performance dashboards"],
    demoUrl: "#contact",
  },
  {
    id: "erp",
    kicker: "Enterprise workflows",
    title: "ERP modules for finance, approvals, procurement, and teams.",
    text: "Bring departments into one operating system with clean permissions, audit trails, approval flows, and real-time reporting.",
    points: ["Procurement, inventory, HR, and finance modules", "Branch and department-level permissions", "Management reports with export-ready data"],
    demoUrl: "#contact",
  },
  {
    id: "pos",
    kicker: "Retail systems",
    title: "POS tools built for speed, stock control, and branch clarity.",
    text: "Serve customers quickly while keeping inventory, payments, staff activity, and sales performance synchronized.",
    points: ["Fast checkout and payment tracking", "Inventory alerts and product movement", "Multi-branch sales summaries"],
    demoUrl: "#contact",
  },
  {
    id: "analytics",
    kicker: "Decision intelligence",
    title: "Dashboards that turn business data into action.",
    text: "Unify operational data into practical reports, alerts, and AI-assisted analysis for leaders and department heads.",
    points: ["Executive and team dashboards", "Trend analysis and automated alerts", "Data cleanup, imports, and integrations"],
    demoUrl: "#contact",
  },
  {
    id: "isp",
    kicker: "Network operations",
    title: "ISP management for subscribers, billing, support, and field work.",
    text: "Manage customer plans, service tickets, network assets, billing status, and installation workflows from a single view.",
    points: ["Subscriber onboarding and plan management", "Ticketing, dispatch, and service history", "Billing, reminders, and network asset visibility"],
    demoUrl: "#contact",
  },
  {
    id: "agents",
    kicker: "AI workforce",
    title: "AI agents that handle repetitive business work around the clock.",
    text: "Deploy role-aware agents for intake, follow-ups, reporting, ticket triage, reminders, and operations support while your team stays in control.",
    points: ["Client and lead response agents", "Reporting and workflow assistants", "Human approval paths and audit trails"],
    demoUrl: "#contact",
  },
];

const productLabel = (product) => {
  if (!product) return "BizYako";
  if (product.id === "agents") return "AI agents";
  if (product.id === "law") return "CRM";
  return product.id.toUpperCase();
};

const renderProduct = (id) => {
  const product = products[id];
  if (!product) return;
  activeProductId = id;

  productKicker.textContent = product.kicker;
  productTitle.textContent = product.title;
  productText.textContent = product.text;
  productList.innerHTML = product.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");

  if (productDemo) productDemo.textContent = `Watch ${productLabel(product)} demo`;
  if (productPreview) {
    productPreview.href = product.demoUrl || "#contact";
    productPreview.textContent = "Preview workflow";
  }
};

const activateProduct = (id, shouldScroll = false) => {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.product === id;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll("[data-console-product]").forEach((button) => {
    button.classList.toggle("active", button.dataset.consoleProduct === id);
  });

  renderProduct(id);

  if (shouldScroll) {
    document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const openDemoModal = () => {
  const product = products[activeProductId];
  if (!demoModal || !product) return;

  if (demoProductName) demoProductName.textContent = productLabel(product);
  if (demoNeed) demoNeed.value = `${product.title} demo`;
  if (demoMessage) demoMessage.value = `I would like to sign up and watch a demo for: ${product.title}`;

  demoModal.classList.add("open");
  demoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  demoModal.querySelector("input")?.focus();
};

const closeDemoModal = () => {
  if (!demoModal) return;
  demoModal.classList.remove("open");
  demoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

const industryTargets = {
  "Law firms": { href: "#products", product: "law" },
  "Retail and hospitality": { href: "#products", product: "pos" },
  "ISPs and utilities": { href: "#products", product: "isp" },
  "Growing SMEs": { href: "#products", product: "erp" },
  "AI automation": { href: "#products", product: "agents" },
};

const renderIndustries = (industries) => {
  industriesGrid.innerHTML = industries
    .map((industry) => {
      const target = industryTargets[industry.title] || { href: "#contact" };
      const productAttr = target.product ? ` data-console-product="${target.product}"` : "";

      return `
        <a class="industry-card" href="${target.href}"${productAttr}>
          <h3>${escapeHtml(industry.title)}</h3>
          <p>${escapeHtml(industry.text)}</p>
        </a>
      `;
    })
    .join("");
};

const hydrateProducts = (items) => {
  products = items.reduce((collection, product) => {
    collection[product.id] = product;
    return collection;
  }, {});
  activateProduct(document.querySelector(".tab.active").dataset.product);
};

const loadSiteData = async () => {
  hydrateProducts(fallbackProducts);

  try {
    const response = await fetch("/api/site");
    if (!response.ok) throw new Error("Could not load site API data");
    const site = await response.json();

    hydrateProducts(site.products);
    renderIndustries(site.industries);
  } catch (error) {
    console.warn(error);
  }
};

const syncBackendStatus = async () => {
  if (!apiStatus) return;

  try {
    const response = await fetch("/api/health");
    const health = await response.json();
    apiStatus.textContent = health.ok ? "Backend live" : "Backend checking";
  } catch (error) {
    apiStatus.textContent = "Frontend preview";
  }
};

const revealSections = () => {
  const sections = document.querySelectorAll(".reveal-section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach((section) => observer.observe(section));
};

const syncHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 18);
};

window.addEventListener("scroll", syncHeader);
syncHeader();

menuButton.addEventListener("click", () => {
  header.classList.toggle("open");
});

document.querySelectorAll(".nav-links a, .nav-cta").forEach((link) => {
  link.addEventListener("click", () => header.classList.remove("open"));
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateProduct(tab.dataset.product);
  });
});

document.addEventListener("click", (event) => {
  const productTrigger = event.target.closest("[data-console-product]");
  if (!productTrigger) return;

  const productId = productTrigger.dataset.consoleProduct;
  if (!productId) return;

  event.preventDefault();
  activateProduct(productId, true);
});

productDemo?.addEventListener("click", openDemoModal);
document.querySelectorAll("[data-demo-close]").forEach((item) => item.addEventListener("click", closeDemoModal));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDemoModal();
});

demoForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = demoForm.querySelector("button");
  const data = Object.fromEntries(new FormData(demoForm).entries());
  const payload = {
    name: data.name,
    need: data.need,
    message: `${data.message} Company: ${data.company}. Email: ${data.email}.`,
  };

  button.textContent = "Creating demo access...";
  button.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    button.textContent = result.ok ? "Demo request sent" : "Check your details";
    if (result.ok) {
      setTimeout(() => {
        demoForm.reset();
        closeDemoModal();
        button.textContent = "Sign up and unlock demo";
        button.disabled = false;
      }, 1400);
      return;
    }
  } catch (error) {
    button.textContent = "Backend unavailable";
  }

  setTimeout(() => {
    button.textContent = "Sign up and unlock demo";
    button.disabled = false;
  }, 2200);
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = contactForm.querySelector("button");
  const payload = Object.fromEntries(new FormData(contactForm).entries());

  button.textContent = "Sending...";
  button.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    button.textContent = result.ok ? "Request received" : "Check your details";
    if (result.ok) contactForm.reset();
  } catch (error) {
    button.textContent = "Backend unavailable";
  }

  setTimeout(() => {
    button.textContent = "Request consultation";
    button.disabled = false;
  }, 2200);
});

loadSiteData();
syncBackendStatus();
revealSections();
