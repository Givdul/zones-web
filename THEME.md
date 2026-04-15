# Givdul theme (web ↔ macOS)

This repo uses one **Fancy-aligned** design system so marketing pages and native apps (e.g. Zones) stay visually aligned. The web implementation lives in `src/styles/global.css`; native apps should mirror the same **Fancy** names and hex values from `FancyDesignSystem` / `FancyPalette` in the Zones macOS target.

## HTML hook

`BaseLayout.astro` sets:

```html
<html lang="en" data-givdul-theme="fancy">
```

Future themes could add another `data-givdul-theme` value; CSS would scope overrides under `[data-givdul-theme="…"]`.

## Page shells

| Page | Main classes | Role |
|------|----------------|------|
| `/` (app index) | `quiet-orbit-page givdul-catalog` | Same width/padding as app landings |
| `/{slug}` | `quiet-orbit-page givdul-app-landing` | Product landing (e.g. `/zones`) |

Inner catalog content uses `.e1` / `.e1-list` for the stacked app cards.

## CSS variables

### Source tokens (`--fancy-*`)

These match **Zones macOS** `FancyPalette` (dark appearance). They are the canonical hex/rgb values; do not “design in the browser” by drifting these without updating the app.

| Token | Typical use |
|-------|-------------|
| `--fancy-canvas-top` / `--fancy-canvas-bottom` | Window / page background |
| `--fancy-menu-canvas` | Secondary surfaces |
| `--fancy-menu-preview-fill` | Inset panels, raised controls |
| `--fancy-menu-preview-stroke` | Stronger panel strokes |
| `--fancy-menu-divider` | Dividers |
| `--fancy-menu-hover-fill` | Hover states |
| `--fancy-text-primary` | Primary labels |
| `--fancy-smoke` / `--fancy-pearl` / `--fancy-graphite` | Secondary / tertiary text |
| `--fancy-champagne` / `--fancy-amber` | Neutral accents (cool grays, not warm gold on web) |
| `--fancy-frost` | Translucent fills |
| `--fancy-hairline` / `--fancy-inner-line` | Borders |

### Semantic aliases (`--theme-*`)

Use these in **new** CSS so product pages, the index, and future apps share one vocabulary. Each alias forwards to a `--fancy-*` token.

| Theme token | Maps to |
|-------------|---------|
| `--theme-canvas-top` | `--fancy-canvas-top` |
| `--theme-canvas-bottom` | `--fancy-canvas-bottom` |
| `--theme-surface-base` | `--fancy-menu-canvas` |
| `--theme-surface-raised` | `--fancy-menu-preview-fill` |
| `--theme-surface-stroke` | `--fancy-menu-preview-stroke` |
| `--theme-divider` | `--fancy-menu-divider` |
| `--theme-surface-hover` | `--fancy-menu-hover-fill` |
| `--theme-text-primary` | `--fancy-text-primary` |
| `--theme-text-secondary` | `--fancy-smoke` |
| `--theme-text-tertiary` | `--fancy-pearl` |
| `--theme-text-muted-graphite` | `--fancy-graphite` |
| `--theme-accent-neutral` | `--fancy-champagne` |
| `--theme-accent-secondary` | `--fancy-amber` |
| `--theme-frost` | `--fancy-frost` |
| `--theme-border-hairline` | `--fancy-hairline` |
| `--theme-border-inner` | `--fancy-inner-line` |
| `--theme-content-max` | `--site-width` |
| `--theme-radius-xl` | `--radius-xl` |
| `--theme-font-sans` / `--theme-font-display` | UI fonts |

Legacy aliases (`--text`, `--muted`, `--line`, `--accent`, etc.) remain for existing rules; prefer `--theme-*` when writing new styles.

## macOS implementation notes

1. **Single palette**: Prefer reading colors from one Swift enum/struct (`FancyPalette`) and reusing the same names in comments when adding web tokens.
2. **Window background**: Match the web body stack: diagonal canvas gradient + soft top-leading glow (see `body` in `global.css`).
3. **Surfaces**: Menu-style surfaces use `fancySurface` equivalents → web `--theme-surface-base` / raised / hairline borders.
4. **CTAs**: Web primary actions use flat `--fancy-menu-preview-fill` + hover fill; “Pro”-style emphasis uses `--fancy-graphite` on dark canvas — mirror with the same hex pairs in SwiftUI/AppKit.

## Related

- Product and motion principles: `AGENTS.md`
- App metadata and routes: `src/data/site.ts`
