// Child process of the #409 server probe: mounts the CopilotKit route on a fake app from the
// TypeScript source (type stripping), records whether a router was mounted, then exits.
import { mountCopilotKitRoute } from "../../src/mountCopilotKitRoute.ts";

const scenario = JSON.parse(process.env.MIROIR_PROBE_SCENARIO ?? "{}");
const mounted = [];
const app = { use: (path, ...handlers) => mounted.push({ path, handlers: handlers.length }) };

const result = await mountCopilotKitRoute(app, {
  capabilities: scenario.capabilities,
  domainController: {},
  applicationDeploymentMap: {},
  mcpHttpUrl: "http://127.0.0.1:1/mcp",
});
process.stdout.write(`probe-mounted:${result}:${mounted.map((m) => m.path).join(",")}\n`);
process.exit(0);
