import type { Action, EndpointDefinition } from "miroir-core";
import { toolNameFor } from "miroir-mcp/client";

export function resolveMcpToolAction(
  toolName: string,
  applicationName: string,
  endpoints: EndpointDefinition[] | undefined,
): { endpoint: EndpointDefinition; action: Action } | undefined {
  if (!endpoints?.length) {
    return undefined;
  }
  const takenNames = new Set<string>();
  const sortedEndpoints = [...endpoints]
    .filter((endpoint) => endpoint?.uuid && endpoint?.name && endpoint?.definition?.actions)
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
  for (const endpoint of sortedEndpoints) {
    const sortedActions = [...(endpoint.definition.actions ?? [])].sort((left, right) =>
      String(left?.actionParameters?.actionType?.definition).localeCompare(
        String(right?.actionParameters?.actionType?.definition),
      ),
    );
    for (const action of sortedActions) {
      const actionType = action?.actionParameters?.actionType?.definition;
      if (!actionType || !action?.actionParameters?.payload) {
        continue;
      }
      const name = toolNameFor(applicationName, endpoint.name, actionType, takenNames);
      takenNames.add(name);
      if (name === toolName) {
        return { endpoint, action };
      }
    }
  }
  return undefined;
}

export function applicationNameForMcpRunner(
  applicationUuid: string | undefined,
  applications: Array<{ uuid?: string; name?: string }> | undefined,
  fallback = "Miroir",
): string {
  const found = applications?.find((application) => application.uuid === applicationUuid);
  return found?.name ?? fallback;
}
