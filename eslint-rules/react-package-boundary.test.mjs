// #633: miroir-react is a library; host features (assistant, MCP client, Electron, model diagram) reach it through
// MiroirShellHostContext and the report section registry. Checks the miroir-react `no-restricted-imports` block of
// eslint.config.mjs. Run: node --test eslint-rules/react-package-boundary.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();
const errorsFor = async (filePath, code) => {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
};

const reactSrc = "packages/miroir-react/src/components/Page/a.tsx";

test("miroir-react sources cannot import a host feature", async () => {
  for (const code of [
    `import { CopilotKit } from "@copilotkit/react-core";\n`,
    `import { ipcRenderer } from "electron";\n`,
    `import { x } from "@miroir-framework/mcp";\n`,
    `import { callMcpTool } from "@miroir-framework/mcp/client";\n`,
    `import { ModelDiagramReportSectionView } from "miroir-diagram-class";\n`,
    `import { appShellHost } from "../../../../miroir-standalone-app/src/miroir-fwk/4_view/reportSectionRenderers";\n`,
  ]) {
    assert.equal((await errorsFor(reactSrc, code)).length, 1, code);
  }
});

test("miroir-react sources still cannot import the external ML packages", async () => {
  assert.equal((await errorsFor(reactSrc, `import { valueToJzod } from "@miroir-framework/jzod";\n`)).length, 1);
  assert.equal((await errorsFor(reactSrc, `import type { MlElement } from "@miroir-framework/jzod-ts";\n`)).length, 1);
});

test("miroir-react sources import miroir-core and their own modules", async () => {
  assert.equal((await errorsFor(reactSrc, `import { Uuid } from "@miroir-framework/core";\nimport { b } from "./b.js";\n`)).length, 0);
});

test("the app may import host features", async () => {
  const appSrc = "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/a.tsx";
  assert.equal((await errorsFor(appSrc, `import { CopilotKit } from "@copilotkit/react-core";\n`)).length, 0);
  assert.equal((await errorsFor(appSrc, `import { x } from "miroir-diagram-class";\n`)).length, 0);
});
