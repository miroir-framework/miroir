// Validates the Library model of a benchmark store against the schemas of its Entities (#550).
// JavaScript because it imports miroir-core; the acceptance command (Python) runs it and reads its JSON output.
//
// usage: node validate_store.mjs <modelPath> <dataPath> [<uuid>...]
// With uuids, only those instances are checked. Prints {"checked": n, "errors": [{file, uuid, entity, error}]}.
//
// Each instance is checked against its Entity's `mlSchema`. That check accepts any object where a template allows a
// transformer, so Queries and Reports are also parsed with the Zod schemas the runtime uses. MiroirTests are not
// checked here: some valid ones need an extended schema (`miroirTestSuite` rejects them).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  query,
  report,
} from "@miroir-framework/core";
import { buildModelValidationGroupsFromFilesystem } from "@miroir-framework/core/model-validation-fs";
import { defaultMiroirMetaModel } from "miroir-app-miroir";

const [modelPath, dataPath, ...uuids] = process.argv.slice(2);
const only = new Set(uuids);

const groups = buildModelValidationGroupsFromFilesystem({
  modelPath,
  dataPath,
  miroirMetaModel: defaultMiroirMetaModel,
  // MiroirTests need an extended schema.
  excludeEntityNames: ["MiroirTest"],
});

const QUERY_ENTITY = "e4320b9e-ab45-4abe-85d8-359604b3c62f";
const REPORT_ENTITY = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const zodChecks = [
  { entity: "Query", folder: QUERY_ENTITY, parse: (instance) => query.safeParse(instance.definition) },
  { entity: "Report", folder: REPORT_ENTITY, parse: (instance) => report.safeParse(instance) },
];

const errors = [];
let checked = 0;
for (const group of groups) {
  for (const [path, module] of Object.entries(group.instances)) {
    const instance = module.default;
    if (only.size > 0 && !only.has(instance.uuid)) {
      continue;
    }
    checked += 1;
    const check = checkModelValidationInstance(group.mlSchema, instance, path, defaultMiroirModelEnvironment);
    if (check.status === "error") {
      errors.push({ file: path, uuid: instance.uuid, entity: group.groupName, error: JSON.stringify(check.innermostError).slice(0, 2000) });
    }
  }
}
for (const { entity, folder, parse } of zodChecks) {
  const dir = join(modelPath, folder);
  let files = [];
  try {
    files = readdirSync(dir).filter((name) => name.endsWith(".json"));
  } catch {
    continue;
  }
  for (const file of files) {
    const instance = JSON.parse(readFileSync(join(dir, file), "utf8"));
    if (only.size > 0 && !only.has(instance.uuid)) {
      continue;
    }
    checked += 1;
    const result = parse(instance);
    if (!result.success) {
      errors.push({ file: join(dir, file), uuid: instance.uuid, entity, error: JSON.stringify(result.error.issues.slice(0, 3)).slice(0, 2000) });
    }
  }
}
process.stdout.write(JSON.stringify({ checked, errors }) + "\n");
