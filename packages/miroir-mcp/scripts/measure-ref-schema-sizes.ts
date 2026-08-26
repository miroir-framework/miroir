/**
 * One-off size probe for #248 $ref exploration. Run:
 *   npx vite-node scripts/measure-ref-schema-sizes.ts
 * from packages/miroir-mcp
 */
import { jzodElementToJsonSchema } from "../src/tools/jzodElementToJsonSchema.ts";

const absolutePath = "fe9b7d99-f216-44de-bb6e-60e1a1ebb739";
const refs = [
  "applicationSection",
  "entityInstance",
  "jzodElement",
  "compositeActionSequence",
  "compositeAction",
  "boxedQueryWithExtractorCombinerTransformer",
  "transformerForRuntime",
];

for (const relativePath of refs) {
  try {
    const result = jzodElementToJsonSchema({
      type: "schemaReference",
      definition: { absolutePath, relativePath },
    } as any);
    const bytes = JSON.stringify(result).length;
    const defCount = Object.keys((result as any).$defs ?? {}).length;
    console.log(
      `${relativePath.padEnd(48)} ${(bytes / 1024).toFixed(1).padStart(10)} KB  defs=${defCount}`,
    );
  } catch (error) {
    console.log(`${relativePath.padEnd(48)} ERROR ${error instanceof Error ? error.message : error}`);
  }
}
