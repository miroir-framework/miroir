# Feature 193 — Add LLM/Agent Support to Miroir

## Overview

Add a prompt-driven AI assistant embedded in Miroir that lets users create and update Miroir elements (Entities, Queries, Transformers, Reports, Actions, Runners) via natural language prompts. The AI proposes changes as pre-filled, editable forms; the user reviews and applies.

### Key Decisions

- **vscode-copilot-chat** was archived on May 20, 2026 and merged into VS Code. For VS Code integration (Phase 3), the existing `miroir-mcp` server can be registered as a native VS Code MCP server — no custom extension is needed.
- **Library**: CopilotKit v1.57+ (MIT). Batteries-included agentic UI framework with human-in-the-loop support and MCP integration.
- **Backend**: New `miroir-ai` package hosts the CopilotKit Runtime (Node.js), mounted in `miroir-server` at `/api/copilotkit`.
- **API key security**: Keys stored as server-side environment variables (`AI_OPENAI_KEY`, `AI_ANTHROPIC_KEY`, `AI_GOOGLE_KEY`). The `AiConfiguration` entity only stores provider/model metadata (safe for browser local cache).
- **Review UX**: Pre-filled editable forms using existing MUI components — not a raw JSON diff. Consistent with the current Miroir editing UX.
- **Providers**: OpenAI, Anthropic, Google Gemini.

---

## Architecture

```
Browser (miroir-standalone-app)
├── <CopilotKit runtimeUrl="/api/copilotkit">
│    └── <AiAssistantPage> / <CopilotSidebar>
│         ├── useCopilotReadable() — feeds deployment context to LLM
│         └── useCopilotAction("createMiroirEntity" | ...) — human-in-the-loop forms
└── SettingsPage: AiConfiguration fields (provider, model)
         │
         │  POST /api/copilotkit  (streaming)
         ▼
miroir-ai package  (Node.js, CopilotKit Runtime)
├── Express route: POST /api/copilotkit
│    ├── Read AiConfiguration from admin deployment (provider + model)
│    ├── Read API key from environment variable
│    ├── Instantiate CopilotRuntime with adapter + Miroir tools
│    └── Stream response back to browser
└── Tools:
     ├── generateMiroirEntity   → {entity, entityDefinition}
     ├── generateMiroirQuery    → QueryInstance
     ├── generateMiroirTransformer → TransformerInstance
     ├── generateMiroirReport   → ReportInstance
     ├── generateMiroirAction   → ActionInstance
     └── getMiroirContext       → list of existing elements (read-only)
```

---

## Phase 0 — Foundation: AiConfiguration Entity

**Goal**: Persist LLM provider/model selection in the admin deployment.

### Step 0.1 — AiConfiguration Entity + EntityDefinition

New UUIDs (generated):
- **Entity UUID**: `8a36e922-c131-444a-8709-9c92e772b1ff`
- **EntityDefinition UUID**: `5915d365-a7e7-4a3a-a09e-cb4e327198c9`

New files:

| File | Description |
|------|-------------|
| `packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/8a36e922-c131-444a-8709-9c92e772b1ff.json` | Entity record for AiConfiguration |
| `packages/miroir-test-app_deployment-admin/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/5915d365-a7e7-4a3a-a09e-cb4e327198c9.json` | EntityDefinition for AiConfiguration |

AiConfiguration fields:
- `name` — human-readable config name (e.g. "My OpenAI Config")
- `providerType` — enum: `openai | anthropic | google`
- `model` — string (e.g. "gpt-4o", "claude-opus-4", "gemini-2.0-flash")
- `baseUrl` — optional string (for custom endpoints / local models)

> ⚠️ **Security**: The `apiKey` is NOT stored in the entity. It is read from environment variables server-side: `AI_OPENAI_KEY`, `AI_ANTHROPIC_KEY`, `AI_GOOGLE_KEY`.

### Step 0.2 — Update SettingsPage (Phase 2 scope)

The SettingsPage will gain an "AI Assistant" section that lets users create/edit an AiConfiguration instance, using the same `domainController.handleActionFromUI` pattern as existing settings editing.

---

## Phase 1 — `miroir-ai` Package (Backend LLM Proxy)

**Goal**: CopilotKit Runtime endpoint that receives user prompts, calls the LLM with Miroir-specific tools, and returns structured Miroir element proposals.

### Step 1.1 — Package scaffold

New package: `packages/miroir-ai/`

Key files:

| File | Description |
|------|-------------|
| `package.json` | `@miroir-framework/miroir-ai`, ESM, node 20 target |
| `tsconfig.json` | Extends workspace tsconfig, ESM/NodeNext |
| `tsup.config.ts` | Build config mirroring `miroir-mcp` |
| `src/index.ts` | Package entry point, exports `copilotKitRouter` |
| `src/runtime/copilotRuntimeFactory.ts` | Builds `CopilotRuntime` + adapter from env/config |
| `src/tools/miroirTools.ts` | All Miroir tool definitions |
| `src/prompts/miroirSystemPrompt.ts` | System prompt with Miroir schema context |
| `src/routes/copilotKitRoute.ts` | Express Router exposing `POST /copilotkit` |

Dependencies:
- `@copilotkit/runtime` ^1.57.0
- `openai` ^4.x
- `@anthropic-ai/sdk` ^0.x
- `@google/generative-ai` ^0.x
- `miroir-core` `*`
- `express` ^4.x

### Step 1.2 — CopilotRuntime factory

`src/runtime/copilotRuntimeFactory.ts`:
- Reads `providerType` and `model` from the stored `AiConfiguration` (passed as parameter)
- Reads API key from environment variable based on providerType
- Returns `{ runtime: CopilotRuntime, serviceAdapter: ServiceAdapter }`
- Supports `OpenAIAdapter`, `AnthropicAdapter`, `GoogleGenerativeAIAdapter`

### Step 1.3 — Miroir tool definitions

`src/tools/miroirTools.ts` defines CopilotKit `Action[]`:

| Tool name | Parameters | Returns |
|-----------|------------|---------|
| `generateMiroirEntity` | `entityName`, `attributes[]` | `{entity, entityDefinition}` |
| `generateMiroirQuery` | `description`, `entityName`, `deploymentUuid` | `QueryInstance` |
| `generateMiroirTransformer` | `description`, `inputDescription` | `TransformerInstance` |
| `generateMiroirReport` | `description`, `entityName` | `ReportInstance` |
| `generateMiroirAction` | `description` | `ActionInstance` |
| `getMiroirContext` | `deploymentUuid` | list of entities/queries |

Each tool returns a strongly-typed JSON object using `miroir-core` types.

The system prompt in `src/prompts/miroirSystemPrompt.ts` includes:
- Description of Miroir entities, queries, transformers, reports
- Example JSON instances for each type
- Jzod schema summary for the most important types
- Instruction to return structured JSON matching the Miroir format

### Step 1.4 — Express route + miroir-server integration

`src/routes/copilotKitRoute.ts`:
- Express `Router`
- `POST /` handler using `copilotRuntimeNodeHttpEndpoint` from `@copilotkit/runtime`
- Creates CopilotRuntime per-request (hot config swap)

`packages/miroir-server/src/server.ts`:
- Import `{ copilotKitRouter } from "miroir-ai"`
- Mount at `/api/copilotkit` AFTER MCP server setup, BEFORE SPA catch-all

---

## Phase 2 — Browser UI (CopilotKit Frontend)

**Goal**: Chat sidebar embedded in the standalone app; AI proposals appear as pre-filled, editable forms.

### Step 2.1 — Install CopilotKit React packages

```
@copilotkit/react-core
@copilotkit/react-ui
```

Added to `miroir-standalone-app/package.json`.

### Step 2.2 — Wrap app with CopilotKit provider

`src/index.tsx`:
```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <App />
</CopilotKit>
```

Add a `MiroirContextProvider` inner component that uses `useCopilotReadable` to feed the active deployment's entity list to the LLM.

### Step 2.3 — AiAssistantPage

New page at `src/miroir-fwk/4_view/routes/AiAssistantPage.tsx`:
- Route: `?page=ai-assistant`
- Uses `<CopilotSidebar>` (or `<CopilotChat>`) component
- Custom `instructions` describing Miroir capabilities to the user
- Navigation link added to main menu

### Step 2.4 — Human-in-the-loop review actions

`useCopilotAction` handlers registered in `AiAssistantPage.tsx`:

| Action | Renders | On "Apply" |
|--------|---------|-----------|
| `createMiroirEntity` | `<AiEntityProposalForm>` pre-filled | `ModelAction` via DomainController |
| `createMiroirQuery` | `<AiQueryProposalForm>` pre-filled | `ModelAction` via DomainController |
| `createMiroirTransformer` | `<AiTransformerProposalForm>` | `ModelAction` via DomainController |
| `createMiroirReport` | `<AiReportProposalForm>` | `ModelAction` via DomainController |

Each action uses `renderAndWaitForResponse` to pause the LLM pending user approval.

### Step 2.5 — AiProposalForm components

`src/miroir-fwk/4_view/components/Ai/`:
- `AiEntityProposalForm.tsx` — Entity name + attribute table (editable), "Apply"/"Discard" buttons, "AI proposed" badge
- `AiQueryProposalForm.tsx` — Query JSON editor (editable)
- `AiTransformerProposalForm.tsx` — similar
- `AiReportProposalForm.tsx` — similar

Reuses existing MUI components from `EntityEditor.tsx` and `ReportSectionListDisplay.tsx`.

---

## Phase 3 — VS Code / MCP Integration (documentation only)

**Goal**: Expose miroir-mcp as a native VS Code MCP server (no custom extension needed).

### Step 3.1 — CORS for miroir-mcp

Add CORS headers to `packages/miroir-mcp/src/mcpServer.ts` SSE transport:
```typescript
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
```

### Step 3.2 — VS Code configuration docs

Update `packages/miroir-mcp/README.md` to document:

```json
// .vscode/settings.json or user settings
{
  "github.copilot.chat.mcp.servers": {
    "miroir": {
      "url": "http://localhost:3080/sse",
      "type": "sse"
    }
  }
}
```

Users can then use `@miroir` tools directly in VS Code Copilot chat.

---

## Complete File Change List

### New files

| Path | Phase |
|------|-------|
| `code-helpers/features/193-FEATURE-.../plan.md` | — |
| `packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/8a36e922-c131-444a-8709-9c92e772b1ff.json` | 0 |
| `packages/miroir-test-app_deployment-admin/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/5915d365-a7e7-4a3a-a09e-cb4e327198c9.json` | 0 |
| `packages/miroir-ai/package.json` | 1 |
| `packages/miroir-ai/tsconfig.json` | 1 |
| `packages/miroir-ai/tsup.config.ts` | 1 |
| `packages/miroir-ai/src/index.ts` | 1 |
| `packages/miroir-ai/src/runtime/copilotRuntimeFactory.ts` | 1 |
| `packages/miroir-ai/src/tools/miroirTools.ts` | 1 |
| `packages/miroir-ai/src/prompts/miroirSystemPrompt.ts` | 1 |
| `packages/miroir-ai/src/routes/copilotKitRoute.ts` | 1 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/AiAssistantPage.tsx` | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Ai/AiEntityProposalForm.tsx` | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Ai/AiQueryProposalForm.tsx` | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Ai/AiTransformerProposalForm.tsx` | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Ai/AiReportProposalForm.tsx` | 2 |

### Modified files

| Path | Change | Phase |
|------|--------|-------|
| `packages/miroir-server/src/server.ts` | Import + mount copilotKitRouter | 1 |
| `packages/miroir-standalone-app/package.json` | Add CopilotKit React packages | 2 |
| `packages/miroir-standalone-app/src/index.tsx` | Wrap with `<CopilotKit>` | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/SettingsPage.tsx` | AI config section | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx` | Register ai-assistant route | 2 |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/navigation.ts` | Add pageUrl("ai-assistant") | 2 |
| `packages/miroir-mcp/src/mcpServer.ts` | Add CORS headers | 3 |

---

## Verification Checklist

### Phase 0
- [ ] `AiConfiguration` Entity and EntityDefinition appear in admin deployment model files
- [ ] Server starts without errors loading admin deployment
- [ ] `AiConfiguration` entity visible in the Entities report in the admin app

### Phase 1
- [ ] `npm run build -w miroir-ai` succeeds (no TypeScript errors)
- [ ] `npm run dev -w miroir-server` starts without import errors
- [ ] `POST http://localhost:3080/api/copilotkit` returns a non-404 response
- [ ] `AI_OPENAI_KEY=sk-test npm run dev -w miroir-server` → provider correctly instantiated

### Phase 2
- [ ] Settings page shows "AI Assistant" section with provider/model fields
- [ ] `/?page=ai-assistant` renders CopilotKit chat sidebar
- [ ] Prompt "Create an entity called Product with name and price fields" → `AiEntityProposalForm` appears pre-filled
- [ ] Click "Apply" → entity appears in the Entities report
- [ ] Click "Discard" → AI acknowledges and offers alternatives

### Phase 3
- [ ] VS Code: configure miroir-mcp in `settings.json` → `@miroir` tools available in Copilot chat
- [ ] `@miroir list all entities` returns entity list from active deployment

---

## Further Considerations

1. **LLM structured output quality** is the highest-risk item. The system prompt must include Jzod schemas and multiple examples per element type. Validate with a spike before building the full Phase 2 UI.
2. **CopilotKit `renderAndWaitForResponse` API**: Confirm stability in the installed version before Phase 2. The human-in-the-loop pattern is the core of the review UX.
3. **Multi-deployment context**: `getMiroirContext` should accept an active deployment UUID so the LLM sees the right entities for the user's current context (not just admin/library).
4. **Approach B for API keys** (future): Store encrypted API key in the `AiConfiguration` entity itself, reading it server-side only via direct store access. This would require a "server-only" entity flag in miroir-core.
