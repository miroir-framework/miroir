// Child process of the #409 module-load probe: builds the CopilotKit router from the built
// miroir-ai package, optionally sends one agent request, then exits.
import { createServer } from "node:http";
import express from "express";
import { registerSecrets } from "miroir-core";
import { createCopilotKitRouter } from "miroir-ai";

const scenario = JSON.parse(process.env.MIROIR_PROBE_SCENARIO ?? "{}");
registerSecrets(scenario.secrets ?? {});

const router = createCopilotKitRouter({}, {}, {
  capabilities: scenario.capabilities,
  mcpHttpUrl: "http://127.0.0.1:1/mcp",
  nodeVersion: "22.13.0",
  createCopilotRuntime: () => ({ probeRuntime: true }),
  copilotRuntimeNodeHttpEndpoint: () => async (_req, res) => {
    res.status(200).json({ ok: true });
  },
});

if (scenario.request !== undefined) {
  const app = express();
  app.use(express.json());
  app.use(router);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "agent/run",
      body: { forwardedProps: { aiConfig: { backend: scenario.request } } },
    }),
  });
  process.stdout.write(`probe-status:${response.status}\n`);
  await new Promise((resolve) => server.close(resolve));
}
process.exit(0);
