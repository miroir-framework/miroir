/**
 * #708 part B: the difference between two model states, whatever they were read from (live, frozen, Git).
 * Rows are matched by uuid in each collection of an application's `model` section (the one list of core,
 * `metaModelCollections`); an Entity's attributes are compared by name.
 */
import {
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
  metaModelCollections,
  type EntityPresentModelDefinitionField,
  type MetaModel,
  type MetaModelCollection,
} from "@miroir-framework/core";

type Row = Record<string, unknown>;

/** A row in both states that differs: the attributes that differ, sorted, and the row in each state. */
export type ModelStateRowChange = { uuid: string; attributes: string[]; previous: Row; next: Row };

/** The rows of a collection added, removed and changed from one state to the next, each sorted by uuid. */
export type ModelStateCollectionDiff = { added: Row[]; removed: Row[]; changed: ModelStateRowChange[] };

/** The attributes of an Entity (its `mlSchema` definition) added, removed and changed, by name. */
export type EntityAttributesDiff = {
  entityUuid: string;
  name: string;
  added: string[];
  removed: string[];
  changed: string[];
};

/** Only the collections that differ appear, and only the Entities whose attributes differ. */
export type ModelStateDiff = {
  collections: Partial<Record<MetaModelCollection, ModelStateCollectionDiff>>;
  entityAttributes: EntityAttributesDiff[];
};

/** The collections a model state may hold, all or some of them. */
export type ModelStateCollections = Partial<Pick<MetaModel, MetaModelCollection>>;

/**
 * Attributes that say where a row is stored rather than what it is; a frozen row does not keep
 * `parentDefinitionVersionUuid`, nor `conceptLevel` but on Entities.
 */
const NOT_COMPARED = new Set(["uuid", "parentUuid", "parentName", "parentDefinitionVersionUuid"]);

function canonicalJson(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalJson);
  }
  if (typeof value === "object") {
    const record = value as Row;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalJson(record[key])])
        .filter(([, child]) => child !== undefined),
    );
  }
  return value;
}

/** Deep equality of JSON values, ignoring key order and absent or null values (Postgres JSONB parity). */
export function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonicalJson(a)) === JSON.stringify(canonicalJson(b));
}

function byUuid(rows: readonly object[]): Map<string, Row> {
  return new Map(rows.map((row) => [String((row as Row).uuid), row as Row]));
}

function differingKeys(previous: Row, next: Row, ignored: (key: string) => boolean): string[] {
  return [...new Set([...Object.keys(previous), ...Object.keys(next)])]
    .filter((key) => !ignored(key) && !sameJson(previous[key], next[key]))
    .sort();
}

function diffCollection(collection: MetaModelCollection, previous: readonly object[], next: readonly object[]): ModelStateCollectionDiff {
  const before = byUuid(previous);
  const after = byUuid(next);
  const ignored = (key: string) => NOT_COMPARED.has(key) || (key === "conceptLevel" && collection !== "entities");
  const sortedUuids = (map: Map<string, Row>, absentFrom: Map<string, Row>) =>
    [...map.keys()].filter((uuid) => !absentFrom.has(uuid)).sort();
  return {
    added: sortedUuids(after, before).map((uuid) => after.get(uuid)!),
    removed: sortedUuids(before, after).map((uuid) => before.get(uuid)!),
    changed: [...before.keys()]
      .filter((uuid) => after.has(uuid))
      .sort()
      .map((uuid) => ({ uuid, attributes: differingKeys(before.get(uuid)!, after.get(uuid)!, ignored), previous: before.get(uuid)!, next: after.get(uuid)! }))
      .filter((change) => change.attributes.length > 0),
  };
}

function entityAttributes(entity: Row): Row {
  return ((entity.mlSchema as Row | undefined)?.definition as Row | undefined) ?? {};
}

/** The difference from `previous` to `next`, over the collections of an application's model. */
export function diffModelStates(previous: ModelStateCollections, next: ModelStateCollections): ModelStateDiff {
  const collections: ModelStateDiff["collections"] = {};
  for (const { collection, section } of metaModelCollections) {
    if (section !== "model") {
      continue;
    }
    const diff = diffCollection(collection, previous[collection] ?? [], next[collection] ?? []);
    if (diff.added.length + diff.removed.length + diff.changed.length > 0) {
      collections[collection] = diff;
    }
  }
  const entityAttributeDiffs = (collections.entities?.changed ?? [])
    .filter((change) => change.attributes.includes("mlSchema"))
    .map((change) => {
      const before = entityAttributes(change.previous);
      const after = entityAttributes(change.next);
      return {
        entityUuid: change.uuid,
        name: String(change.next.name),
        added: Object.keys(after).filter((name) => !(name in before)).sort(),
        removed: Object.keys(before).filter((name) => !(name in after)).sort(),
        changed: Object.keys(before).filter((name) => name in after && !sameJson(before[name], after[name])).sort(),
      };
    })
    .filter((diff) => diff.added.length + diff.removed.length + diff.changed.length > 0);
  return { collections, entityAttributes: entityAttributeDiffs };
}

/** A change of the model's Entities, as an Application Version's `modelCUDMigration` records it. */
export type ModelCudMigrationCandidate =
  | { kind: "createEntity"; entityUuid: string; name: string }
  | { kind: "dropEntity"; entityUuid: string; name: string }
  | {
      kind: "renameEntity";
      entityUuid: string;
      /** Name in previous snapshot. */
      name: string;
      /** Name in next snapshot. */
      targetName: string;
    }
  | {
      kind: "alterEntityAttribute";
      entityUuid: string;
      name: string;
      differingFields: EntityPresentModelDefinitionField[];
    };

/**
 * #216 Option A: the migration candidates of a diff's Entities, matched by uuid (rename versus drop and
 * create is uuid-based only). Order: creates, drops, then per Entity in both (a rename, then an alter of its
 * present-model definition fields), each group sorted by Entity uuid.
 */
export function modelCudMigrationCandidates(diff: ModelStateDiff): ModelCudMigrationCandidate[] {
  const entities = diff.collections.entities ?? { added: [], removed: [], changed: [] };
  return [
    ...entities.added.map((row) => ({ kind: "createEntity" as const, entityUuid: String(row.uuid), name: String(row.name) })),
    ...entities.removed.map((row) => ({ kind: "dropEntity" as const, entityUuid: String(row.uuid), name: String(row.name) })),
    ...entities.changed.flatMap((change): ModelCudMigrationCandidate[] => {
      const differingFields = ENTITY_PRESENT_MODEL_DEFINITION_FIELDS.filter((field) => change.attributes.includes(field));
      return [
        ...(change.attributes.includes("name")
          ? [{ kind: "renameEntity" as const, entityUuid: change.uuid, name: String(change.previous.name), targetName: String(change.next.name) }]
          : []),
        ...(differingFields.length > 0
          ? [{ kind: "alterEntityAttribute" as const, entityUuid: change.uuid, name: String(change.next.name), differingFields: [...differingFields] }]
          : []),
      ];
    }),
  ];
}
