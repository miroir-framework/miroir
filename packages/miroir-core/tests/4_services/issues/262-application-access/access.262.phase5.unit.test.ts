/**
 * #262 — config refresh must warn on AccessDenied store open, not abort authorized deployments.
 *
 * Production wrap (RestClient 403 "Forbidden" → PersistenceReduxSaga → CallUtils):
 * Action2Error FailedToHandlePersistenceAction with inner errorStack ["Forbidden"].
 */
import { describe, expect, it } from "vitest";

import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import {
  isAccessDeniedActionResult,
  partitionOpenStoreResults,
} from "../../../../src/1_core/authentication/AccessPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.262" || RUN_TEST.startsWith("access.262");

const MIROIR = {
  uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  name: "Miroir",
};
const DESIGNER = {
  uuid: "f0359240-e849-4546-8158-75f4a8ae5831",
  selfApplication: "880831db-4f76-40b1-97c0-6a2f3f4ffccb",
  name: "Designer",
};
const LIBRARY = {
  uuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  name: "Library",
};

function wrappedForbiddenOpenStoreError(): Action2Error {
  const sagaSpread = {
    status: "error",
    errorType: "FailedToHandlePersistenceAction",
    errorMessage: "could not handle action storeManagementAction_openStore",
    errorStack: ["Forbidden"],
  };
  return new Action2Error(
    "FailedToHandlePersistenceAction",
    "could not handle action storeManagementAction_openStore",
    [],
    sagaSpread as unknown as Action2Error,
  );
}

if (runThis) {
  describe("access.262.phase5 config refresh AccessDenied openStore", () => {
    it("recognizes the RestClient 403 Forbidden wrap as AccessDenied", () => {
      expect(isAccessDeniedActionResult(wrappedForbiddenOpenStoreError())).toBe(true);
    });

    it("does not treat a real store failure as AccessDenied", () => {
      expect(
        isAccessDeniedActionResult(
          new Action2Error("FailedToOpenStore", "Failed to add persistence store controller"),
        ),
      ).toBe(false);
    });

    it("keeps Miroir and Library when Designer openStore is AccessDenied", () => {
      const partitioned = partitionOpenStoreResults(
        [MIROIR, DESIGNER, LIBRARY],
        [{ status: "ok" }, wrappedForbiddenOpenStoreError(), { status: "ok" }],
      );
      expect(partitioned.allowed.map((d) => d.name)).toEqual(["Miroir", "Library"]);
      expect(partitioned.accessDenied.map((d) => d.name)).toEqual(["Designer"]);
      expect(partitioned.hardFailures).toEqual([]);
    });

    it("still reports non-access failures so the refresh can fail closed", () => {
      const disk = new Action2Error("FailedToOpenStore", "disk full");
      const partitioned = partitionOpenStoreResults(
        [MIROIR, LIBRARY],
        [{ status: "ok" }, disk],
      );
      expect(partitioned.allowed.map((d) => d.name)).toEqual(["Miroir"]);
      expect(partitioned.accessDenied).toEqual([]);
      expect(partitioned.hardFailures).toHaveLength(1);
      expect(partitioned.hardFailures[0]?.deployment.name).toBe("Library");
    });
  });
}
