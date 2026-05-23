# dyuta

Landing page for the dyuta game studio. Hosted on GitHub Pages, with an inline Bloxorz-style mini-game (Three.js, procedural textures, no asset files).

## Develop

```sh
bun install
bun run dev      # http://localhost:5173
bun run build    # outputs to dist/
bun run preview  # serve the built bundle
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Bun and publishes `dist/` to GitHub Pages.

Pages settings → Build and deployment → Source: **GitHub Actions**.

Custom domain: `www.dyuta.io` (apex `dyuta.io` redirects to www via GitHub Pages).
The `public/CNAME` file is the source of truth — keep it in sync with Pages settings.

## Structure

- `index.html` — landing markup with critical CSS inlined.
- `src/main.ts` — landing bootstrap; dynamically imports the game when it scrolls into view or is tapped.
- `src/game/` — Three.js mini-game (engine, board, block-rolling, procedural textures, maps, input).
