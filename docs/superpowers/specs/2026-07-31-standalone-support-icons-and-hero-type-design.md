# BizYako Standalone Support Icons and Hero Type

## Goal

Refine the homepage support controls and rotating hero copy without changing the approved hero imagery, carousel content, support behavior, or responsive layout.

## Support Controls

- Keep the existing WhatsApp link and chatbot button markup, actions, accessible labels, and minimum 44px interaction areas.
- Remove visible launcher backgrounds, circular shapes, borders, backdrop effects, and permanent container shadows.
- Display only the green WhatsApp glyph and teal-to-blue conversation glyph.
- Preserve the animated three-dot conversation indicator.
- Use a restrained icon lift and glyph-level drop shadow on hover. Use a non-circular outline treatment for keyboard focus.
- Keep the controls in their current floating bottom-right dock and preserve the bottom-anchored chat panel.

## Rotating Hero Typography

- Reduce the desktop hero title from its current 3.5rem scale to a balanced 3rem scale with a slightly tighter readable measure.
- Reduce the supporting hero paragraph from 1.04rem to 0.96rem and tighten its line height and maximum width.
- Apply these rules to the shared `data-hero-title` and `data-hero-copy` elements so all rotating carousel messages, including the POS-to-ERP analytics message, remain consistent.
- Retain existing responsive constraints, buttons above the first scroll, hero image, carousel timing, and product console.

## Verification

- Add a regression test that rejects visible support launcher backgrounds, circles, borders, and container shadows while retaining 44px interaction areas.
- Add a regression assertion for the refined hero title and paragraph sizes.
- Run the full test suite and JavaScript syntax checks.
- Verify the homepage at desktop and mobile widths, including the open chatbot state.

