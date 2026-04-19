# docs/assets — rendered diagrams & equations

Pre-rendered SVGs so GitHub's mobile app (which renders neither
` ```mermaid ` blocks nor `$$...$$` math) shows them correctly. The
root `README.md` references the files here as `<img>`.

## Files

| File | Source | Regenerate |
|------|--------|-----------|
| `highlevel.svg` | `../architecture/highlevel.mmd` | `npx @mermaid-js/mermaid-cli -i ../architecture/highlevel.mmd -o highlevel.svg -c mermaid.config.json -p puppeteer.config.json -b "#0a1628" -w 1800 && node apply-blueprint.js highlevel.svg` |
| `hooks.svg` | `../architecture/hooks.mmd` | `npx @mermaid-js/mermaid-cli -i ../architecture/hooks.mmd -o hooks.svg -c mermaid.config.json -p puppeteer.config.json -b "#0a1628" -w 1800 && node apply-blueprint.js hooks.svg` |
| `lifecycle.svg` | `../architecture/lifecycle.mmd` | `npx @mermaid-js/mermaid-cli -i ../architecture/lifecycle.mmd -o lifecycle.svg -c mermaid.config.json -p puppeteer.config.json -b "#0a1628" -w 1800 && node apply-blueprint.js lifecycle.svg` |
| `dataflow.svg` | `../architecture/dataflow.mmd` | `npx @mermaid-js/mermaid-cli -i ../architecture/dataflow.mmd -o dataflow.svg -c mermaid.config.json -p puppeteer.config.json -b "#0a1628" -w 1800 && node apply-blueprint.js dataflow.svg` |
| `math/*.svg` | `render-math.js` | `npm install --prefix . mathjax-full && node render-math.js` |

Run the commands from `docs/assets/` (paths are relative). The
toolchain (`node_modules/`, `package.json`, `package-lock.json`) is
gitignored; only the rendered SVGs and their sources are committed.

The `apply-blueprint.js` step overlays an engineering-blueprint grid
(navy `#0a1628` paper, `#1e3a5f` major lines / `#16304f` minor lines)
onto the rendered diagram so it reads as a CAD drawing rather than a
neutral dark card. Matches the look of the sibling repos (allay, flux,
hornet, reaper, weaver).

## Status

Nook is a **planned** plugin (not yet shipped). The `.mmd` sources
under `../architecture/` are currently scaffolds populated once the
first sub-plugin (`cost-tracker`, `budget-boundary`, `rate-card`,
`cost-query`, `session-ledger`) ships. Regenerate SVGs after each
sub-plugin lands and commit both the source and the SVG in the same
commit.
