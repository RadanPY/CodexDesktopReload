#!/usr/bin/env node
/**
 * Codex rebuild – interactive dev menu
 *
 * Usage:
 *   node scripts/dev-menu.js
 *   npm run menu
 */
const { spawnSync }  = require("child_process");
const select  = require("@inquirer/select").default;
const confirm = require("@inquirer/confirm").default;
const path  = require("path");
const fs    = require("fs");

const ROOT = path.join(__dirname, "..");

// On Windows, npm is a .cmd script and requires the .cmd suffix when shell is false
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function run(cmd, args = [], opts = {}) {
  console.log(`\n▶  ${cmd} ${args.join(" ")}\n${"─".repeat(60)}`);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: false,
    cwd: ROOT,
    ...opts,
  });
  const ok = result.status === 0;
  console.log(`${"─".repeat(60)}\n${ok ? "✅  Done" : "❌  Failed (exit " + result.status + ")"}`);
  return ok;
}

function runNode(script, args = []) {
  return run(process.execPath, [path.join(ROOT, script), ...args]);
}

function npmRun(scriptName) {
  return run(NPM, ["run", scriptName]);
}

function pause() {
  return new Promise(r => {
    process.stdout.write("\nPress Enter to continue…");
    process.stdin.once("data", r);
  });
}

// ──────────────────────────────────────────────
//  Menu definition
// ──────────────────────────────────────────────

const MENU = [
  {
    name: "📥  Update source from DMG      — extract latest build from Codex.dmg",
    value: "update-src",
  },
  {
    name: "🔧  Apply patches               — copyright, i18n, polyfill, GPU flags, CSS",
    value: "patch",
  },
  {
    name: "🔨  Rebuild native modules       — node-pty + better-sqlite3 for Electron",
    value: "rebuild-native",
  },
  {
    name: "🏗️   Build (current platform)    — patch + electron-forge make",
    value: "build-current",
  },
  {
    name: "🪟  Build Windows x64            — patch + electron-forge make win32/x64",
    value: "build-win",
  },
  {
    name: "🍎  Build macOS (arm64 + x64)    — patch + electron-forge make darwin",
    value: "build-mac",
  },
  {
    name: "🐧  Build Linux (x64 + arm64)    — patch + electron-forge make linux",
    value: "build-linux",
  },
  {
    name: "🌍  Build all platforms          — mac + win + linux",
    value: "build-all",
  },
  {
    name: "▶️   Start dev                   — launch Electron in dev mode",
    value: "start",
  },
  {
    name: "─────────────────────────────────",
    value: "sep",
    disabled: true,
  },
  {
    name: "🚪  Exit",
    value: "exit",
  },
];

// ──────────────────────────────────────────────
//  Action handlers
// ──────────────────────────────────────────────

async function handleChoice(choice) {
  switch (choice) {
    case "update-src": {
      const dmg = path.join(ROOT, "Codex.dmg");
      if (!fs.existsSync(dmg)) {
        console.log(`\n⚠️  Codex.dmg not found at project root.`);
        const custom = await confirm({ message: "Specify a custom DMG path?" });
        if (!custom) break;
        // Fall through to node script – it will error with a clear message
      }
      runNode("scripts/update-from-dmg.js");
      break;
    }
    case "patch":
      runNode("scripts/patch-copyright.js") &&
      runNode("scripts/patch-i18n.js") &&
      runNode("scripts/patch-process-polyfill.js") &&
      runNode("scripts/patch-chromium-flags.js") &&
      runNode("scripts/patch-css-containment.js");
      break;

    case "rebuild-native":
      runNode("scripts/rebuild-native.js");
      break;

    case "build-current":
      npmRun("forge:make");
      break;

    case "build-win":
      npmRun("build:win-x64");
      break;

    case "build-mac":
      npmRun("build:mac");
      break;

    case "build-linux":
      npmRun("build:linux");
      break;

    case "build-all": {
      const sure = await confirm({
        message: "Build ALL platforms (mac + win + linux)? This takes a while.",
        default: false,
      });
      if (sure) npmRun("build:all");
      break;
    }

    case "start":
      runNode("scripts/start-dev.js");
      break;

    case "exit":
      console.log("\nBye!\n");
      process.exit(0);
  }
}

// ──────────────────────────────────────────────
//  Main loop
// ──────────────────────────────────────────────

async function main() {
  console.clear();
  console.log("╔══════════════════════════════════════╗");
  console.log("║      Codex Desktop – Dev Menu        ║");
  console.log("╚══════════════════════════════════════╝\n");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const choice = await select({
      message: "What do you want to do?",
      choices: MENU,
      pageSize: MENU.length,
    });

    await handleChoice(choice);

    if (choice !== "start") {
      await pause();
      console.clear();
      console.log("╔══════════════════════════════════════╗");
      console.log("║      Codex Desktop – Dev Menu        ║");
      console.log("╚══════════════════════════════════════╝\n");
    }
  }
}

main().catch(err => {
  if (err.name === "ExitPromptError") process.exit(0); // Ctrl+C
  console.error("❌", err.message);
  process.exit(1);
});
