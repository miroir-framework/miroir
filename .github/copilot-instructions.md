# Copilot Instructions for Miroir Monorepo

## Project Overview

- **Miroir** is a TypeScript monorepo for modular, schema-driven data management and UI, organized as multiple packages under `packages/`.
- Major packages:
  - `miroir-core`: Core logic, schema, and data transformation.
  - `miroir-server`: Node.js backend.
  - `miroir-standalone-app`: Main client app (Vite/React).
  - `miroir-store-*`: Pluggable persistence layers (filesystem, indexedDb, postgres).
  - `miroir-react`, `miroir-designer`, etc.: UI and design tools.

## Architecture & Patterns

- **Schema-first**: Data flows and UI are driven by Jzod schemas (`@miroir-framework/jzod`).
- **Monorepo**: Uses npm/yarn workspaces. Cross-package imports use workspace aliases.
- **Testing**: Heavy use of Vitest/Jest. Test config and log files are in `tests/` folders.
- **Theming**: UI theming is centralized (see `MiroirTheme.ts`, `MiroirThemeContext.tsx`).
- **Component Structure**: Deeply nested editors (e.g., `JzodElementEditor`) use recursive patterns and theming hooks for visual hierarchy.

## Developer Workflows

### Build & Compile

- **No build on `miroir-standalone-app`**: Only run `npx tsc --noEmit --skipLibCheck` for type checks.
- **Build core/server**:
  ```sh
  npm run devBuild -w miroir-core
  npm run build -w miroir-server
  ```
- **Link local dependencies**:
  ```sh
  npm link @miroir-framework/jzod-ts @miroir-framework/jzod
  ```

### Run & Test

- **Start server**:
  ```sh
  npm run dev -w miroir-server
  ```
- **Start client**: (see above, but not for standalone-app in dev)
- **Automated tests**:
  - Core/unit: `npm run testNode -w miroir-core`
  - Integration (various stores): Use `testByFile` with appropriate env vars and config files (see `README.md` for full matrix).
  - Example:
    ```sh
    VITE_MIROIR_TEST_CONFIG_FILENAME=... npm run testByFile -w miroir-standalone-app -- DomainController.integ
    ```

### Debugging

- **Log config**: Use `VITE_MIROIR_LOG_CONFIG_FILENAME` to control logging granularity.
- **MSW**: Client can use MSW to simulate server responses for UI development.

## Conventions & Gotchas

- **Do not run `dev` or `build` on `miroir-standalone-app`**; use type check only.
- **TypeScript strictness**: Use `--skipLibCheck` for speed, but keep code type-safe.
- **Theming**: When adding UI, use theme hooks and avoid hardcoded colors.
- **Testing**: Always specify config/log files for integration tests.
- **Schema evolution**: Update Jzod schemas and related types in `miroir-core` first.

## Key Files & Directories

- `packages/miroir-core/`: Core logic, schema, and transformation scripts.
- `packages/miroir-standalone-app/`: Main client app, theming, and editors.
- `packages/miroir-server/`: Backend logic and API.
- `tests/`: Test configs and log settings.
- `MiroirTheme.ts`, `MiroirThemeContext.tsx`: Theming system.
- `JzodElementEditor.tsx`: Example of recursive, theme-aware component.

---

Let me know if you want more detail on any workflow, package, or convention!
