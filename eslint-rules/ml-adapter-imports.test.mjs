// #145: only the ML adapter of miroir-core (mlJzodAdapter, mlJzodTsAdapter) imports @miroir-framework/jzod and @miroir-framework/jzod-ts.
// Checks the `no-restricted-imports` block of eslint.config.mjs. Run: node --test eslint-rules/ml-adapter-imports.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();
const errorsFor = async (filePath, code) => {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
};

const jzodImport = `import { valueToJzod } from "@miroir-framework/jzod";\n`;
const jzodTsImport = `import { jzodToTsCode } from "@miroir-framework/jzod-ts";\n`;

test("a package source file cannot import jzod or jzod-ts", async () => {
  assert.equal((await errorsFor("packages/miroir-cli/src/a.ts", jzodImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-standalone-app/src/a.tsx", jzodTsImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-core/src/1_core/mls/mlsTypeCheck.ts", jzodImport)).length, 1);
});

test("tests and scripts cannot import jzod or jzod-ts", async () => {
  assert.equal((await errorsFor("packages/miroir-core/tests/a.test.ts", jzodImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-core/scripts/generate-ts-types.ts", jzodTsImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-store-postgres/scripts/a.ts", jzodTsImport)).length, 1);
});

test("package-root and JavaScript files cannot import jzod or jzod-ts", async () => {
  assert.equal((await errorsFor("packages/miroir-cli/vite.config.js", jzodImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-core/tsup.config.js", jzodTsImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-mcp/lib/a.mjs", jzodImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-react/src/a.jsx", jzodImport)).length, 1);
  assert.equal((await errorsFor("packages/miroir-cli/a.cts", jzodImport)).length, 1);
});

test("the adapter imports jzod and jzod-ts", async () => {
  assert.equal((await errorsFor("packages/miroir-core/src/1_core/mls/mlJzodAdapter.ts", jzodImport)).length, 0);
  assert.equal((await errorsFor("packages/miroir-core/src/1_core/mls/mlJzodTsAdapter.ts", jzodTsImport)).length, 0);
});

test("a type-only import is restricted too", async () => {
  const typeImport = `import type { JzodElement } from "@miroir-framework/jzod-ts";\n`;
  assert.equal((await errorsFor("packages/miroir-mcp/src/a.ts", typeImport)).length, 1);
});
