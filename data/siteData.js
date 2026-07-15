const products = [
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

const industries = [
  { title: "Law firms", text: "Client intake, case lifecycle, billing, documents, reminders, and partner visibility." },
  { title: "Retail and hospitality", text: "Fast checkout, inventory control, branch reporting, staff roles, and customer loyalty tools." },
  { title: "ISPs and utilities", text: "Subscriber onboarding, service plans, tickets, billing, network assets, and field team dispatch." },
  { title: "Growing SMEs", text: "ERP workflows for procurement, finance, HR, approvals, assets, and management reporting." },
];

const metrics = {
  uptimeTarget: "99.9%",
  launchModel: "Phased MVP to scale",
  brandPalette: ["#08b893", "#06131b", "#9de9d1", "#ffffff"],
  services: ["CRM", "ERP", "POS", "Analytics", "ISP Ops", "AI Agents", "AI Automation"],
};

function getSitePayload() {
  return {
    brand: "bizYako",
    tagline: "Your Business, Powered by AI.",
    products,
    industries,
    metrics,
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

module.exports = { products, industries, metrics, getSitePayload, normalizeLead };
