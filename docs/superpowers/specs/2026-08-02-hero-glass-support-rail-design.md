# BizYako Hero Glass and Support Rail Design

## Goal

Make the supplied carousel posters clearly visible while preserving reliable text contrast, and make the floating WhatsApp and assistant controls recognizable, polished, and easy to reach.

## Selected Direction

Use a restrained global gradient plus localized glass surfaces. The poster remains bright and sharp across the viewport; readability comes primarily from the content surfaces rather than from darkening the entire image.

The WhatsApp control uses the standard green speech-bubble and white handset silhouette instead of the current custom approximation. Both support controls remain unframed and form a compact vertical rail near the middle-right of the viewport.

## Considered Approaches

1. **Balanced glass, selected:** Keep a maximum 32% global gradient, add refined translucent glass behind content, and center the support rail around 52% of the viewport height. This preserves both poster visibility and predictable contrast.
2. **Minimal overlay:** Reduce the global overlay below 18% and rely heavily on content panels. This reveals more of the poster but creates harsher panel-to-image contrast.
3. **No global overlay:** Show the poster untouched and glass every foreground module. This maximizes image visibility but makes the hero feel fragmented and can reduce readability during carousel transitions.

## Hero Treatment

- Reduce the desktop left-to-right overlay from 84% maximum opacity to approximately 32%, falling to near-transparent across the poster.
- Keep a very light lower vignette only where it supports the foreground controls; do not add a full-page dark veil.
- Preserve the current image saturation and centered crop.
- Refine `.hero-mainline` as the primary glass surface with a translucent dark tint, `backdrop-filter` blur and saturation, a soft highlight border, and a restrained shadow.
- Reduce the console background opacity slightly so the poster remains visible through it while its controls retain contrast.
- During carousel transitions, keep poster opacity above 90% so slides do not flash dark.
- On narrow viewports, increase the localized glass tint slightly rather than increasing the global overlay.

## Support Controls

- Replace the existing hand-drawn WhatsApp path with the standard WhatsApp mark geometry, using brand green `#25D366` and white handset detail.
- Keep both icons as standalone marks with no circular or rectangular launcher background.
- Position `.support-hub` vertically around the middle-right using `top: 52%` and `translateY(-50%)`, with safe right spacing.
- Retain 50-54px touch targets even though the visible marks are smaller.
- Keep hover motion subtle and retain visible keyboard focus.
- On mobile, place the rail around 58% of the viewport to avoid the header and preserve thumb reach.
- Keep the assistant panel bottom-anchored when opened; opening it must not shift the launcher rail or page layout.

## Accessibility And Motion

- Preserve descriptive `aria-label` values and keyboard operation.
- Maintain at least 44px touch targets.
- Continue respecting `prefers-reduced-motion`.
- Verify that the rail does not overlap critical hero actions at desktop and mobile widths.

## Verification

- Add regression checks for the lighter overlay values, localized glass styling, standard WhatsApp mark, and midpoint rail placement.
- Run the complete test suite, syntax check, production build, secret scan, and dependency audit.
- Inspect the hero and support controls in a browser at desktop and mobile sizes.
- Push the verified commit to `main` and confirm the Vercel production URL responds with the new asset version.
