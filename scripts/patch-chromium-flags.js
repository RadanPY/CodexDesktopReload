/**
 * Post-build patch: inject Chromium command-line flags into main.js
 *
 * Prepends app.commandLine.appendSwitch() calls to the Electron entry point
 * so they are active before any app code runs:
 *
 *   GPU rasterization  – smoother rendering via hardware-accelerated raster
 *   Background throttling fixes – prevents timers / animations from being
 *                                  throttled when the window is in the background
 *
 * Usage:
 *   node scripts/patch-chromium-flags.js          # apply patch
 *   node scripts/patch-chromium-flags.js --check  # read-only status check
 */
const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
//  Flags to inject
// ──────────────────────────────────────────────

/**
 * Each entry becomes:
 *   app.commandLine.appendSwitch(flag[, value])
 *
 * Flags without a value use `null`.
 */
const FLAGS = [
  // ── GPU rasterization ──────────────────────
  // Enable Chromium's GPU rasterisation pipeline
  { flag: "enable-gpu-rasterization",          value: null },
  // Use zero-copy texture upload where the GPU supports it
  { flag: "enable-zero-copy",                  value: null },
  // Skip the GPU driver blocklist so rasterisation isn't disabled on
  // common consumer GPUs (safe inside a controlled Electron app)
  { flag: "ignore-gpu-blocklist",              value: null },
  // ── Background throttling fixes ───────────
  // Keep renderer process priority when the window loses focus
  { flag: "disable-renderer-backgrounding",    value: null },
  // Prevent setTimeout/setInterval from being slowed to 1 Hz in background
  { flag: "disable-background-timer-throttling", value: null },
];

// ──────────────────────────────────────────────
//  Code snippet that gets prepended to main.js
// ──────────────────────────────────────────────

const MARKER = "/* chromium-flags-patch */";

function buildSnippet() {
  const switchCalls = FLAGS.map(({ flag, value }) =>
    value === null
      ? `__app.commandLine.appendSwitch(${JSON.stringify(flag)});`
      : `__app.commandLine.appendSwitch(${JSON.stringify(flag)},${JSON.stringify(value)});`
  ).join("");

  return (
    `${MARKER}` +
    `const{app:__app}=require("electron");` +
    switchCalls +
    "\n"
  );
}

// ──────────────────────────────────────────────
//  File location
// ──────────────────────────────────────────────

function locateMainJs() {
  const target = path.join(__dirname, "..", "src", ".vite", "build", "main.js");
  if (!fs.existsSync(target)) {
    console.error("❌ main.js not found:", target);
    process.exit(1);
  }
  return target;
}

// ──────────────────────────────────────────────
//  Main
// ──────────────────────────────────────────────

function main() {
  const isCheck = process.argv.includes("--check");
  const mainJs = locateMainJs();
  const relPath = path.relative(path.join(__dirname, ".."), mainJs);
  const source = fs.readFileSync(mainJs, "utf-8");
  const alreadyPatched = source.includes(MARKER);

  if (isCheck) {
    console.log("\n── Chromium flags patch check (read-only) ──\n");
    console.log(`  📄 ${relPath}: ${alreadyPatched ? "✅ already patched" : "🔧 not yet patched"}`);
    if (alreadyPatched) {
      console.log("\n✅ Chromium flags are active");
    } else {
      console.log("\n💡 Run node scripts/patch-chromium-flags.js to apply");
    }
    return;
  }

  if (alreadyPatched) {
    console.log("ℹ️  Chromium flags already patched, no changes needed");
    return;
  }

  const snippet = buildSnippet();
  fs.writeFileSync(mainJs, snippet + source);
  console.log(`  ✏️  Prepended Chromium flags to ${relPath}`);
  FLAGS.forEach(({ flag }) => console.log(`       + ${flag}`));
  console.log("\n✅ Chromium flags injected");
}

main();
