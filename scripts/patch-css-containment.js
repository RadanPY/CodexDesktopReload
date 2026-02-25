/**
 * Post-build patch: inject CSS containment hints for code blocks
 *
 * Adds `contain: content` to common code block selectors so Chromium's
 * layout engine can skip style/layout recalculation outside each block
 * during syntax-highlight updates and scroll.
 *
 * Selectors targeted:
 *   pre[class*=language-]   – Prism.js highlighted blocks
 *   code[class*=language-]  – inline Prism tokens
 *   code.hljs               – Highlight.js blocks
 *   pre > code              – generic fenced-code containers
 *
 * Usage:
 *   node scripts/patch-css-containment.js          # apply patch
 *   node scripts/patch-css-containment.js --check  # read-only status check
 */
const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
//  CSS to inject
// ──────────────────────────────────────────────

const MARKER = "/* css-containment-patch */";

const CONTAINMENT_CSS = `${MARKER}
/* CSS containment hints – isolate layout/style recalculation to each block */
pre[class*=language-],
code[class*=language-],
code.hljs,
pre > code {
  contain: content;
}
`;

const STYLE_TAG = `<style>\n${CONTAINMENT_CSS}</style>`;

// ──────────────────────────────────────────────
//  File location
// ──────────────────────────────────────────────

function locateIndexHtml() {
  const target = path.join(__dirname, "..", "src", "webview", "index.html");
  if (!fs.existsSync(target)) {
    console.error("❌ index.html not found:", target);
    process.exit(1);
  }
  return target;
}

// ──────────────────────────────────────────────
//  Main
// ──────────────────────────────────────────────

function main() {
  const isCheck = process.argv.includes("--check");
  const indexHtml = locateIndexHtml();
  const relPath = path.relative(path.join(__dirname, ".."), indexHtml);
  const html = fs.readFileSync(indexHtml, "utf-8");
  const alreadyPatched = html.includes(MARKER);

  if (isCheck) {
    console.log("\n── CSS containment patch check (read-only) ──\n");
    console.log(`  📄 ${relPath}: ${alreadyPatched ? "✅ already patched" : "🔧 not yet patched"}`);
    if (alreadyPatched) {
      console.log("\n✅ CSS containment hints are active");
    } else {
      console.log("\n💡 Run node scripts/patch-css-containment.js to apply");
    }
    return;
  }

  if (alreadyPatched) {
    console.log("ℹ️  CSS containment already patched, no changes needed");
    return;
  }

  // Insert the <style> tag just before </head>
  const headCloseIdx = html.indexOf("</head>");
  if (headCloseIdx === -1) {
    console.error("❌ Could not locate </head> in index.html");
    process.exit(1);
  }

  const patched =
    html.slice(0, headCloseIdx) +
    "  " + STYLE_TAG + "\n" +
    html.slice(headCloseIdx);

  fs.writeFileSync(indexHtml, patched);
  console.log(`  ✏️  Injected CSS containment <style> into ${relPath}`);
  console.log("       Selectors: pre[class*=language-], code[class*=language-], code.hljs, pre > code");
  console.log("\n✅ CSS containment hints injected");
}

main();
