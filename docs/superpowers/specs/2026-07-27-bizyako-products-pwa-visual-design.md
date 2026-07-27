# BizYako Product Expansion, PWA, and Visual Refinement Design

## Objective

Expand BizYako with three independent digital product offerings, make the public website installable as a Progressive Web App, and refine the existing visual system so the hero imagery is clearer, colors are more vibrant, and large typography feels controlled and professional.

The existing hero carousel images remain unchanged. The work changes their presentation, not the image files or carousel administration workflow.

## Product Architecture

BizYako will present nine first-class products:

1. Law Firm CRM
2. ERP
3. POS
4. Data Analytics
5. ISP Management
6. AI Agents
7. Mobile Apps
8. Progressive Web Apps
9. Websites

The three new products use stable IDs:

- `mobile`
- `pwa`
- `websites`

Each product will appear consistently in:

- The centralized backend product catalog and `/api/site` payload
- The static JSON fallback used outside the Node backend
- Homepage product tabs and product showcase
- Hero quick links and the animated product console
- Product demo switcher and dedicated query-string demo route
- Chatbot recommendations
- Product-definition and contact forms
- Footer product navigation and supporting metadata

### Mobile Apps

Positioning: native-quality iOS and Android applications that connect customers, field teams, and business operations.

Core capabilities:

- Secure role-aware mobile workflows
- Offline synchronization and push notifications
- Payments, device features, and business-system integrations

### Progressive Web Apps

Positioning: fast, installable web applications that combine browser reach with an app-like experience.

Core capabilities:

- Installable responsive application experiences
- Offline-ready workflows and resilient loading
- Automatic updates without app-store release delays

### Websites

Positioning: conversion-focused websites, ecommerce experiences, and customer portals built for discoverability and measurable growth.

Core capabilities:

- High-performance responsive interfaces
- SEO foundations, analytics, and conversion journeys
- Manageable content, ecommerce, and portal integrations

## Product Navigation

Homepage tabs remain the canonical product selector. On smaller screens they form a horizontal scroll strip with clear focus and active states.

The hero quick-link row includes all nine products and remains horizontally scrollable where width is limited.

The animated hero console becomes a stable three-column by three-row product matrix. Every cell has a fixed minimum height, concise primary label, short supporting label, and an accessible button target. The matrix does not resize or reflow when a product becomes active. Selecting any cell activates the matching homepage product and scrolls to its profile.

The console metric changes to `9 Core products`.

## PWA Architecture

### Manifest

Create `manifest.webmanifest` with:

- App name: `BizYako`
- Short name: `BizYako`
- Start URL: `/`
- Display mode: `standalone`
- Theme color: `#08b893`
- Background color: `#06131b`
- Scope: `/`
- Portrait and landscape support

The manifest references 192 by 192 and 512 by 512 PNG icons derived by resizing the existing `assets/bizyako-logo.png`. The logo artwork must not be redrawn, regenerated, or stylistically modified. A maskable icon may add safe transparent or brand-colored padding around the unchanged logo.

### Service Worker

Create `service-worker.js` with a versioned public shell cache.

Cache-first resources:

- Public HTML shell
- Stylesheets and public JavaScript
- Logo, hero carousel images, and PWA icons
- Static site-data fallback

Network-first resources:

- Navigation requests
- `/api/site`
- Public product and carousel data

Never cache:

- `/by-admin`
- `/by-admin.html`
- `/api/carousel` write requests
- Form submissions and other non-GET requests

The service worker removes outdated caches during activation and falls back to the cached homepage for failed public navigation requests. It must not make the private admin page available offline.

### Install Experience

Add a compact `Install BizYako` control to the primary navigation.

- It is hidden until the browser fires `beforeinstallprompt`.
- It uses the supplied logo or a familiar download icon with a clear label.
- It matches the brand navigation styling and remains visually secondary to the main consultation CTA.
- Activating it opens the browser installation prompt.
- It becomes unavailable after a successful `appinstalled` event.
- On installed or unsupported browsers, it does not occupy empty navigation space.
- The mobile navigation version remains at least 44 pixels high and does not crowd the menu control.

## Hero Visual Refinement

The carousel imagery remains unchanged.

### Image Treatment

- Keep the image fully visible at near-full opacity.
- Increase saturation, brightness, and contrast gently so the supplied colors feel vivid without clipping.
- During slide transitions, avoid fading the image below a readable visual level.
- Retain smooth scale movement with reduced amplitude to avoid a zoomed-in appearance.

### Overlay Treatment

Replace the current near-black full-width overlay with a lighter directional scrim:

- Strongest behind the left text region
- Rapidly reduced through the image center
- Minimal over the primary visual area on the right
- Reduced bottom fade so the poster remains visible near the fold

The hero text panel uses a lighter translucent surface with a smaller blur radius. It supports text contrast without appearing as a heavy opaque card.

### Color System

Use the supplied teal, mint, navy, and white as the primary brand system. Electric blue supports interactive and data-oriented states. A restrained warm accent may appear in small status details or focus highlights to prevent the page from reading as a single-hue interface.

Gradients remain localized to active states, calls to action, and subtle depth cues. Large page areas must not depend on dense multi-stop gradients.

## Typography

Replace viewport-width typography scaling with a stable rem-based hierarchy and breakpoint adjustments.

Desktop targets:

- Hero heading: `3.5rem` maximum
- Main section headings: `3rem` maximum
- Product showcase heading: `2.5rem` maximum
- Product demo hero heading: `3.75rem` maximum
- CTA heading: `3rem` maximum

Mobile targets:

- Hero heading: `2.45rem` maximum
- Main section headings: `2.25rem` maximum
- Product and demo headings: `2.2rem` maximum

Bold display text uses a maximum weight of 800, balanced line lengths, zero letter spacing, and slightly more generous line height than the current hero. Supporting text remains at comfortable reading sizes and maintains WCAG AA contrast over its final background.

## Responsive Behavior

- Desktop keeps the two-column hero composition.
- Tablet reduces the console footprint without hiding products.
- Mobile stacks content with the text first and the product matrix second.
- Hero buttons remain visible within the first viewport on common mobile and desktop sizes.
- Product tabs, hero quick links, and demo selectors scroll horizontally instead of wrapping into unstable multi-line layouts.
- The install control integrates into both desktop and mobile navigation without overlap.
- Fixed dimensions and minimum heights prevent product labels, active states, and dynamic carousel copy from shifting the layout.

## Accessibility and Motion

- Every product control remains keyboard accessible.
- Active product and carousel states expose `aria-selected` or `aria-pressed`.
- Install controls include explicit accessible labels and focus states.
- Reduced-motion users receive immediate slide and state changes without animated scaling or fades.
- Text contrast is verified after reducing the hero overlay.
- Service-worker registration failures do not block normal site use.

## Data and Deployment Compatibility

The Node backend, static fallback, Vercel deployment, and Namecheap Node deployment continue to use the same public files.

The Node MIME map will serve `.webmanifest` as `application/manifest+json`. The service worker is served from the site root so its scope covers the public application.

The Namecheap deployment package must include:

- `manifest.webmanifest`
- `service-worker.js`
- PWA icon assets
- Updated HTML, CSS, JavaScript, and product data

No PWA behavior depends on a third-party service.

## Verification

Automated checks will verify:

- All nine products exist in backend and static payloads
- Each new product resolves through its demo URL
- Manifest metadata, icon declarations, and start URL are valid
- Service-worker cache exclusions protect admin and mutation routes
- Node serves the manifest with the correct MIME type
- Public pages register the service worker without JavaScript errors

Browser verification will cover:

- Desktop and mobile hero composition
- Clearer carousel imagery and reduced overlay darkness
- Professional heading sizes and non-overlapping text
- All nine product controls and demo links
- Install control visibility and styling when the install event is available
- Responsive navigation, product tabs, and product matrix
- Offline loading of the public homepage after an initial successful visit
- Continued online-only behavior for the private admin page

