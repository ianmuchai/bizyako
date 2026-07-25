# BizYako Chat and Lead Design

## Goal
Add a reliable conversion layer to BizYako with a guided chatbot, WhatsApp contact path, and product-definition lead workflow that works on desktop and mobile.

## Design
The site will use a floating support hub with two visible actions: chat with BizYako and WhatsApp. The chatbot will be a guided assistant powered by local site data, not a fake generative AI integration. It will recommend products, guide users to demos, and open a product-definition workflow.

The product-definition workflow will collect industry, product type, required modules, timeline, budget range, and contact details. It will submit a structured lead summary through the existing `/api/contact` endpoint.

## Responsive Requirements
The support hub must stay compact, avoid covering primary CTA buttons, and adapt to mobile widths. Product tabs should be easier to use on small screens. Modals and floating panels must fit within the viewport with internal scrolling.

## Backend Requirements
Use the existing `/api/contact` route. No database or paid AI service is required for this phase. WhatsApp uses a temporary number until the real BizYako number is provided.

