import { createHash } from "node:crypto";

export const MCP_TOOL_NAME_MAX_LENGTH = 64;
const MCP_TOOL_NAME_FORBIDDEN_CHARS = /[^a-zA-Z0-9_-]/g;

export function sanitizeToolNamePart(part: string): string {
  return part.replace(MCP_TOOL_NAME_FORBIDDEN_CHARS, "_");
}

/**
 * MCP tool names are limited to 64 chars; truncation appends a hash of the full name so that
 * distinct full names keep distinct truncated names.
 */
export function truncateToolName(name: string): string {
  if (name.length <= MCP_TOOL_NAME_MAX_LENGTH) {
    return name;
  }
  const hash = createHash("md5").update(name).digest("hex").slice(0, 8);
  return `${name.slice(0, MCP_TOOL_NAME_MAX_LENGTH - 9)}_${hash}`;
}

/**
 * Deterministic tool name for one (application, endpoint, action):
 * `<applicationName>_<actionType>`, disambiguated with the endpoint name on collision.
 * `takenNames` must contain the names already attributed in the current enumeration.
 */
export function toolNameFor(
  applicationName: string,
  endpointName: string,
  actionType: string,
  takenNames: Set<string>,
): string {
  const application = sanitizeToolNamePart(applicationName);
  const action = sanitizeToolNamePart(actionType);
  const base = `${application}_${action}`;
  if (!takenNames.has(base)) {
    return truncateToolName(base);
  }
  const endpoint = sanitizeToolNamePart(endpointName);
  const withEndpoint = `${application}_${endpoint}_${action}`;
  let candidate = withEndpoint;
  for (let i = 2; takenNames.has(candidate); i++) {
    candidate = `${withEndpoint}_${i}`;
  }
  return truncateToolName(candidate);
}
