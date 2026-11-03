
build
```sh
npm run build -w miroir-sandbox
```

launch the sandbox locally
```sh
npm run dev -w miroir-sandbox
```
## MiroirTests in the sandbox (#672)

The **Miroir Tests** reports run MiroirTest suites in the sandbox, as in the standalone app: unit suites
(`fn`, `tr`, `ui`) and integration suites on the `emulatedServer-indexedDb` profile, which writes only to its
own IndexedDB databases. The runtime is `miroir-react-testing`, loaded when a MiroirTest report is shown.

smoke test (one suite of each kind, in a headless browser; needs the build above)
```sh
npm run smoke -w miroir-sandbox
```

Details: [docs/reference/testing.md](../../docs/reference/testing.md#in-the-sandbox-672).
