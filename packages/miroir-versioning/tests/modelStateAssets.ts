/** #708 part B: the model rows of an application, read from the JSON files of its deployment assets. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getApplicationSection, metaModelCollections } from "@miroir-framework/core";

import type { ModelStateCollections } from "../src/modelStateDiff.js";

const monorepoRoot = fileURLToPath(new URL("../../..", import.meta.url));

/** The model collections of an application, from the JSON files of the folder of its model rows. */
export function stateFromFolder(application: string, folder: string, section: "model" | "data"): ModelStateCollections {
  return Object.fromEntries(
    metaModelCollections
      .filter(({ entity }) => getApplicationSection(application, entity.uuid) === section)
      .map(({ entity, collection }) => {
        const path = join(monorepoRoot, folder, entity.uuid);
        let files: string[] = [];
        try {
          files = readdirSync(path).filter((file) => file.endsWith(".json"));
        } catch {
          // no row of this Entity
        }
        return [collection, files.map((file) => JSON.parse(readFileSync(join(path, file), "utf8")))];
      }),
  );
}
