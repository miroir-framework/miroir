# miroir-react-testing

The MiroirTest runtime of a React client (#672), shared by `miroir-standalone-app` and `miroir-sandbox`:

- the `miroirTestReportSection` renderer (`miroir-react-testing/report-section`) and the Miroir Tests displays;
- unit runs in the browser, component and Report tests in a test sandbox;
- integration runs on the IndexedDB emulated stack (`emulatedServer-indexedDb`), or on a live `miroir-server`
  when the client's build holds the `realServer-*` client configurations (the app's does, the sandbox's does not).

Private package; built after `@miroir-framework/react` and `@miroir-framework/mcp` (see `build-all.sh`). The
standalone app's tests use its sources (vitest aliases in `packages/miroir-standalone-app/vite.config.js`).

The Node stores (filesystem, PostgreSQL, MongoDB) are optional peer dependencies: vitest and the CLI load them,
a browser build replaces them with a stub.

Testing guide: [docs/reference/testing.md](../../docs/reference/testing.md#in-the-sandbox-672).
