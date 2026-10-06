# Miroir Standalone App - Electron

A desktop application wrapper for the Miroir Standalone App built with Electron.

## Overview

This package creates a cross-platform desktop application that runs the Miroir Standalone App in an Electron window. It provides a native desktop experience while leveraging the existing web-based Miroir application.

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Native desktop integration**: System menus, keyboard shortcuts, and OS-specific behaviors
- **Development mode**: Hot-reloading support during development
- **Security**: Proper context isolation and security best practices
- **Single instance**: Prevents multiple instances of the application

## Prerequisites

Before running this package, ensure you have:

1. Node.js (version 16 or higher)
2. The miroir-standalone-app package built and available
3. All dependencies installed

## Installation

From the monorepo root:

```bash
# Install dependencies for all packages
npm install

# Or install dependencies for this package specifically
cd packages/miroir-standalone-app-electron
npm install
```

## Development

### Running in Development Mode

1. **Start the miroir-standalone-app development server** (in a separate terminal):
   ```bash
   cd packages/miroir-standalone-app
   npm run dev
   ```
   This will start the Vite dev server on http://localhost:5173

2. **Run the Electron app in development mode**:
   ```bash
   cd packages/miroir-standalone-app-electron
   npm run electron-dev
   ```

The Electron app will connect to the development server and provide hot-reloading.

### Building for Production

1. **Build the miroir-standalone-app**:
   ```bash
   cd packages/miroir-standalone-app
   npm run build
   ```

2. **Build and run the Electron app**:
   ```bash
   cd packages/miroir-standalone-app-electron
   npm run electron
   ```

## Building Distributables

To create distributable packages:

```bash
# Build for all platforms (requires platform-specific tools)
npm run dist

# Build for specific platforms
npm run dist-win    # Windows installer
npm run dist-mac    # macOS DMG
npm run dist-linux  # Linux AppImage
```

### Platform-specific Requirements

- **Windows**: No additional requirements
- **macOS**: Requires macOS to build DMG files
- **Linux**: Works on most Linux distributions

## Scripts

- `npm run build` / `npm run build-electron` - Type-check, then bundle the main process and preload with esbuild (`scripts/bundle-main.mjs`) into `dist/src/main.js` and `dist/src/preload.js`. Only `electron`, `@cursor/sdk`, `classic-level` and `pg` stay outside the bundle; the package ships `classic-level` and `pg` (and `electron-squirrel-startup`) in `node_modules`, not the Cursor SDK, which stays off in the packaged app (#275). The build prints what the bundle contains and writes `dist/bundle-report.json`; `python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json` (from the repository root) fails when a package enters the bundle without being added to `bundle-policy.json`.
- `npm run electron` - Run the Electron app in production mode
- `npm run electron-dev` - Run the Electron app in development mode
- `electron . --self-test[=<tags>] [--self-test-timeout=<s>]` - Self-test (#487): loads the built client in a hidden window, runs the miroir app's MiroirTests with these tags (`unit` by default), prints `{ "renderer": <result> }` and exits 0 (passed), 1 (failed) or 2 (no verdict: timeout, renderer crash, load failure). Run it on the `self-test` environment (`MIROIR_ENV=self-test`), whose authentication is off, or add `--disable-auth` (a packaged app included); see `docs/reference/testing.md` (Self-test mode)
- `npm run pack` - Create unpacked distributables
- `npm run dist` - Create distributable packages for current platform
- `npm run dist-win` - Create Windows installer
- `npm run dist-mac` - Create macOS DMG
- `npm run dist-linux` - Create Linux AppImage

## Linux package formats

Possible Target package type: list of AppImage, flatpak, snap, deb, rpm, freebsd, pacman, p5p, apk, 7z, zip, tar.xz, tar.lz, tar.gz, tar.bz2, dir.

supported: AppImage, flatpak, snap, deb, rpm, freebsd, pacman, p5p, apk, 7z, zip, tar.xz, tar.lz, tar.gz, tar.bz2, dir.

## Architecture

The Electron app consists of three main parts:

1. **Main Process** (`src/main.ts`): Creates and manages the application window
2. **Preload Script** (`src/preload.ts`): Provides secure API bridge between main and renderer processes
3. **Renderer Process**: The miroir-standalone-app running in the Electron window

## Configuration

The application can be configured through:

- `package.json` - Electron Builder configuration
- `src/main.ts` - Window settings, menu configuration
- `src/preload.ts` - API exposed to the renderer process

## Security

Authentication is on by default, as on the server: the app opens on the login page, and the main process refuses `miroir-ipc` messages without the session token (`AuthenticationRequired`) or for an application the user may not open (`AccessDenied`). Turn it off with `--disable-auth`, `MIROIR_AUTH_ENABLED=0` or `server.authentication.enabled: false` in the environment. Details and seed logins: `docs/reference/authentication.md`.

This application follows Electron security best practices:

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for controlled API access
- External links open in system browser
- Single instance enforcement

## Troubleshooting

### Common Issues

1. **App won't start**: Ensure miroir-standalone-app is built
2. **Dev mode connection failed**: Check if dev server is running on port 5173
3. **Build errors**: Run `npm run build` to check for TypeScript errors

### Debug Mode

Run with debug information:

```bash
# Enable Electron debug logs
DEBUG=electron* npm run electron-dev
```

## Icons

Place application icons in the `assets/` directory:

- `icon.png` - For Linux (512x512 pixels recommended)
- `icon.ico` - For Windows (256x256 pixels recommended)  
- `icon.icns` - For macOS (512x512 pixels recommended)

## License

MIT - See LICENSE.md for details.

## Contributing

This package is part of the Miroir Framework monorepo. Please refer to the main repository's contribution guidelines.
