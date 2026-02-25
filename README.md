# Codex Desktop Rebuild

Cross-platform Electron build for OpenAI Codex Desktop App.

## Supported Platforms

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS    | x64, arm64   | ✅     |
| Windows  | x64          | ✅     |
| Linux    | x64, arm64   | ✅     |

## Quick Start

```bash
# Install dependencies
npm install

# Open the interactive dev menu
npm run menu
```

## Dev Menu (`npm run menu`)

An interactive terminal menu covering all common tasks:

| Option | Description |
|--------|-------------|
| 📥 Update source from DMG | Extract latest build files from `Codex.dmg` |
| 🔧 Apply patches | Re-run all post-build patch scripts |
| 🔨 Rebuild native modules | Rebuild `node-pty` + `better-sqlite3` for Electron |
| 🏗️ Build (current platform) | `patch` + `electron-forge make` |
| 🪟 Build Windows x64 | Cross-compile for `win32/x64` |
| 🍎 Build macOS (arm64 + x64) | Cross-compile for `darwin` |
| 🐧 Build Linux (x64 + arm64) | Cross-compile for `linux` |
| 🌍 Build all platforms | mac + win + linux |
| ▶️ Start dev | Launch Electron in dev mode |

## Build

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac-x64
npm run build:mac-arm64
npm run build:win-x64
npm run build:linux-x64
npm run build:linux-arm64

# Build all platforms
npm run build:all
```

## Development

```bash
# Launch Electron directly (dev mode)
npm run dev
```

## Patch Scripts

Run automatically before every build (`npm run patch`):

| Script | Purpose |
|--------|---------|
| `patch-copyright.js` | Strips/replaces copyright strings |
| `patch-i18n.js` | Fixes i18n locale loading |
| `patch-process-polyfill.js` | Adds `process` polyfill for renderer |
| `patch-chromium-flags.js` | Prepends GPU rasterization + throttling flags |
| `patch-css-containment.js` | Injects `contain: content` on code blocks |

## Updating Source Files from a DMG

If you have a newer `Codex.dmg`, place it in the project root and run:

```bash
npm run update-src
# or via the dev menu: 📥 Update source from DMG
```

This extracts `app.asar` from the DMG, copies `.vite/build`, `webview`, and `skills`
into `src/`, then re-applies all patches automatically.

**Requires:** [7-Zip](https://www.7-zip.org/) installed (Windows: default install path is detected automatically).

## Project Structure

```
├── src/
│   ├── .vite/build/          # Main process bundle (Electron)
│   └── webview/              # Renderer (Frontend)
├── resources/
│   ├── bin/                  # Platform CLI binaries
│   ├── electron.icns         # App icon (macOS)
│   └── notification.wav      # Sound
├── scripts/
│   ├── dev-menu.js           # Interactive dev menu (npm run menu)
│   ├── start-dev.js          # Dev launcher
│   ├── update-from-dmg.js    # DMG source updater
│   ├── rebuild-native.js     # Native module rebuilder
│   ├── patch-copyright.js
│   ├── patch-i18n.js
│   ├── patch-process-polyfill.js
│   ├── patch-chromium-flags.js
│   └── patch-css-containment.js
├── forge.config.js           # Electron Forge config
└── package.json
```

## CI/CD

GitHub Actions automatically builds on:
- Push to `master`
- Tag `v*` → Creates draft release

## Credits

**Ported by KAHME248**

- [OpenAI Codex](https://github.com/openai/codex) - Original Codex CLI (Apache-2.0)
- [Cometix Space](https://github.com/Haleclipse) - [@cometix/codex](https://www.npmjs.com/package/@cometix/codex) binaries
- [Electron Forge](https://www.electronforge.io/) - Build toolchain

## License

This project rebuilds the Codex Desktop app for cross-platform distribution.
Original Codex CLI by OpenAI is licensed under Apache-2.0.
