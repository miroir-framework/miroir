/**
 * #273 Slice 2 — fetchProcessCapabilities + React context copy; UI must not compute locally.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  fetchProcessCapabilities,
  RestClientStub,
  type DomainControllerInterface,
  type ProcessCapabilities,
} from "miroir-core";
import { MiroirContextReactProvider, useMiroirContextService } from "miroir-react";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesContext.273.phase2";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const VIEW_SRC = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");
const ELECTRON_SRC = join(REPO_ROOT, "packages/miroir-standalone-app-electron/src");

const snapshot: ProcessCapabilities = {
  ai: true,
  mcp: true,
  cursor: false,
  designerTools: true,
  availableStoreTypes: ["indexedDb"],
  creatableStoreTypes: ["indexedDb"],
  storeAdministration: true,
};

const miroirContext = {
  miroirActivityTracker: {},
  miroirEventService: {},
  extendMiroirConfigWithExtraDeploymentConfiguration: () => undefined,
};

function ProcessCapabilitiesProbe() {
  const { processCapabilities } = useMiroirContextService();
  return React.createElement(
    "pre",
    { "data-testid": "process-capabilities" },
    JSON.stringify(processCapabilities),
  );
}

function collectTsFiles(root: string, skipTests: boolean): string[] {
  const found: string[] = [];
  if (!existsSync(root)) {
    return found;
  }
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipTests && (entry.name === "tests" || entry.name.endsWith(".test"))) {
          continue;
        }
        walk(full);
        continue;
      }
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        found.push(full);
      }
    }
  };
  walk(root);
  return found;
}

if (runThis) {
  describe("processCapabilitiesContext.273.phase2 fetch + provider", () => {
    it("fetchProcessCapabilities returns the snapshot stored on the stub", async () => {
      const stub = new RestClientStub("http://test");
      stub.setProcessCapabilities(snapshot);
      await expect(fetchProcessCapabilities(stub)).resolves.toEqual(snapshot);
    });

    it("MiroirContextReactProvider exposes the given snapshot on context", () => {
      const { getByTestId } = render(
        React.createElement(
          MiroirContextReactProvider,
          {
            miroirContext,
            domainController: {} as DomainControllerInterface,
            processCapabilities: snapshot,
          },
          React.createElement(ProcessCapabilitiesProbe),
        ),
      );
      expect(JSON.parse(getByTestId("process-capabilities").textContent ?? "")).toEqual(snapshot);
    });
  });

  describe("processCapabilitiesContext.273.phase2 no local getProcessCapabilities", () => {
    it("4_view and Electron renderer sources do not contain getProcessCapabilities", () => {
      const viewFiles = collectTsFiles(VIEW_SRC, true);
      expect(viewFiles.length).toBeGreaterThan(0);
      for (const file of viewFiles) {
        expect(readFileSync(file, "utf8"), file).not.toContain("getProcessCapabilities");
      }

      const electronFiles = collectTsFiles(ELECTRON_SRC, true).filter((file) => {
        const name = file.replace(/\\/g, "/");
        return !name.endsWith("/main.ts") && !name.endsWith("/ipcServerSetup.ts");
      });
      for (const file of electronFiles) {
        expect(readFileSync(file, "utf8"), file).not.toContain("getProcessCapabilities");
      }
    });
  });

  describe("processCapabilitiesContext.273.phase2 Vite proxies GET /capabilities", () => {
    it("vite.config.js server.proxy includes /capabilities", () => {
      const viteConfig = readFileSync(
        join(REPO_ROOT, "packages/miroir-standalone-app/vite.config.js"),
        "utf8",
      );
      const proxyBlock = viteConfig.match(/proxy:\s*\{([\s\S]*?)\n\s*\}/);
      expect(proxyBlock).not.toBeNull();
      const proxyKeys = [...(proxyBlock?.[1] ?? "").matchAll(/['"](\/[^'"]+)['"]/g)].map(
        (match) => match[1],
      );
      expect(proxyKeys).toContain("/capabilities");
    });
  });
  describe("processCapabilitiesContext.273.phase2 DomainControllers get the fetched snapshot", () => {
    it("setupMiroirTest installs fetchProcessCapabilities on the real-server client DomainController", () => {
      const src = readFileSync(
        join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4-tests/setupMiroirTest.ts"),
        "utf8",
      );
      const afterFetch = src.slice(src.indexOf("fetchProcessCapabilities"));
      expect(afterFetch).toContain("resolveProcessCapabilitiesUrl");
      expect(afterFetch).toContain("serverConfig?.rootApiUrl");
      expect(afterFetch).toContain(
        "domainControllerForClient.setProcessCapabilities(processCapabilities)",
      );
    });
  });
}
