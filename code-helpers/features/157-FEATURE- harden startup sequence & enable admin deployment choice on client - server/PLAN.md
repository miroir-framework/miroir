## Plan: Configurable Filesystem Deployment Root

**TL;DR:** `devRelativePathPrefix`/`prodRelativePathPrefix` are hardcoded in `miroir-core` and used in both server-side transformer evaluation and browser-side React components — broken because browser code runs on the client machine, not the server. Fix: add a single `filesystemDeploymentRootDirectory` field to the server config JSON; expose it via `GET /api/serverConfig`; update runner JSON templates to reference it directly; replace `process.env.NODE_ENV` checks in browser components with a hook that fetches the value from the server (or Electron IPC).

---

### Phase 1 — Server config & REST endpoint

**1.1** Add `"filesystemDeploymentRootDirectory"` inside the `"server"` object of:
- miroirConfig.server.json → `"./deployments/"` (prod default)
- All `tests/miroirConfig.test-emulatedServer-filesystem*.json` and `*-indexedDb*.json` → `"tests/tmp/"` (dev/test)
- SQL/postgres/mongodb test configs: skip

**1.2** In server.ts, add an Express route (after static-file middleware, around line 155):
```
GET /api/serverConfig → { filesystemDeploymentRootDirectory: string }
```
Read via `(miroirConfig.server as any).filesystemDeploymentRootDirectory` — same pattern as `corsAllowedOrigins` (line 103) and `assetsMountPath` (line 121).

**1.3** In DomainController.ts constructor, mutate the module-level `templateEvaluationParams` object to add the field:
```typescript
const serverCfg = (miroirContext.extendMiroirConfigWithExtraDeploymentConfiguration() as MiroirConfigServer)?.server as any;
(templateEvaluationParams as any).filesystemDeploymentRootDirectory =
  serverCfg?.filesystemDeploymentRootDirectory
  ?? (process.env.NODE_ENV === "development" ? devRelativePathPrefix : prodRelativePathPrefix);
```
*1.3 depends on 1.1*

---

### Phase 2 — Simplify runner JSON templates
*Depends on Phase 1 (1.3 must be deployed first)*

**2.1** 4f3cd0b1-08a1-421c-84f7-e0589be88d18.json (deployApplication, `prefix` template at line ~348): replace the `ifThenElse(NODE_ENV == "development", devRelativePathPrefix, prodRelativePathPrefix)` with:
```json
"prefix": { "transformerType": "getFromParameters", "referencePath": ["filesystemDeploymentRootDirectory"] }
```

**2.2** Same replacement in bcc872dc-649a-410a-81bc-a8ad65f21e1c.json (createApplication, line ~185).

**2.3** Mirror the same replacement in `getCreateApplicationActionTemplate()` in Runner_CreateApplication.tsx (inline TypeScript action template at lines 824–843).

---

### Phase 3 — Browser-side hook and component updates
*Parallel with Phase 2; depends on 1.2*

**3.1** Create new file `packages/miroir-standalone-app/src/miroir-fwk/4_view/hooks/useServerFilesystemRoot.ts`:
- If `window.electronAPI?.getDefaultFilesystemFolder` exists → call Electron IPC
- Otherwise → `fetch("/api/serverConfig")` and extract `filesystemDeploymentRootDirectory`
- Cache with `useState`/`useEffect`; return `string | undefined`

**3.2** Runner_CreateApplication.tsx:
- Remove module-level `prefix` const (lines 56–57)
- Add `const serverFilesystemRoot = useServerFilesystemRoot()` inside the FC
- Pass `serverFilesystemRoot ?? devRelativePathPrefix` as a new optional `filesystemRoot` parameter to `getRunner_CreateApplication` → `getCreateApplicationActionTemplate` (used only for initial form-value computation, not for transformer logic)

**3.3** FileSelector.tsx:
- Add optional prop `filesystemDeploymentRootDirectory?: string`
- In `handleFileChange`, replace the `process.env.NODE_ENV` check (lines 149–150) with `props.filesystemDeploymentRootDirectory ?? devRelativePathPrefix`
- Update callers to pass `filesystemDeploymentRootDirectory` sourced from `useServerFilesystemRoot()` in the parent

---

### Phase 4 — Electron wiring
*Parallel with Phase 3*

**4.1** app.config.json: add `"filesystemDeploymentRootDirectory"` to both `"development"` and `"production"` sections (use `""` or omit to fall back to `os.homedir()`).

**4.2** ipcServerSetup.ts line 194: update `"get-default-filesystem-folder"` handler to return configured value, falling back to `os.homedir()`.

---

### Phase 5 — Jzod schema formalization *(deferred)*

**5.1** Add `filesystemDeploymentRootDirectory: { type: "string", optional: true }` to `miroirConfigServer.server` in getMiroirFundamentalJzodSchema.ts (around line 1780).

**5.2** Run `npm run devBuild -w miroir-core` to regenerate miroirFundamentalType.ts.

**5.3** Replace `(miroirConfig.server as any).filesystemDeploymentRootDirectory` casts with the typed field.

---

### Verification

1. `curl https://localhost:3080/api/serverConfig` in dev → `{ "filesystemDeploymentRootDirectory": "tests/tmp/" }`; in prod → `"./deployments/"`
2. Create Application via `Runner_CreateApplication` with filesystem storage → deployment `directory` uses server-configured root
3. Deploy Application via `Runner_InstallApplication` → same check
4. `VITE_MIROIR_TEST_CONFIG_FILENAME=.../miroirConfig.test-emulatedServer-filesystem npm run testByFile -w miroir-standalone-app -- DomainController.integ` — all pass
5. Electron: create filesystem deployment → root from `app.config.json` or `os.homedir()` fallback
6. Config file missing `filesystemDeploymentRootDirectory` → `NODE_ENV` fallback still works

---

### Decisions & scope boundaries

- `devRelativePathPrefix`/`prodRelativePathPrefix` exports from `miroir-core` kept for backward compat, no longer used in active code paths after Phase 2–3.
- Access control (per-user/deployment subdirectory restrictions) — **deferred** per requirements.
- `FileSelector` `folder=true` UX in web context: no redesign — the browser-picked folder *name* is still used as subdirectory name under the server root; a proper server-side folder browser is deferred.
- `NODE_ENV` check in runner JSONs — removed entirely once `filesystemDeploymentRootDirectory` is in `templateEvaluationParams`.
- Phase 5 (Jzod schema) deferred — the `as any` pattern is already established in server.ts; Phases 1–4 deliver full runtime behavior.

---

### prompt used to generate this plan

the filesystem directory path for deployments that rely on the "filesystem" or "indexedDb" emulatedServerType is presently hard-coded in the `DomainController` as `devRelativePathPrefix` and `prodRelativePathPrefix`, that are used when `NODE_ENV="dev"` and `NODE_ENV="prod"`, respectively.

The `devRelativePathPrefix` and `prodRelativePathPrefix` are used only in the `Runner_CreateApplication`, the "deployApplication" Runner, and the `FileSelector` UI components.

There is a mismatch among those uses, since the present values for `devRelativePathPrefix` and `prodRelativePathPrefix`are correctly set for server-side access, the UI component only runs in the browser, thus on a potentially separate machine with completely different storage. The case where it could make sense for the `FileSelector` to use a common root for storage as the server-executed runners, is on the electron app, where it all runs in 1 process, with direct storage access.

We want to have a straightforward solution to storage access for "filesystem" or "indexedDb" emulatedServerTypes, with the following constraints:
- for web-server deployment, all web clients may deploy only in subdirectories of 1 directory. Aspects related to access rights per user / deployment / etc. will be dealt with later.
- the distinction between production and deployment environments makes sense, though it may not be perceived in the artefacts used for production environments, which may view or set only production-related parameters.
- the solution must also fit the electron app.

grill me first, then create an md file that will serve as a plan to develop the wanted feature.