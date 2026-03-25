# FinPulse Frontend System

## Stack Order
1. Bootstrap (single source)
2. `static/css/styles.css`
3. `static/css/bootstrap-formatting.css`
4. `static/css/responsive.css`

## Design Tokens
- Use existing FinPulse palette tokens (`--fp-*`) as source.
- Define shared values in `static/css/styles.css`.
- Avoid hardcoding colors in templates.

## Spacing Scale
- Preferred rhythm: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`.
- Use Bootstrap spacing utilities before custom spacing classes.

## Typography
- Use existing site type scale (`h1`–`h6`) and semantic headings.
- Keep body copy in normal sentence case; reserve uppercase for compact labels/chips.

## Components
- Cards: use `.card` with minimal custom classes for page identity.
- Buttons: use Bootstrap button variants first, then FinPulse overrides.
- Filters/toggles: prefer `data-control` and `aria-pressed` state.
- Panels: attach durable hooks with `data-panel` for JS.

## Interaction and Motion
- Prefer transform/opacity animations only.
- Respect `prefers-reduced-motion` for all non-essential animation and parallax.

## Do / Do Not
- Do: use Material/Bootstrap primitives first.
- Do: add stable hook attributes (`data-role`, `data-panel`, `data-control`) for JS.
- Do not: bind JS behavior to purely visual classes.
- Do not: add global overrides in page templates.
