// Render LaTeX equations to self-contained SVGs using MathJax.
//
// GitHub's mobile app renders images but not $$...$$ math. Every equation in
// README.md and docs/science/README.md is pre-rendered here and referenced as
// an <img>. Re-run this script after editing any equation.
//
// Usage:
//   node docs/assets/render-math.js

const fs = require("fs");
const path = require("path");

const MJ_PATH = path.join(__dirname, "node_modules", "mathjax-full");
require(path.join(MJ_PATH, "js", "util", "asyncLoad", "node.js"));

const { mathjax } = require(path.join(MJ_PATH, "js", "mathjax.js"));
const { TeX } = require(path.join(MJ_PATH, "js", "input", "tex.js"));
const { SVG } = require(path.join(MJ_PATH, "js", "output", "svg.js"));
const { liteAdaptor } = require(path.join(MJ_PATH, "js", "adaptors", "liteAdaptor.js"));
const { RegisterHTMLHandler } = require(path.join(MJ_PATH, "js", "handlers", "html.js"));
const { AllPackages } = require(path.join(MJ_PATH, "js", "input", "tex", "AllPackages.js"));

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: AllPackages });
const svg = new SVG({ fontCache: "none" });
const html = mathjax.document("", { InputJax: tex, OutputJax: svg });

const FG = "#e6edf3";
const OUT = path.join(__dirname, "math");
fs.mkdirSync(OUT, { recursive: true });

// [filename, TeX source]
const EQUATIONS = [
  // L1 Exponential Smoothing Forecast
  ["l1-smoothing",
   String.raw`\hat{y}_{t+1} = \alpha \cdot y_t + (1 - \alpha) \cdot \hat{y}_t, \qquad \alpha = 0.3`],
  ["l1-band",
   String.raw`\sigma_{\text{forecast}} = \text{stdev}\bigl(\{\, y_t - \hat{y}_t \,\}_{t=1}^{n}\bigr), \qquad \text{band} = \hat{y}_{t+H} \pm 2\sigma`],

  // L2 Budget Boundary Detection
  ["l2-fire",
   String.raw`\text{fire}(t,\, s,\, k) \;\iff\; \dfrac{\text{cost}(s,\, k)}{\text{ceiling}(s)} \geq t \;\wedge\; (t,\, s,\, k) \notin \text{debounce}`],

  // L3 Z-Score Cost Anomaly
  ["l3-zscore",
   String.raw`z = \dfrac{y - \mu}{\sigma}, \qquad \text{anomaly} \;\iff\; |z| > 3`],

  // L4 Cache-Waste Measurement
  ["l4-hit-ratio",
   String.raw`\text{hit\_ratio} = \dfrac{R}{R + W + M}, \qquad \text{waste}_{\$} = W_{\text{unread}} \cdot r_{\text{input}} \cdot c_{\text{write}}`],

  // L5 Gauss Learning (Pech)
  ["l5-accumulate",
   String.raw`\mu_{n+1} = (1 - \alpha) \cdot \mu_n + \alpha \cdot \bar{y}_{\text{session}}, \qquad \alpha = 0.05`],
];

function render(name, source) {
  const node = html.convert(source, { display: true, em: 16, ex: 8, containerWidth: 1200 });
  let svgStr = adaptor.innerHTML(node);
  // Force visible ink. MathJax uses currentColor by default, which on mobile
  // GitHub (image opened in isolation) falls back to black — invisible on our
  // dark page. Bake a fixed fill so the SVG is self-contained.
  svgStr = svgStr.replace(/currentColor/g, FG);
  svgStr = `<?xml version="1.0" encoding="UTF-8"?>\n` + svgStr;
  const outPath = path.join(OUT, `${name}.svg`);
  fs.writeFileSync(outPath, svgStr, "utf8");
  console.log(`  docs/assets/math/${name}.svg`);
}

console.log(`Rendering ${EQUATIONS.length} equations...`);
for (const [name, src] of EQUATIONS) {
  try {
    render(name, src);
  } catch (err) {
    console.error(`FAILED: ${name}\n  ${err.message}`);
    process.exitCode = 1;
  }
}
console.log("Done.");
