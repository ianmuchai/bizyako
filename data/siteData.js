const fs = require("fs");
const path = require("path");
const { validateCarouselPayload } = require("../lib/security");

const carouselPath = process.env.BIZYAKO_CAROUSEL_PATH
  ? path.resolve(process.env.BIZYAKO_CAROUSEL_PATH)
  : path.join(__dirname, "carouselSlides.json");

const products = [
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

const industries = [
  { title: "Law firms", text: "Client intake, case lifecycle, billing, documents, reminders, and partner visibility." },
  { title: "Retail and hospitality", text: "Fast checkout, inventory control, branch reporting, staff roles, and customer loyalty tools." },
  { title: "ISPs and utilities", text: "Subscriber onboarding, service plans, tickets, billing, network assets, and field team dispatch." },
  { title: "Growing SMEs", text: "ERP workflows for procurement, finance, HR, approvals, assets, and management reporting." },
];


const contactDetails = {
  address: "PO Box 2086 Karen",
  email: "hello@bizyako.com",
  social: {
    x: "https://x.com/bizYako",
  },
};
const metrics = {
  uptimeTarget: "99.9%",
  launchModel: "Phased MVP to scale",
  brandPalette: ["#08b893", "#06131b", "#9de9d1", "#ffffff"],
  services: ["CRM", "ERP", "POS", "Analytics", "ISP Ops", "AI Agents", "Mobile Apps", "Progressive Web Apps", "Websites", "AI Automation"],
};

const posterSpecs = {
  recommended: "1920 x 1080 px",
  ratio: "16:9 landscape",
  safeZone: "Keep important text inside the center 60% width and center 72% height.",
  formats: "PNG, JPG, JPEG, WebP, or AVIF",
  maxGuidance: "Use compressed WebP/JPG under 500 KB where possible. PNG is okay for graphic posters.",
};

function getCarouselSlides() {
  try {
    const parsed = JSON.parse(fs.readFileSync(carouselPath, "utf8"));
    const validation = validateCarouselPayload({ slides: parsed });
    return validation.ok ? validation.slides : [];
  } catch {
    return [];
  }
}

function saveCarouselSlides(items = []) {
  const validation = validateCarouselPayload({ slides: items });
  if (!validation.ok) throw new TypeError(validation.message);

  const temporaryPath = `${carouselPath}.tmp-${process.pid}-${Date.now()}`;
  const content = `${JSON.stringify(validation.slides, null, 2)}\n`;
  try {
    fs.writeFileSync(temporaryPath, content, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporaryPath, carouselPath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
  return validation.slides;
}

function getSitePayload() {
  return {
    brand: "bizYako",
    tagline: "Your Business, Powered by AI.",
    products,
    industries,
    metrics,
    contactDetails,
    carouselSlides: getCarouselSlides(),
    posterSpecs,
  };
}

function normalizeLead(payload = {}) {
  const name = String(payload.name || "").trim();
  const need = String(payload.need || "").trim();
  const message = String(payload.message || "").trim();

  if (!name || !need || !message) {
    return { ok: false, message: "Name, business need, and message are required." };
  }

  return {
    ok: true,
    message: "Consultation request received.",
    lead: {
      id: `BY-${Date.now()}`,
      name,
      need,
      message,
      status: "new",
    },
  };
}

module.exports = { products, industries, metrics, contactDetails, getSitePayload, normalizeLead, getCarouselSlides, saveCarouselSlides, posterSpecs };



