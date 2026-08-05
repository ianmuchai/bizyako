document.body.classList.add("js-enabled");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
const chatForm = document.querySelector("[data-chat-form]");
const chatInput = document.querySelector("[data-chat-input]");
const chatSend = document.querySelector("[data-chat-send]");
const chatStatus = document.querySelector("[data-chat-status]");
const chatClear = document.querySelector("[data-chat-clear]");
const chatLeadToggle = document.querySelector("[data-chat-lead-toggle]");
const chatLeadForm = document.querySelector("[data-chat-lead-form]");
const chatLeadStatus = document.querySelector("[data-chat-lead-status]");
const leadBuilder = document.querySelector("[data-lead-builder]");
const leadForm = document.querySelector("[data-lead-form]");
const openLeadButtons = document.querySelectorAll("[data-open-lead-builder]");
const installAppButton = document.querySelector("[data-install-app]");
const chatHistory = window.BizYakoChatHistory?.createChatHistory?.() || {
  append: () => [],
  clear: () => {},
  load: () => [],
  save: (messages) => messages,
};
const secureForms = [contactForm, demoForm, leadForm, chatLeadForm].filter(Boolean);

const prepareSecureForm = (form) => {
  const startedAt = form.querySelector('[name="formStartedAt"]');
  const website = form.querySelector('[name="website"]');
  if (startedAt) startedAt.value = String(Date.now());
  if (website) website.value = "";
};

secureForms.forEach(prepareSecureForm);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

let products = {};
let activeProductId = "law";
let activeHeroIndex = 0;
let pendingDemoUrl = "product-demo.html?product=law";
let heroTimer;
let installPrompt = null;

const heroArt = document.querySelector("[data-hero-art]");
const heroKicker = document.querySelector("[data-hero-kicker]");
const heroTitle = document.querySelector("[data-hero-title]");
const heroCopy = document.querySelector("[data-hero-copy]");
const heroPrimary = document.querySelector("[data-hero-primary]");
const heroSecondary = document.querySelector("[data-hero-secondary]");
const heroControls = document.querySelector("[data-hero-controls]");
let heroSlideButtons = document.querySelectorAll("[data-hero-slide]");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installAppButton?.classList.add("available");
});

installAppButton?.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installAppButton.classList.remove("available");
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installAppButton?.classList.remove("available");
});

let heroSlides = [
  {
    image: "assets/bizyako-carousel-impact.png",
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
    image: "assets/bizyako-carousel-growth.png",
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
    image: "assets/bizyako-carousel-wave.png",
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
const openEmailFallback = (payload, fallbackButton, resetText) => {
  const subject = encodeURIComponent(`BizYako inquiry: ${payload.need || "Consultation"}`);
  const body = encodeURIComponent(`Name: ${payload.name || ""}\nNeed: ${payload.need || ""}\n\n${payload.message || ""}`);
  if (fallbackButton) fallbackButton.textContent = "Opening email...";
  window.location.href = `mailto:hello@bizyako.com?subject=${subject}&body=${body}`;
  window.setTimeout(() => {
    if (fallbackButton && resetText) {
      fallbackButton.textContent = resetText;
      fallbackButton.disabled = false;
    }
  }, 1600);
};

const fetchSitePayload = async () => {
  const sources = ["/api/site", "data/site-static.json"];
  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;
      return await response.json();
    } catch (error) {
      // Try the next source.
    }
  }
  throw new Error("Could not load site data");
};

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
  {
    id: "mobile",
    kicker: "Mobile product engineering",
    title: "Mobile apps that keep customers and teams connected anywhere.",
    text: "Build secure iOS and Android experiences for customer service, field operations, payments, approvals, and real-time business workflows.",
    points: ["Role-aware iOS and Android workflows", "Offline synchronization and push notifications", "Payments, device features, and system integrations"],
    demoUrl: "product-demo.html?product=mobile",
  },
  {
    id: "pwa",
    kicker: "Installable web applications",
    title: "Progressive Web Apps with browser reach and an app-like experience.",
    text: "Give users a fast, responsive product they can install directly from the browser, use reliably, and receive updates without an app-store release.",
    points: ["Installable responsive application experiences", "Offline-ready workflows and resilient loading", "Automatic updates across supported devices"],
    demoUrl: "product-demo.html?product=pwa",
  },
  {
    id: "websites",
    kicker: "Digital presence and commerce",
    title: "Websites designed to convert attention into measurable growth.",
    text: "Launch high-performance business websites, ecommerce experiences, and customer portals with strong discovery, analytics, and manageable content.",
    points: ["High-performance responsive interfaces", "SEO, analytics, and conversion journeys", "Content, ecommerce, and portal integrations"],
    demoUrl: "product-demo.html?product=websites",
  },
];

const productLabel = (product) => {
  if (!product) return "BizYako";
  if (product.id === "agents") return "AI agents";
  if (product.id === "law") return "CRM";
  if (product.id === "mobile") return "Mobile Apps";
  if (product.id === "pwa") return "PWA";
  if (product.id === "websites") return "Websites";
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
    const isActive = button.dataset.consoleProduct === id;
    button.classList.toggle("active", isActive);
    if (button.matches("button")) button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  renderProduct(id);

  if (shouldScroll) {
    document.querySelector("#products").scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
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
  demoModal.removeAttribute("inert");
  document.body.classList.add("modal-open");
  demoModal.querySelector("input")?.focus();
};

const closeDemoModal = () => {
  if (!demoModal) return;
  demoModal.classList.remove("open");
  demoModal.setAttribute("aria-hidden", "true");
  demoModal.setAttribute("inert", "");
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
  mobile: {
    user: "I need a mobile app.",
    title: "Mobile apps connect customers and teams wherever work happens.",
    text: "BizYako can build secure iOS and Android workflows with offline sync, notifications, payments, device features, and business-system integrations.",
    next: "Define the users, devices, and key mobile actions so we can shape the right release path.",
  },
  pwa: {
    user: "I need a Progressive Web App.",
    title: "A PWA delivers app-like speed without app-store friction.",
    text: "BizYako can build an installable responsive product with resilient loading, offline workflows, and automatic browser-delivered updates.",
    next: "Map the essential online and offline journeys to define the first installable release.",
  },
  websites: {
    user: "I need a website.",
    title: "A focused website can turn attention into measurable growth.",
    text: "BizYako can create a high-performance business site, ecommerce journey, or customer portal with SEO, analytics, and manageable content.",
    next: "Define the audience, primary offer, and conversion goal so the experience has a clear commercial purpose.",
  },
  custom: {
    user: "I want to define a custom product.",
    title: "Let us shape your product brief.",
    text: "Tell us the industry, product type, must-have modules, timeline, and business goal. BizYako will convert that into a clear consultation request.",
    next: "Open the product definition form and describe the system you want to create.",
  },
};

const appendChatActions = (bubble, intent) => {
  const actions = document.createElement("div");
  actions.className = "chat-inline-actions";

  if (intent && intent !== "custom") {
    const demoLink = document.createElement("a");
    demoLink.href = `product-demo.html?product=${encodeURIComponent(intent)}`;
    demoLink.textContent = "Preview demo";
    actions.appendChild(demoLink);
  }

  const specialistButton = document.createElement("button");
  specialistButton.type = "button";
  specialistButton.dataset.chatLeadToggle = "";
  specialistButton.textContent = "Talk to a specialist";
  actions.appendChild(specialistButton);

  bubble.appendChild(actions);
};

const appendChatMessage = (type, content, { persist = false, title = "", intent = "" } = {}) => {
  if (!chatMessages) return null;
  const normalizedType = type === "user" ? "user" : "bot";
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${normalizedType}`;

  if (title) {
    const heading = document.createElement("strong");
    heading.textContent = title;
    bubble.appendChild(heading);
  }

  const bubbleText = document.createElement("span");
  bubbleText.textContent = String(content || "");
  bubble.appendChild(bubbleText);

  if (normalizedType === "bot" && intent) appendChatActions(bubble, intent);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (persist) {
    chatHistory.append({
      role: normalizedType === "user" ? "user" : "assistant",
      content: String(content || ""),
      createdAt: Date.now(),
    });
  }
  return bubble;
};

const renderChatWelcome = () => {
  if (!chatMessages) return;
  appendChatMessage("bot", "Tell me what you want to improve. I can compare products, shape a first release, or help you prepare for a demo.", {
    title: "Welcome to BizYako.",
  });
};

const showChatTyping = () => {
  if (!chatMessages) return null;
  const typing = document.createElement("article");
  typing.className = "chat-bubble bot chat-typing";
  typing.setAttribute("data-chat-typing", "");
  typing.setAttribute("aria-label", "BizYako advisor is preparing a reply");
  for (let index = 0; index < 3; index += 1) typing.appendChild(document.createElement("span"));
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typing;
};

const setChatStatus = (message, state = "ready") => {
  if (!chatStatus) return;
  chatStatus.textContent = message;
  chatStatus.dataset.state = state;
};

const setChatBusy = (busy) => {
  if (chatInput) chatInput.disabled = busy;
  if (chatSend) chatSend.disabled = busy;
  chatPanel?.querySelectorAll("[data-chat-intent]").forEach((button) => {
    button.disabled = busy;
  });
};

const restoreChatHistory = () => {
  if (!chatMessages) return;
  const restored = chatHistory.load();
  chatMessages.replaceChildren();
  if (!restored.length) {
    renderChatWelcome();
    return;
  }
  restored.forEach((message) => {
    appendChatMessage(message.role === "user" ? "user" : "bot", message.content);
  });
  setChatStatus("Conversation restored from this device");
};
const openChatPanel = () => {
  if (!chatPanel) return;
  chatPanel.classList.add("open");
  chatPanel.setAttribute("aria-hidden", "false");
  chatPanel.removeAttribute("inert");
  supportChatButton?.classList.add("active");
  supportChatButton?.setAttribute("aria-expanded", "true");
  if (window.innerWidth > 760) window.setTimeout(() => chatInput?.focus(), 180);
};

const closeChatPanel = () => {
  if (!chatPanel) return;
  chatPanel.classList.remove("open");
  chatPanel.setAttribute("aria-hidden", "true");
  chatPanel.setAttribute("inert", "");
  supportChatButton?.classList.remove("active");
  supportChatButton?.setAttribute("aria-expanded", "false");
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
    mobile: "Mobile Apps",
    pwa: "Progressive Web Apps",
    websites: "Websites",
  };
  if (select && productMap[productId]) select.value = productMap[productId];
  leadBuilder.classList.add("open");
  leadBuilder.setAttribute("aria-hidden", "false");
  leadBuilder.removeAttribute("inert");
  document.body.classList.add("modal-open");
  leadBuilder.querySelector("input")?.focus();
};

const closeLeadBuilder = () => {
  if (!leadBuilder) return;
  leadBuilder.classList.remove("open");
  leadBuilder.setAttribute("aria-hidden", "true");
  leadBuilder.setAttribute("inert", "");
  document.body.classList.remove("modal-open");
};

let chatBusy = false;

const inferChatIntent = (message) => {
  const text = String(message || "").toLowerCase();
  const intentTerms = [
    ["law", ["law firm", "legal crm", "matters", "advocate"]],
    ["erp", ["erp", "inventory", "procurement", "finance", "operations"]],
    ["pos", ["pos", "point of sale", "checkout", "retail"]],
    ["analytics", ["analytics", "dashboard", "reporting", "business intelligence"]],
    ["isp", ["isp", "subscriber", "network billing", "internet provider"]],
    ["agents", ["ai agent", "automation", "automate", "follow-up"]],
    ["mobile", ["mobile app", "android", "ios"]],
    ["pwa", ["pwa", "progressive web app", "installable web"]],
    ["websites", ["website", "ecommerce", "web portal"]],
  ];
  return intentTerms.find(([, terms]) => terms.some((term) => text.includes(term)))?.[0] || "";
};

const advisorContext = () => chatHistory
  .load()
  .slice(-10)
  .map((message) => ({
    role: message.role,
    content: message.content.slice(0, 1000),
  }));

const sendAdvisorMessage = async (message, { intent = "" } = {}) => {
  const content = String(message || "").trim().slice(0, 1000);
  if (!content || chatBusy) return;
  const resolvedIntent = intent || inferChatIntent(content);
  if (!intent && resolvedIntent) activateProduct(resolvedIntent, false);

  chatBusy = true;
  appendChatMessage("user", content, { persist: true });
  setChatBusy(true);
  setChatStatus("Advisor is thinking...", "working");
  const typing = showChatTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: advisorContext() }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || typeof result.reply !== "string") {
      throw new Error("Advisor unavailable");
    }

    typing?.remove();
    appendChatMessage("bot", result.reply, { persist: true, intent: resolvedIntent });
    setChatStatus(result.fallback ? "Advisor online via backup model" : "Advisor online", "ready");
  } catch {
    typing?.remove();
    const guide = productGuides[resolvedIntent] || productGuides[activeProductId] || productGuides.custom;
    appendChatMessage("bot", `${guide.text} ${guide.next}`, {
      persist: true,
      title: guide.title,
      intent: resolvedIntent || activeProductId,
    });
    setChatStatus("Using the built-in product guide", "fallback");
  } finally {
    chatBusy = false;
    setChatBusy(false);
    if (chatInput) {
      chatInput.value = "";
      chatInput.style.height = "";
      chatInput.focus();
    }
    const userTurns = chatHistory.load().filter((messageItem) => messageItem.role === "user").length;
    chatLeadToggle?.classList.toggle("recommended", userTurns >= 2);
  }
};

const handleChatIntent = (intent) => {
  const guide = productGuides[intent] || productGuides.custom;
  if (intent !== "custom") activateProduct(intent, false);
  sendAdvisorMessage(guide.user, { intent });
};

const toggleChatLeadCapture = (forceOpen) => {
  if (!chatLeadForm) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : chatLeadForm.hidden;
  chatLeadForm.hidden = !shouldOpen;
  chatLeadToggle?.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) {
    const startedAt = chatLeadForm.querySelector('[name="formStartedAt"]');
    if (startedAt && !startedAt.value) startedAt.value = String(Date.now());
    chatLeadForm.querySelector("input:not(.form-honeypot)")?.focus();
  }
};

supportChatButton?.addEventListener("click", () => {
  if (chatPanel?.classList.contains("open")) closeChatPanel();
  else openChatPanel();
});
chatClose?.addEventListener("click", closeChatPanel);
chatClear?.addEventListener("click", () => {
  chatHistory.clear();
  chatMessages?.replaceChildren();
  renderChatWelcome();
  setChatStatus("Conversation cleared");
  chatLeadToggle?.classList.remove("recommended");
});

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendAdvisorMessage(chatInput?.value);
});
chatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm?.requestSubmit();
  }
});
chatInput?.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 112)}px`;
});

chatPanel?.addEventListener("click", (event) => {
  const quick = event.target.closest("[data-chat-intent]");
  if (quick) handleChatIntent(quick.dataset.chatIntent);

  const leadButton = event.target.closest("[data-open-lead-builder]");
  if (leadButton) openLeadBuilder(activeProductId);

  const specialistButton = event.target.closest("[data-chat-lead-toggle]");
  if (specialistButton) toggleChatLeadCapture(true);

  const contactLink = event.target.closest("[data-chat-contact]");
  if (contactLink) closeChatPanel();
});

chatLeadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(chatLeadForm).entries());
  const name = String(data.chatLeadName || "").trim();
  const phone = String(data.chatLeadPhone || "").trim();
  const phoneDigits = phone.split("").filter((character) => "0123456789".includes(character)).join("");
  const button = chatLeadForm.querySelector('button[type="submit"]');

  if (name.length < 2 || phoneDigits.length < 9 || phoneDigits.length > 15) {
    if (chatLeadStatus) chatLeadStatus.textContent = "Enter a valid name and phone number.";
    return;
  }

  const productLabel = productGuides[activeProductId]?.title || "BizYako business system";
  const payload = {
    name,
    need: "Advisor specialist follow-up",
    website: data.website,
    formStartedAt: Number(data.formStartedAt),
    message: `Callback request. Phone: ${phone}. Current interest: ${productLabel}`,
  };
  button.disabled = true;
  button.textContent = "Preparing handoff...";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error("Lead handoff unavailable");

    const whatsappLink = document.createElement("a");
    whatsappLink.href = `https://wa.me/254754959895?text=${encodeURIComponent(`Hello BizYako, I am ${name}. Please contact me on ${phone} about ${productLabel}.`)}`;
    whatsappLink.target = "_blank";
    whatsappLink.rel = "noopener";
    whatsappLink.textContent = "Continue on WhatsApp";
    chatLeadStatus?.replaceChildren(document.createTextNode("Your details are ready. "), whatsappLink);
    button.textContent = "Details prepared";
  } catch {
    if (chatLeadStatus) chatLeadStatus.textContent = "Please use WhatsApp or the full consultation form below.";
    button.textContent = "Try again";
    button.disabled = false;
    return;
  }

  window.setTimeout(() => {
    chatLeadForm.reset();
    prepareSecureForm(chatLeadForm);
    button.textContent = "Request a callback";
    button.disabled = false;
  }, 2500);
});

restoreChatHistory();
openLeadButtons.forEach((button) => button.addEventListener("click", () => openLeadBuilder(activeProductId)));
document.querySelectorAll("[data-lead-close]").forEach((item) => item.addEventListener("click", closeLeadBuilder));

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = leadForm.querySelector("button");
  const data = Object.fromEntries(new FormData(leadForm).entries());
  const payload = {
    name: data.name,
    need: `Product definition: ${data.product}`,
    website: data.website,
    formStartedAt: Number(data.formStartedAt),
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
        prepareSecureForm(leadForm);
        closeLeadBuilder();
        button.textContent = "Send product brief";
        button.disabled = false;
      }, 1500);
      return;
    }
  } catch (error) {
    openEmailFallback(payload, button, "Send product brief");
    return;
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
    const site = await fetchSitePayload();

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
    website: data.website,
    formStartedAt: Number(data.formStartedAt),
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
        prepareSecureForm(demoForm);
        window.location.href = pendingDemoUrl;
      }, 900);
      return;
    }
  } catch (error) {
    openEmailFallback(payload, button, "Sign up and unlock demo");
    window.setTimeout(() => {
      window.location.href = pendingDemoUrl;
    }, 900);
    return;
  }

  setTimeout(() => {
    button.textContent = "Sign up and unlock demo";
    button.disabled = false;
  }, 2200);
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = contactForm.querySelector("button");
  const data = Object.fromEntries(new FormData(contactForm).entries());
  const payload = { ...data, website: data.website, formStartedAt: Number(data.formStartedAt) };

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
    if (result.ok) {
      contactForm.reset();
      prepareSecureForm(contactForm);
    }
  } catch (error) {
    openEmailFallback(payload, button, "Request consultation");
    return;
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







