# Contained Contact Transition Design

## Problem

The light-to-dark transition above the contact section is positioned 72px outside the section. It paints over the end of the preceding light section, reducing the clarity of nearby content and controls.

## Approved Design

Keep the transition as a decorative band, but contain it entirely within the dark contact section. Use a 48px band on desktop and a 32px band at widths up to 620px. The gradient must have no blur filter, must not extend above the section, and must not receive pointer events.

All direct children of the contact section remain in a higher stacking layer than the decorative band. Existing section spacing, content, button styling, and responsive layout remain unchanged.

## Verification

A CSS regression test will assert the non-negative inset, responsive heights, no blur, and explicit content stacking. Browser checks will confirm the preceding section and its controls remain clear on desktop and mobile, with no horizontal overflow.