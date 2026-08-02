# BizYako Support Launcher Icon Design

## Objective

Replace the visually weak floating WhatsApp and assistant outlines with polished, immediately recognizable launcher glyphs that remain clear across every homepage section.

## Approved Direction

Both launchers use a transparent 54 by 54 pixel interaction area with no visible button surface. The artwork itself is a bold, filled speech-mark rather than a thin outline.

- WhatsApp uses a saturated green filled speech-mark with a white handset.
- The BizYako assistant uses a vibrant teal filled speech bubble with three white animated dots.
- Neither launcher has an outer circle, border, tile, glass panel, or background plate.
- The filled silhouette, not a heavy shadow, provides contrast against both light and dark content.

## Visual Treatment

The two marks have coordinated size, optical weight, baseline, and spacing. Their SVG artwork occupies approximately 40 pixels within the 54 pixel hit area. A restrained shadow separates the filled marks from photography or similarly colored sections without creating a second visible boundary.

Hover and keyboard-focus states use a small lift and scale change. Focus remains visible through an offset outline that appears only for keyboard navigation. The assistant's three dots retain a smooth staggered animation and become static while the panel is open. Reduced-motion users receive no launcher movement or dot animation.

## Interaction And Accessibility

Existing destinations and behavior remain unchanged:

- WhatsApp opens the configured conversation in a new tab.
- The assistant launcher opens and closes the existing bottom-anchored chat panel.
- Existing accessible names and expanded state remain intact.
- Transparent hit areas remain at least 50 by 50 pixels on mobile and 54 by 54 pixels on desktop.

## Responsive Behavior

The support hub retains its current bottom-right placement and mobile spacing. The icon artwork scales down only enough to preserve screen-edge breathing room. It must not cause horizontal overflow, overlap the chat panel, or obscure primary content.

## Scope

This change is limited to the two floating launcher SVGs, their final visual-system CSS, and focused regression tests. It does not alter footer icons, chat-panel content, WhatsApp configuration, hero content, or lead workflows.

## Verification

The implementation must demonstrate:

- no visible launcher surface, border, or outer circular container;
- filled green and teal launcher marks with white internal details;
- three animated assistant dots and reduced-motion support;
- consistent desktop and mobile sizing without overflow;
- unchanged WhatsApp and assistant interactions;
- all automated, build, syntax, dependency, and security checks passing.
