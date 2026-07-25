const fallbackProducts = {
  law: {
    kicker: "Legal operations",
    title: "Law firm CRM demo",
    text: "Preview how BizYako can organize client intake, matters, deadlines, billing, document movement, task ownership, and firm-wide visibility.",
    points: ["Client and matter pipeline", "Deadline and task tracking", "Billing and partner dashboards"],
  },
  erp: {
    kicker: "Enterprise workflows",
    title: "ERP product demo",
    text: "Preview a phased ERP built around procurement, inventory, HR, finance, approvals, permissions, and management reporting.",
    points: ["Procurement and approval flows", "Inventory and finance views", "Role-based dashboards"],
  },
  pos: {
    kicker: "Retail systems",
    title: "POS product demo",
    text: "Preview fast checkout, stock control, payments, branch reporting, staff activity, customer records, and loyalty workflows.",
    points: ["Checkout and payments", "Stock movement and alerts", "Branch sales summaries"],
  },
  analytics: {
    kicker: "Decision intelligence",
    title: "Analytics dashboard demo",
    text: "Preview dashboards, alerts, trend analysis, imports, and executive summaries that turn business data into decisions.",
    points: ["Executive dashboards", "Trend and variance alerts", "Data cleanup and imports"],
  },
  isp: {
    kicker: "Network operations",
    title: "ISP management demo",
    text: "Preview subscriber onboarding, plan management, ticketing, billing status, service history, network assets, and dispatch workflows.",
    points: ["Subscriber and plan records", "Tickets and field dispatch", "Billing reminders and service history"],
  },
  agents: {
    kicker: "AI workforce",
    title: "AI agents demo",
    text: "Preview controlled AI agents for lead response, reminders, reporting, ticket triage, workflow assistance, and human approval paths.",
    points: ["Lead response assistants", "Workflow and reporting agents", "Human approval and audit trails"],
  },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[character];
  });

const params = new URLSearchParams(window.location.search);
const productId = params.get("product") || "law";

const renderProduct = (product) => {
  document.querySelector("[data-demo-kicker]").textContent = product.kicker;
  document.querySelector("[data-demo-title]").textContent = product.title;
  document.querySelector("[data-demo-text]").textContent = product.text;
  document.title = `${product.title} | BizYako`;
  document.querySelector("[data-demo-points]").innerHTML = product.points
    .map((point, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(point)}</h3><p>See how this part of the product can be shaped around your team, data, and daily approvals.</p></article>`)
    .join("");
};

const loadProduct = async () => {
  renderProduct(fallbackProducts[productId] || fallbackProducts.law);

  try {
    const response = await fetch("/api/site");
    if (!response.ok) throw new Error("Site API unavailable");
    const site = await response.json();
    const product = site.products.find((item) => item.id === productId);
    if (!product) return;
    renderProduct({
      kicker: product.kicker,
      title: product.title.replace(/\.$/, "") + " demo",
      text: product.text,
      points: product.points,
    });
  } catch (error) {
    console.warn(error);
  }
};

loadProduct();
