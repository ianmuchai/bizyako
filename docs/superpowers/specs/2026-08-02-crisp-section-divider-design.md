# Crisp Section Divider Design

## Problem

The contact-section transition still uses a 48px desktop and 32px mobile gradient. Although contained within the dark section, its interpolated tones read as blur near important content. Existing PWA installations can also retain the older overlapping transition because the cache and asset tokens were not changed after the CSS correction.

## Approved Design

Remove `.contact-section::before` completely. Separate the light process section from the dark contact section with a crisp 2px teal top border. Existing contact padding provides the dark breathing space, and no decorative layer may cover text, forms, links, or buttons.

Bump the PWA shell cache from `bizyako-shell-v5` to `bizyako-shell-v6` and every public CSS/JavaScript asset token from `20260731-2` to `20260802-1`. The updated service worker must remove older BizYako caches during activation so returning visitors receive the new CSS.

## Verification

Regression tests will reject any final `.contact-section::before` rule, require the teal divider, and require matching `v6`/`20260802-1` cache references. Desktop and mobile browser checks will confirm a crisp boundary, clear controls, no overlay, and no horizontal overflow.