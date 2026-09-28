import type { ActionImplementationHandler } from "../0_interfaces/3_controllers/DomainControllerActionHost";

/**
 * #341: library implementations of Miroir actions, by `inMemoryImplementationFunctionName`.
 * An Endpoint action definition refers to one of these through
 * `actionImplementation: { actionImplementationType: "libraryImplementation", ... }`,
 * as TransformerDefinitions do with `inMemoryTransformerImplementations`.
 */
export const miroirActionImplementations: Record<string, ActionImplementationHandler> = {
  handleAction_prepareOpenApiDocument: (host, action) => host.handlePrepareOpenApiDocument(action),
};
