# World Events Network Color System

The WEN interface uses a disciplined midnight navy, championship blue, white, and ice system. Photography and video remain natural and are not color-filtered.

## Core palette

| Token | Value | Intended use |
| --- | --- | --- |
| WEN Midnight | `#07111F` | Primary dark surfaces, menus, overlays, footer, dark sections, and borders/corners. |
| WEN Championship | `#1F5EFF` | Primary brand moments, CTA surfaces, active states, indicators, and important accents. |
| WEN Electric | `#56A8FF` | Hover, focus, motion details, selected states, and secondary highlights. |
| WEN Ice | `#F4F7FB` | Light sections, editorial surfaces, and large neutral backgrounds. |
| WEN White | `#FFFFFF` | Text on Midnight and Championship Blue and high-contrast interface elements. |
| WEN Ink | `#0B0D10` | Text and dark controls on light surfaces. |
| WEN Steel | `#8996A8` | Muted text, metadata, inactive labels, and supporting information. |
| WEN Line | `#273345` | Subtle borders, separators, rules, and dark-surface interface lines. |

## CSS tokens

The shared styles define the raw `--wen-*` tokens and semantic aliases such as `--color-background-dark`, `--color-background-brand`, `--color-text-muted`, `--color-accent`, and `--color-accent-hover`. Reuse those semantic aliases when adding styles; do not add one-off brand literals to components.

## Brand distribution

- 55–65% dark surfaces
- 20–30% ice/light neutral surfaces
- 10–15% Championship Blue
- Less than 5% Electric Blue

Blue should be intentional and scarce enough to feel like a championship moment. Error, warning, and success colors remain separate semantic states when needed.

## Usage notes

- Use white text on Championship Blue; do not default to Ink on brand-blue surfaces.
- Use Ink on Ice and White on Midnight.
- Use Steel for supporting copy, not small text on Championship Blue.
- Keep borders restrained with Line and use Electric Blue mainly for hover/focus feedback.
- Do not tint, filter, or replace event photography, portraits, or video.
- Preserve existing typography, layout, responsive behavior, transitions, and animation timing.
