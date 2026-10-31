import type { Uuid } from "miroir-core";
import { selfApplicationMiroir } from "miroir-app-miroir";

// #633 D4: the tool pages (search, transformer builder) open on the application the user works on,
// not on an example application miroir-react cannot depend on.

/** The application a tool page opens on: the page's own selection, then the current application, then Miroir. */
export function defaultToolApplication(...candidates: (Uuid | undefined)[]): Uuid {
  return candidates.find((candidate) => !!candidate) ?? selfApplicationMiroir.uuid;
}

/**
 * The entity a tool page shows first: for Miroir, the given one; for another application, the first of
 * its entities by name, or the given one when its model holds none yet.
 */
export function defaultToolEntity(
  application: Uuid,
  entities: ReadonlyArray<{ uuid: Uuid; name: string }>,
  miroirEntity: Uuid,
): Uuid {
  if (application === selfApplicationMiroir.uuid) return miroirEntity;
  const first = [...entities].sort((a, b) => a.name.localeCompare(b.name))[0];
  return first?.uuid ?? miroirEntity;
}
