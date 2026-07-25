document.body.classList.add("js-enabled");
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
const supportChatButton = document.querySelector("[data-support-chat]");
const chatPanel = document.querySelector("[data-chat-panel]");
const chatClose = document.querySelector("[data-chat-close]");
const chatMessages = document.querySelector("[data-chat-messages]");
const chatContact = document.querySelector("[data-chat-contact]");
const leadBuilder = document.querySelector("[data-lead-builder]");
const leadForm = document.querySelector("[data-lead-form]");
const openLeadButtons = document.querySelectorAll("[data-open-lead-builder]");

let products = {};
let activeProductId = "law";
let activeHeroIndex = 0;
let pendingDemoUrl = "product-demo.html?product=law";
let heroTimer;

const heroArt = document.querySelector("[data-hero-art]");
const heroKicker = document.querySelector("[data-hero-kicker]");
const heroTitle = document.querySelector("[data-hero-title]");
const heroCopy = document.querySelector("[data-hero-copy]");
const heroPrimary = document.querySelector("[data-hero-primary]");
const heroSecondary = document.querySelector("[data-hero-secondary]");
const heroControls = document.querySelector("[data-hero-controls]");
let heroSlideButtons = document.querySelectorAll("[data-hero-slide]");

let heroSlides = [
  {
    image: "assets/bizyako-hero-vibrant.png",
    kicker: "Your Business, Powered by AI.",
    status: "Unified suite live",
    title: "Business software that feels built for you.",
    copy: "Modern CRM, ERP, POS, analytics, ISP management, and AI agent tools designed around real business workflows.",
    primary: "Explore products",
    secondary: "Book a demo",
    primaryHref: "#products",
    secondaryHref: "#contact",
  },
  {
    image: "assets/bizyako-hero.png",
    kicker: "Automation without the chaos",
    status: "AI workflows ready",
    title: "Turn repetitive operations into guided, intelligent workflows.",
    copy: "BizYako connects intake, approvals, reminders, reports, tickets, billing, and customer follow-up so teams spend less time chasing work.",
    primary: "See AI agents",
    secondary: "Map my workflow",
    primaryHref: "#products",
    secondaryHref: "#process",
    product: "agents",
  },
  {
    image: "assets/bizyako-hero-vibrant.png",
    kicker: "Data that managers can act on",
    status: "Decision layer online",
    title: "From POS to ERP to analytics, your business finally speaks one language.",
    copy: "Give every product a clean data layer with dashboards, alerts, role views, and executive summaries for faster decisions.",
    primary: "View analytics",
    secondary: "Start a sprint",
    primaryHref: "#products",
    secondaryHref: "#contact",
    product: "analytics",
  },
];


const setHeroSlide = (index) => {
  if (!heroSlides.length) return;
  const slide = heroSlides[index % heroSlides.length];
  activeHeroIndex = index % heroSlides.length;
  document.querySelector('.hero')?.classList.add('hero-transitioning');

  window.setTimeout(() => {
    if (heroArt) heroArt.src = slide.image;
    if (heroKicker) heroKicker.textContent = slide.kicker;
    if (heroTitle) heroTitle.textContent = slide.title;
    if (heroCopy) heroCopy.textContent = slide.copy;
    if (heroPrimary) {
      heroPrimary.textContent = slide.primary;
      heroPrimary.href = slide.primaryHref;
      if (slide.product) heroPrimary.dataset.consoleProduct = slide.product;
      else delete heroPrimary.dataset.consoleProduct;
    }
    if (heroSecondary) {
      heroSecondary.textContent = slide.secondary;
      heroSecondary.href = slide.secondaryHref;
    }
    if (apiStatus) apiStatus.textContent = slide.status;
    heroSlideButtons.forEach((button, buttonIndex) => {
      button.classList.toggle('active', buttonIndex === activeHeroIndex);
      button.setAttribute('aria-pressed', buttonIndex === activeHeroIndex ? 'true' : 'false');
    });
    document.querySelector('.hero')?.classList.remove('hero-transitioning');
  }, 160);
};

const startHeroCarousel = () => {
  window.clearInterval(heroTimer);
  heroTimer = window.setInterval(() => setHeroSlide((activeHeroIndex + 1) % heroSlides.length), 6500);
};

const bindHeroSlideButtons = () => {
  heroSlideButtons = document.querySelectorAll("[data-hero-slide]");
  heroSlideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setHeroSlide(Number(button.dataset.heroSlide || 0));
      startHeroCarousel();
    });
  });
};

const renderHeroControls = () => {
  if (!heroControls) return;
  heroControls.innerHTML = heroSlides
    .map((slide, index) => {
      const activeClass = index === activeHeroIndex ? "active" : "";
      const label = escapeHtml(slide.label || slide.id || "Slide " + (index + 1));
      return '<button class="' + activeClass + '" type="button" data-hero-slide="' + index + '"><span>' + String(index + 1).padStart(2, "0") + '</span>' + label + '</button>';
    })
    .join("");
  bindHeroSlideButtons();
};

const hydrateHeroSlides = (slides) => {
  if (!Array.isArray(slides) || slides.length === 0) return;
  heroSlides = slides.slice(0, 5);
  activeHeroIndex = 0;
  renderHeroControls();
  setHeroSlide(0);
  startHeroCarousel();
};

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
    demoUrl: "product-demo.html?product=law",
  },
  {
    id: "erp",
    kicker: "Enterprise workflows",
    title: "ERP modules for finance, approvals, procurement, and teams.",
    text: "Bring departments into one operating system with clean permissions, audit trails, approval flows, and real-time reporting.",
    points: ["Procurement, inventory, HR, and finance modules", "Branch and department-level permissions", "Management reports with export-ready data"],
    demoUrl: "product-demo.html?product=erp",
  },
  {
    id: "pos",
    kicker: "Retail systems",
    title: "POS tools built for speed, stock control, and branch clarity.",
    text: "Serve customers quickly while keeping inventory, payments, staff activity, and sales performance synchronized.",
    points: ["Fast checkout and payment tracking", "Inventory alerts and product movement", "Multi-branch sales summaries"],
    demoUrl: "product-demo.html?product=pos",
  },
  {
    id: "analytics",
    kicker: "Decision intelligence",
    title: "Dashboards that turn business data into action.",
    text: "Unify operational data into practical reports, alerts, and AI-assisted analysis for leaders and department heads.",
    points: ["Executive and team dashboards", "Trend analysis and automated alerts", "Data cleanup, imports, and integrations"],
    demoUrl: "product-demo.html?product=analytics",
  },
  {
    id: "isp",
    kicker: "Network operations",
    title: "ISP management for subscribers, billing, support, and field work.",
    text: "Manage customer plans, service tickets, network assets, billing status, and installation workflows from a single view.",
    points: ["Subscriber onboarding and plan management", "Ticketing, dispatch, and service history", "Billing, reminders, and network asset visibility"],
    demoUrl: "product-demo.html?product=isp",
  },
  {
    id: "agents",
    kicker: "AI workforce",
    title: "AI agents that handle repetitive business work around the clock.",
    text: "Deploy role-aware agents for intake, follow-ups, reporting, ticket triage, reminders, and operations support while your team stays in control.",
    points: ["Client and lead response agents", "Reporting and workflow assistants", "Human approval paths and audit trails"],
    demoUrl: "product-demo.html?product=agents",
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
    productPreview.textContent = "View product page";
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
  pendingDemoUrl = product.demoUrl || `product-demo.html?product=${activeProductId}`;
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

const productGuides = {
  law: {
    user: "I need a law firm CRM.",
    title: "Law CRM is the right starting point.",
    text: "BizYako can help you manage client intake, matters, deadlines, documents, billing, and partner visibility from one workspace.",
    next: "A good next step is a CRM demo or a product brief for your firm workflow.",
  },
  erp: {
    user: "I need an ERP.",
    title: "ERP fits operations that need control across departments.",
    text: "BizYako can structure procurement, HR, finance, inventory, approvals, reporting, and permissions into a phased ERP rollout.",
    next: "Define the modules you need first so the build can launch in practical phases.",
  },
  pos: {
    user: "I need a POS system.",
    title: "POS is ideal for sales, stock, and branch visibility.",
    text: "BizYako can connect checkout, payments, inventory movement, staff activity, loyalty, and management dashboards.",
    next: "A demo can show the sales-to-reporting flow, then we can scope branches and inventory needs.",
  },
  analytics: {
    user: "I need analytics.",
    title: "Analytics helps leadership act faster.",
    text: "BizYako can unify data into dashboards, alerts, trends, imports, and executive summaries across your existing systems.",
    next: "Start by defining your data sources and the decisions each dashboard should support.",
  },
  isp: {
    user: "I need ISP management.",
    title: "ISP management keeps subscribers, billing, and field work aligned.",
    text: "BizYako can support plans, tickets, reminders, network assets, service history, dispatch, and billing status.",
    next: "Define your subscriber flow and current billing/support tools so the first release targets the biggest bottleneck.",
  },
  agents: {
    user: "I need AI agents.",
    title: "AI agents fit repetitive follow-ups and operations support.",
    text: "BizYako can design controlled agents for lead response, reminders, ticket triage, reporting, and workflow assistance with human approvals.",
    next: "A workflow map will show where agents save time without losing control.",
  },
  custom: {
    user: "I want to define a custom product.",
    title: "Let us shape your product brief.",
    text: "Tell us the industry, product type, must-have modules, timeline, and business goal. BizYako will convert that into a clear consultation request.",
    next: "Open the product definition form and describe the system you want to create.",
  },
};

const appendChatMessage = (type, content) => {
  if (!chatMessages) return;
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${type}`;
  if (typeof content === "string") {
    bubble.innerHTML = `<span>${escapeHtml(content)}</span>`;
  } else {
    bubble.innerHTML = content;
  }
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

const openChatPanel = () => {
  if (!chatPanel) return;
  chatPanel.classList.add("open");
  chatPanel.setAttribute("aria-hidden", "false");
  supportChatButton?.classList.add("active");
};

const closeChatPanel = () => {
  if (!chatPanel) return;
  chatPanel.classList.remove("open");
  chatPanel.setAttribute("aria-hidden", "true");
  supportChatButton?.classList.remove("active");
};

const openLeadBuilder = (productId = activeProductId) => {
  if (!leadBuilder) return;
  const select = leadBuilder.querySelector('select[name="product"]');
  const productMap = {
    law: "CRM",
    erp: "ERP",
    pos: "POS",
    analytics: "Analytics dashboard",
    isp: "ISP management",
    agents: "AI agent workflow",
  };
  if (select && productMap[productId]) select.value = productMap[productId];
  leadBuilder.classList.add("open");
  leadBuilder.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  leadBuilder.querySelector("input")?.focus();
};

const closeLeadBuilder = () => {
  if (!leadBuilder) return;
  leadBuilder.classList.remove("open");
  leadBuilder.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

const handleChatIntent = (intent) => {
  const guide = productGuides[intent] || productGuides.custom;
  appendChatMessage("user", guide.user);
  window.setTimeout(() => {
    appendChatMessage(
      "bot",
      `<strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.text)}</span><span>${escapeHtml(guide.next)}</span><div class="chat-inline-actions"><button type="button" data-open-lead-builder>Define product</button><a href="#contact" data-chat-contact>Book consultation</a></div>`
    );
  }, 180);

  if (intent !== "custom") activateProduct(intent, false);
  if (intent === "custom") window.setTimeout(() => openLeadBuilder(activeProductId), 520);
};

supportChatButton?.addEventListener("click", () => {
  if (chatPanel?.classList.contains("open")) closeChatPanel();
  else openChatPanel();
});
chatClose?.addEventListener("click", closeChatPanel);
chatPanel?.addEventListener("click", (event) => {
  const quick = event.target.closest("[data-chat-intent]");
  if (quick) handleChatIntent(quick.dataset.chatIntent);

  const leadButton = event.target.closest("[data-open-lead-builder]");
  if (leadButton) openLeadBuilder(activeProductId);

  const contactLink = event.target.closest("[data-chat-contact]");
  if (contactLink) closeChatPanel();
});
openLeadButtons.forEach((button) => button.addEventListener("click", () => openLeadBuilder(activeProductId)));
document.querySelectorAll("[data-lead-close]").forEach((item) => item.addEventListener("click", closeLeadBuilder));

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = leadForm.querySelector("button");
  const data = Object.fromEntries(new FormData(leadForm).entries());
  const payload = {
    name: data.name,
    need: `Product definition: ${data.product}`,
    message: [
      `Product definition lead for ${data.company}.`,
      `Contact: ${data.contact}.`,
      `Industry: ${data.industry}.`,
      `Product type: ${data.product}.`,
      `Timeline: ${data.timeline}.`,
      `Budget direction: ${data.budget}.`,
      `Must-have modules: ${data.modules}.`,
      `Goal: ${data.goal}.`,
    ].join(" "),
  };

  button.textContent = "Sending product brief...";
  button.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    button.textContent = result.ok ? "Product brief sent" : "Check your details";
    if (result.ok) {
      appendChatMessage("bot", "Your product brief has been sent. BizYako will use it to prepare the right consultation path.");
      setTimeout(() => {
        leadForm.reset();
        closeLeadBuilder();
        button.textContent = "Send product brief";
        button.disabled = false;
      }, 1500);
      return;
    }
  } catch (error) {
    button.textContent = "Backend unavailable";
  }

  setTimeout(() => {
    button.textContent = "Send product brief";
    button.disabled = false;
  }, 2200);
});
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
    hydrateHeroSlides(site.carouselSlides);
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
    apiStatus.dataset.backendState = health.ok ? "Backend live" : "Backend checking";
  } catch (error) {
    apiStatus.dataset.backendState = "Frontend preview";
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
      button.textContent = "Opening demo preview...";
      setTimeout(() => {
        demoForm.reset();
        window.location.href = pendingDemoUrl;
      }, 900);
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

renderHeroControls();
setHeroSlide(0);
startHeroCarousel();
loadSiteData();
syncBackendStatus();
revealSections();





