import express from "express";

import type { ApplicationDeploymentMap, DomainControllerInterface } from "miroir-core";

import { setupMcpServer } from "./mcpServer.js";
import { EndpointToolRegistry } from "./tools/EndpointToolRegistry.js";

export type EphemeralMcpHttpServer = {
  url: string;
  close: () => Promise<void>;
};

/**
 * Start a Streamable HTTP MCP server on an ephemeral port, bound to the given
 * DomainController (same pattern as mcpTools.integ.test.ts).
 */
export async function startEphemeralMcpHttpServer(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<EphemeralMcpHttpServer> {
  const app = express();
  const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
  const mcpServer = await setupMcpServer(
    app,
    applicationDeploymentMap,
    registry,
    domainController,
  );
  const httpServer = app.listen(0);
  await new Promise<void>((resolve) => {
    httpServer.once("listening", () => resolve());
  });
  const address = httpServer.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await mcpServer.shutdown();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
