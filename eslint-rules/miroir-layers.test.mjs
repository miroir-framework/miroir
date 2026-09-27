// Run: node --test eslint-rules/
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import rule from "./miroir-layers.mjs";

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });
const inCore = (file) => `/repo/packages/miroir-core/src/${file}`;

ruleTester.run("miroir-layers", rule, {
  valid: [
    { filename: inCore("3_controllers/A.ts"), code: `import { f } from "../2_domain/B.js";` },
    { filename: inCore("1_core/A.ts"), code: `import { f } from "./B.js";` },
    { filename: inCore("1_core/A.ts"), code: `import { T } from "../0_interfaces/2_domain/B.js";` },
    { filename: inCore("1_core/A.ts"), code: `import type { T } from "../3_controllers/B.js";` },
    { filename: inCore("1_core/A.ts"), code: `import { type T, type U } from "../3_controllers/B.js";` },
    { filename: inCore("2_domain/x/A.ts"), code: `import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory.js";` },
    { filename: inCore("2_domain/A.ts"), code: `import { LoggerContext } from "../4_services/LoggerContext";` },
    // 0_interfaces/2_domain is the interface layer, not 2_domain
    { filename: inCore("0_interfaces/1_core/A.ts"), code: `import { T } from "../2_domain/B.js";` },
    { filename: inCore("1_core/A.ts"), code: `import { z } from "zod";` },
    { filename: "/repo/packages/miroir-core/tests/A.ts", code: `import { f } from "../src/4_services/B.js";` },
  ],
  invalid: [
    { filename: inCore("1_core/A.ts"), code: `import { f } from "../2_domain/B.js";`, errors: [{ messageId: "upward" }] },
    { filename: inCore("0_interfaces/1_core/x/A.ts"), code: `import { f } from "../../../1_core/B";`, errors: [{ messageId: "upward" }] },
    { filename: inCore("2_domain/A.ts"), code: `import { type T, f } from "../4_services/B.js";`, errors: [{ messageId: "upward" }] },
    { filename: inCore("3_controllers/A.ts"), code: `export { f } from "../4_services/B.js";`, errors: [{ messageId: "upward" }] },
    { filename: inCore("1_core/A.ts"), code: `const m = import("../3_controllers/B.js");`, errors: [{ messageId: "upward" }] },
  ],
});
