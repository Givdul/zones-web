# AGENTS.md

## Design Context

### Users
Zones Web is for broad Mac users first: people who want cleaner window management with almost no setup friction and want to understand the product within seconds. The site should still feel credible to power users, but they are a secondary audience. The primary job is simple: show how Zones improves everyday multitasking quickly enough that a visitor is willing to open the App Store.

### Brand Personality
Calm, sharp, premium. The website should keep the native app's trustworthiness, clarity, and precision, but express them in a more conversion-oriented way than the app UI itself. It should never feel like a generic startup landing page, and it should never feel like an Apple marketing clone. The tone should be confident and minimal rather than chatty, playful, or overly promotional.

### Aesthetic Direction
Dark-first editorial minimalism with a neutral macOS-adjacent palette, strong typography, and glass or structural surfaces used with restraint. The page should prefer punchline-led copy, minimal reading, and product interaction demos that explain the experience visually. Motion should feel smooth and restrained, focused on demonstrating how Zones works rather than decorating the page. The result should feel polished and premium without becoming sterile, ornate, or derivative.

### Design Principles
- Let the animation explain the product before copy does.
- Prefer one strong section over several explanatory ones.
- Use slogans and short supporting lines instead of dense marketing paragraphs.
- Keep the layout distinctive and premium without imitating Apple page patterns directly.
- Use motion to clarify interaction, and always honor reduced-motion preferences.
- Keep contrast strong, semantics clean, and keyboard or focus behavior deliberate by default.

### Shared theme (web + macOS)
- **Canonical colors** are the Fancy palette (`--fancy-*` in `src/styles/global.css`), aligned with Zones macOS `FancyDesignSystem` / `FancyPalette`.
- **Semantic layer**: prefer `--theme-*` variables for new CSS; they alias Fancy tokens and keep parity with native apps.
- **Layout shell**: app index (`/`) uses `quiet-orbit-page givdul-catalog`; each app landing uses `quiet-orbit-page givdul-app-landing`. `html` carries `data-givdul-theme="fancy"` from `BaseLayout.astro`.
- **Reference doc**: see `THEME.md` for the full token table and macOS implementation notes.
