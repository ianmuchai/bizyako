const productCatalog = {
  law: {
    label: "Law CRM",
    kicker: "Legal operations",
    title: "Law firm CRM demo",
    text: "Preview a focused legal workspace for client intake, matters, deadlines, billing, document movement, task ownership, and firm-wide visibility.",
    points: ["Client and matter pipeline", "Deadline and task tracking", "Billing and partner dashboards"],
    stats: ["Matter-ready", "Role views", "Audit trail"],
    workflows: ["Capture the client request", "Assign matter owner and deadlines", "Track documents, billing, and next actions"],
    score: "94%",
  },
  erp: {
    label: "ERP",
    kicker: "Enterprise workflows",
    title: "ERP product demo",
    text: "Preview a phased ERP built around procurement, inventory, HR, finance, approvals, permissions, and management reporting.",
    points: ["Procurement and approval flows", "Inventory and finance views", "Role-based dashboards"],
    stats: ["Multi-module", "Approval-ready", "Exportable reports"],
    workflows: ["Request and approve resources", "Sync stock, finance, and departments", "Give leadership real-time operating visibility"],
    score: "91%",
  },
  pos: {
    label: "POS",
    kicker: "Retail systems",
    title: "POS product demo",
    text: "Preview fast checkout, stock control, payments, branch reporting, staff activity, customer records, and loyalty workflows.",
    points: ["Checkout and payments", "Stock movement and alerts", "Branch sales summaries"],
    stats: ["Fast checkout", "Stock-aware", "Branch-ready"],
    workflows: ["Sell and capture payment", "Update stock and customer record", "Review branch performance and alerts"],
    score: "96%",
  },
  analytics: {
    label: "Analytics",
    kicker: "Decision intelligence",
    title: "Analytics dashboard demo",
    text: "Preview dashboards, alerts, trend analysis, imports, and executive summaries that turn business data into decisions.",
    points: ["Executive dashboards", "Trend and variance alerts", "Data cleanup and imports"],
    stats: ["Live KPIs", "Alerts", "Decision-ready"],
    workflows: ["Import and clean source data", "Visualize trends and exceptions", "Send summaries to the right managers"],
    score: "93%",
  },
  isp: {
    label: "ISP Ops",
    kicker: "Network operations",
    title: "ISP management demo",
    text: "Preview subscriber onboarding, plan management, ticketing, billing status, service history, network assets, and dispatch workflows.",
    points: ["Subscriber and plan records", "Tickets and field dispatch", "Billing reminders and service history"],
    stats: ["Subscriber view", "Ticket queue", "Billing sync"],
    workflows: ["Onboard subscriber and plan", "Route support or installation work", "Track billing, service history, and assets"],
    score: "90%",
  },
  agents: {
    label: "AI Agents",
    kicker: "AI workforce",
    title: "AI agents demo",
    text: "Preview controlled AI agents for lead response, reminders, reporting, ticket triage, workflow assistance, and human approval paths.",
    points: ["Lead response assistants", "Workflow and reporting agents", "Human approval and audit trails"],
    stats: ["Human-approved", "Always-on", "Auditable"],
    workflows: ["Receive task or inquiry", "Draft the next action or report", "Escalate for human review before final action"],
    score: "89%",
  },
  mobile: {
    label: "Mobile Apps",
    kicker: "Mobile product engineering",
    title: "Mobile apps product demo",
    text: "Preview secure iOS and Android workflows for customer service, field operations, payments, approvals, notifications, and connected business data.",
    points: ["Role-aware mobile workflows", "Offline sync and push notifications", "Payments and device integrations"],
    stats: ["iOS + Android", "Offline-ready", "Secure access"],
    workflows: ["Open the right role workspace", "Complete work online or offline", "Synchronize actions with the business platform"],
    score: "95%",
  },
  pwa: {
    label: "PWAs",
    kicker: "Installable web applications",
    title: "Progressive Web App demo",
    text: "Preview an installable, responsive application with fast navigation, resilient loading, offline workflows, and automatic updates.",
    points: ["Installable app-like experience", "Offline-ready workflows", "Automatic browser-delivered updates"],
    stats: ["Installable", "Resilient", "Always current"],
    workflows: ["Open or install from the browser", "Continue essential work through weak connectivity", "Receive the latest version automatically"],
    score: "94%",
  },
  websites: {
    label: "Websites",
    kicker: "Digital presence and commerce",
    title: "Business website demo",
    text: "Preview a high-performance business website, ecommerce journey, or customer portal designed for discovery, conversion, and manageable growth.",
    points: ["Responsive high-performance interface", "SEO and conversion journeys", "Content, commerce, and portal integrations"],
    stats: ["Fast pages", "SEO-ready", "Conversion-led"],
    workflows: ["Guide visitors to the right offer", "Capture or complete the desired action", "Measure results and improve content"],
    score: "96%",
  },
};

const productOrder = ["law", "erp", "pos", "analytics", "isp", "agents", "mobile", "pwa", "websites"];

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[character];
  });


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
  throw new Error("Site API unavailable");
};
const params = new URLSearchParams(window.location.search);
const productId = params.get("product") || "law";

const renderProduct = (product, id) => {
  document.querySelector("[data-demo-kicker]").textContent = product.kicker;
  document.querySelector("[data-demo-title]").textContent = product.title;
  document.querySelector("[data-demo-text]").textContent = product.text;
  document.querySelector("[data-live-score]").textContent = product.score || "92%";
  document.querySelector("[data-live-kicker]").textContent = product.label + " readiness";
  document.querySelector("[data-live-label]").textContent = "Previewing " + product.label + " workflow";
  document.querySelector("[data-console-label]").textContent = product.label + " workspace";
  document.title = `${product.title} | BizYako`;

  document.querySelector("[data-demo-switcher]").innerHTML = productOrder
    .map((key) => {
      const item = productCatalog[key];
      const active = key === id ? " active" : "";
      const current = key === id ? ' aria-current="page"' : "";
      return `<a class="demo-switch-pill${active}"${current} href="product-demo.html?product=${key}">${escapeHtml(item.label)}</a>`;
    })
    .join("");

  document.querySelector("[data-demo-stats]").innerHTML = (product.stats || [])
    .map((stat) => `<span>${escapeHtml(stat)}</span>`)
    .join("");

  document.querySelector("[data-demo-points]").innerHTML = product.points
    .map((point, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(point)}</h3><p>Inspect how this capability can be shaped around your team, permissions, data, and daily approvals.</p></article>`)
    .join("");

  document.querySelector("[data-demo-workflows]").innerHTML = product.workflows
    .map((step, index) => `<article><small>Step ${String(index + 1).padStart(2, "0")}</small><h3>${escapeHtml(step)}</h3><p>BizYako turns this into a practical screen, action, notification, or dashboard in the product flow.</p></article>`)
    .join("");
};

const loadProduct = async () => {
  const fallback = productCatalog[productId] || productCatalog.law;
  renderProduct(fallback, productCatalog[productId] ? productId : "law");

  try {
    const site = await fetchSitePayload();
    const product = site.products.find((item) => item.id === productId);
    if (!product) return;
    renderProduct({
      ...fallback,
      kicker: product.kicker,
      title: product.title.replace(/\.$/, "") + " demo",
      text: product.text,
      points: product.points,
    }, productId);
  } catch (error) {
    console.warn(error);
  }
};

loadProduct();

