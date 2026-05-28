// Miroir tool definitions for the CopilotKit Runtime.
// Each tool corresponds to a Miroir element type the AI can generate.
// The frontend registers matching useCopilotAction handlers that render
// pre-filled proposal forms for user review before applying.

import { v4 as uuidv4 } from "uuid";
import type { Action, Parameter } from "@copilotkit/shared";

import {
  Action2Error,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  instanceEndpointV1,
  jzodToCopilotKitParameter,
  jzodToJsonSchema,
  miroirFundamentalJzodSchema,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type EndpointDefinition,
  type JzodObject,
  type MiroirModelEnvironment,
} from "miroir-core";
import {
  deployment_Library_DO_NO_USE,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
// Convenience alias for a typed Action with known parameters
type MiroirAction = Action<Parameter[]>;

const defaultLibraryAppModel = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as any,
  defaultMiroirMetaModel,
  instanceEndpointV1 as any as EndpointDefinition,
  {
    ...defaultSelfApplicationDeploymentMap,
    [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  } as ApplicationDeploymentMap,
);


const endpointDefinition: EndpointDefinition[] | undefined =
    defaultLibraryAppModel.currentModel.endpoints.filter((endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de") as EndpointDefinition[]; // lendingEndpoint UUID
  
if (!endpointDefinition || endpointDefinition.length === 0) {
  throw new Error("Lending endpoint definition not found: " + "212f2784-5b68-43b2-8ee0-89b1c6fdd0de");
}

if (!endpointDefinition[0].definition.actions[0].actionParameters.payload) {
  throw new Error("Lending endpoint action parameters not found for endpoint: " + "212f2784-5b68-43b2-8ee0-89b1c6fdd0de");
}

if (endpointDefinition[0].definition.actions[0].actionParameters.payload.type !== "object") {
  throw new Error("Lending endpoint action parameters payload type is not 'object' for endpoint: " + "212f2784-5b68-43b2-8ee0-89b1c6fdd0de");
}

// const lendDocumentActionJzodParameters = Object.entries(endpointDefinition[0].definition.actions[0].actionParameters.payload.definition);
const lendDocumentActionCopilotKitParameters = jzodToCopilotKitParameter(
  "payload",
  endpointDefinition[0].definition.actions[0].actionParameters.payload
).attributes ?? [];

const lendDocumentActionJsonSchema = jzodToJsonSchema(
  endpointDefinition[0].definition.actions[0].actionParameters.payload as JzodObject,
);

const lendDocumentActionJsonSchemaParameters = lendDocumentActionJsonSchema.properties ? Object.entries(lendDocumentActionJsonSchema.properties).map(([key, value]) => ({
  name: key,
  ...value,
})) : [];
// const lendDocumentActionJsonSchemaParameters = lendDocumentActionJzodParameters.map(([key, value]) =>
//     jzodToJsonSchema(
//       value,
//       (endpointDefinition[0].definition.actions[0].actionParameters.payload as JzodObject)
//         .definition,
//     ),
//   )

/**
 * Returns an async executor function for the lendDocument action.
 * Used both by createLendDocumentTool (as the CopilotKit handler) and by the
 * /api/copilotkit/lendDocument REST endpoint (called from the frontend useCopilotAction).
 */
export function createLendDocumentExecutor(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
) {
  // Build a deployment map that is guaranteed to include the library application entry.
  const libraryAwareDeploymentMap: ApplicationDeploymentMap = {
    ...applicationDeploymentMap,
    [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  };

  const libraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
    miroirFundamentalJzodSchema as any,
    defaultMiroirMetaModel,
    undefined as any,
    deployment_Library_DO_NO_USE.uuid,
  );

  return async ({ user, book, startDate, note }: Record<string, any>) => {
    console.log("[lendDocument] executor called with:", { user, book, startDate, note });
    try {
      const action = {
        actionType: "lendDocument",
        actionLabel: "CopilotKit: Lend Document",
        endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        payload: { user, book, startDate, note },
      };
      console.log("[lendDocument] calling domainController.handleAction with action:", JSON.stringify(action));
      const result = await domainController.handleAction(
        action as any,
        libraryAwareDeploymentMap,
        libraryModelEnvironment as any as MiroirModelEnvironment,
      );
      console.log("[lendDocument] handleAction result:", JSON.stringify(result));
      if (result instanceof Action2Error) {
        const msg = `lendDocument failed [${result.errorType}]: ${result.errorMessage ?? "unknown error"}`;
        console.error("[lendDocument]", msg, result);
        return { status: "error", message: msg };
      }
      return { status: "success", summary: "Document lent successfully." };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[lendDocument] unexpected error:", err);
      return { status: "error", message: `Unexpected error: ${msg}` };
    }
  };
}

export function createLendDocumentTool(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): MiroirAction {
  return {
    name: "lendDocument",
    description: endpointDefinition![0].definition.actions[0].actionParameters.actionType?.tag?.value?.description ?? "",
    parameters: lendDocumentActionCopilotKitParameters,
    handler: createLendDocumentExecutor(domainController, applicationDeploymentMap),
  };
}

console.log("lendDocumentTool lendDocumentActionCopilotKitParameters:", JSON.stringify(lendDocumentActionCopilotKitParameters, null, 2));
// console.log("lendDocumentTool lendDocumentActionJsonSchema:", JSON.stringify(lendDocumentActionJsonSchema, null, 2));
// console.log("lendDocumentTool parameters:", JSON.stringify(lendDocumentTool.parameters, null, 2));

// ──────────────────────────────────────────────────────────────────────────────
// Tool: generateMiroirEntity
// Returns both the Entity record and its EntityDefinition.
// ──────────────────────────────────────────────────────────────────────────────
export const generateMiroirEntityTool: MiroirAction = {
  name: "generateMiroirEntity",
  description:
    "Generate a new Miroir Entity (concept/table definition) with its EntityDefinition schema. " +
    "Returns both the Entity record and the EntityDefinition JSON ready to be applied.",
  parameters: [
    {
      name: "entityName",
      type: "string",
      description: "PascalCase name for the new entity (e.g. 'Product', 'CustomerOrder')",
      required: true,
    },
    {
      name: "description",
      type: "string",
      description: "Short description of what this entity represents",
      required: false,
    },
    {
      name: "attributes",
      type: "object[]",
      description: "List of attributes (fields) for this entity. Each item: { name, type, required, description?, enumValues? }",
      required: true,
      attributes: [
        { name: "name", type: "string", required: true },
        { name: "type", type: "string", required: true },
        { name: "required", type: "boolean", required: false },
        { name: "description", type: "string", required: false },
      ],
    },
    {
      name: "deploymentUuid",
      type: "string",
      description: "UUID of the deployment this entity belongs to",
      required: true,
    },
  ],
  handler: async ({ entityName, description, attributes, deploymentUuid }: Record<string, any>) => {
    const entityUuid = uuidv4();
    const entityDefUuid = uuidv4();

    const entity = {
      uuid: entityUuid,
      parentName: "Entity",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      conceptLevel: "Model",
      name: entityName,
      description: description ?? `A ${entityName} instance`,
    };

    // Build mlSchema definition from attributes
    const schemaDefinition: Record<string, any> = {};
    let fieldId = 5;

    // name is always first
    schemaDefinition["name"] = {
      type: "string",
      tag: { value: { id: fieldId++, defaultLabel: "Name", display: { editable: true } } },
    };

    for (const attr of (attributes ?? []) as Array<{
      name: string;
      type: string;
      required?: boolean;
      description?: string;
      enumValues?: string[];
    }>) {
      if (attr.name === "name") continue; // already added above

      const fieldDef: Record<string, any> = {};

      if (attr.type === "enum" && attr.enumValues?.length) {
        fieldDef["type"] = "enum";
        fieldDef["definition"] = attr.enumValues;
      } else {
        fieldDef["type"] = attr.type ?? "string";
      }

      if (!attr.required) {
        fieldDef["optional"] = true;
      }

      fieldDef["tag"] = {
        value: {
          id: fieldId++,
          defaultLabel: attr.description ?? attr.name,
          display: { editable: true },
        },
      };

      schemaDefinition[attr.name] = fieldDef;
    }

    const entityDefinition = {
      uuid: entityDefUuid,
      parentName: "EntityDefinition",
      parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      parentDefinitionVersionUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
      entityUuid,
      conceptLevel: "Model",
      name: entityName,
      mlSchema: {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "entityDefinitionRoot",
          },
        },
        definition: schemaDefinition,
      },
    };

    return {
      entity,
      entityDefinition,
      deploymentUuid,
      summary: `Created Entity '${entityName}' with ${Object.keys(schemaDefinition).length} field(s).`,
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool: generateMiroirQuery
// ──────────────────────────────────────────────────────────────────────────────
export const generateMiroirQueryTool: MiroirAction = {
  name: "generateMiroirQuery",
  description:
    "Generate a new Miroir Query that fetches instances of a given entity. " +
    "Returns a QueryTemplate JSON ready to be applied.",
  parameters: [
    {
      name: "queryName",
      type: "string",
      description: "camelCase name for the query (e.g. 'getAllProducts')",
      required: true,
    },
    {
      name: "description",
      type: "string",
      description: "What data this query returns",
      required: false,
    },
    {
      name: "entityName",
      type: "string",
      description: "Name of the entity to fetch",
      required: true,
    },
    {
      name: "entityUuid",
      type: "string",
      description: "UUID of the entity to fetch",
      required: true,
    },
    {
      name: "deploymentUuid",
      type: "string",
      description: "UUID of the deployment this query belongs to",
      required: true,
    },
  ],
  handler: async ({ queryName, description, entityName, entityUuid, deploymentUuid }: Record<string, any>) => {
    const queryUuid = uuidv4();

    const query = {
      uuid: queryUuid,
      parentName: "QueryTemplate",
      parentUuid: "e48b9e43-6d8a-4c9e-b7f5-3e2c1b4d5a6f",
      name: queryName,
      description: description ?? `Fetch all ${entityName} instances`,
      deploymentUuid,
      definition: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid,
        pageParams: {},
        queryParams: {},
        contextResults: {},
        extractors: {
          [queryName]: {
            extractorOrCombinerType: "extractorForObjectByDirectReference",
            parentName: entityName,
            parentUuid: entityUuid,
            applicationSection: "data",
          },
        },
      },
    };

    return {
      query,
      deploymentUuid,
      summary: `Created Query '${queryName}' fetching ${entityName} instances.`,
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool: generateMiroirTransformer
// ──────────────────────────────────────────────────────────────────────────────
export const generateMiroirTransformerTool: MiroirAction = {
  name: "generateMiroirTransformer",
  description:
    "Generate a new Miroir Transformer definition (pure data transformation function). " +
    "Returns a Transformer JSON ready to be applied.",
  parameters: [
    {
      name: "transformerName",
      type: "string",
      description: "camelCase name for the transformer",
      required: true,
    },
    {
      name: "description",
      type: "string",
      description: "What this transformer does",
      required: true,
    },
    {
      name: "inputDescription",
      type: "string",
      description: "Description of the input data structure",
      required: false,
    },
    {
      name: "deploymentUuid",
      type: "string",
      description: "UUID of the deployment this transformer belongs to",
      required: true,
    },
  ],
  handler: async ({ transformerName, description, inputDescription, deploymentUuid }: Record<string, any>) => {
    const transformerUuid = uuidv4();

    const transformer = {
      uuid: transformerUuid,
      parentName: "Transformer",
      parentUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
      name: transformerName,
      description,
      deploymentUuid,
      definition: {
        transformerType: "transformer",
        transformerImplementationType: "transformer",
        referencedTransformers: [],
        // TODO: Define the actual transformer composition based on description
        // This is a placeholder — the user should complete the transformer definition
        // using the TransformerBuilderPage
      },
    };

    return {
      transformer,
      deploymentUuid,
      summary:
        `Created Transformer stub '${transformerName}'. ` +
        `Note: The transformer logic placeholder needs to be completed in the TransformerBuilder. ` +
        `Input: ${inputDescription ?? "not specified"}.`,
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool: generateMiroirReport
// ──────────────────────────────────────────────────────────────────────────────
export const generateMiroirReportTool: MiroirAction = {
  name: "generateMiroirReport",
  description:
    "Generate a new Miroir Report that displays instances of a given entity in a list/grid. " +
    "Returns a Report JSON ready to be applied.",
  parameters: [
    {
      name: "reportName",
      type: "string",
      description: "PascalCase name for the report (e.g. 'ProductList')",
      required: true,
    },
    {
      name: "description",
      type: "string",
      description: "What this report shows",
      required: false,
    },
    {
      name: "entityName",
      type: "string",
      description: "Name of the entity to display",
      required: true,
    },
    {
      name: "entityUuid",
      type: "string",
      description: "UUID of the entity to display",
      required: true,
    },
    {
      name: "deploymentUuid",
      type: "string",
      description: "UUID of the deployment this report belongs to",
      required: true,
    },
  ],
  handler: async ({ reportName, description, entityName, entityUuid, deploymentUuid }: Record<string, any>) => {
    const reportUuid = uuidv4();
    const extractorName = `get${entityName}List`;

    const report = {
      uuid: reportUuid,
      parentName: "Report",
      parentUuid: "952d2c65-4da2-45c2-9394-a0920ceedfb6",
      name: reportName,
      defaultLabel: description ?? `${entityName} List`,
      description: description ?? `Displays all ${entityName} instances`,
      deploymentUuid,
      definition: {
        reportType: "list",
        fetchQuery: {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          deploymentUuid,
          pageParams: {},
          queryParams: {},
          contextResults: {},
          extractors: {
            [extractorName]: {
              extractorOrCombinerType: "extractorForObjectByDirectReference",
              parentName: entityName,
              parentUuid: entityUuid,
              applicationSection: "data",
            },
          },
        },
        section: {
          type: "objectListReportSection",
          definition: {
            label: `${entityName} List`,
            parentUuid: entityUuid,
            fetchedDataReference: extractorName,
          },
        },
      },
    };

    return {
      report,
      deploymentUuid,
      summary: `Created Report '${reportName}' displaying ${entityName} instances as a list.`,
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool: getMiroirContext
// Read-only tool that provides the LLM with context about existing Miroir elements.
// ──────────────────────────────────────────────────────────────────────────────
export const getMiroirContextTool: MiroirAction = {
  name: "getMiroirContext",
  description:
    "Get the list of existing Miroir entities, queries, and reports in the current deployment. " +
    "Use this BEFORE generating new elements to avoid duplicates and to get correct UUIDs.",
  parameters: [
    {
      name: "deploymentUuid",
      type: "string",
      description: "UUID of the deployment to inspect",
      required: true,
    },
    {
      name: "elementType",
      type: "string",
      description: "Type of elements to list: 'entity', 'query', 'transformer', 'report', or 'all'",
      required: false,
    },
  ],
  handler: async ({ deploymentUuid, elementType }: Record<string, any>) => {
    // This is a stub — the actual context is injected via useCopilotReadable on the frontend.
    // The runtime handler in copilotKitRoute.ts can also inject server-side context here
    // by querying the admin deployment store if needed.
    return {
      note:
        "Context is provided via the frontend readable context. " +
        "Check the system context for the list of existing entities and their UUIDs.",
      deploymentUuid,
      requestedType: elementType ?? "all",
    };
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// All tools exported as an array for use in CopilotRuntime
// ──────────────────────────────────────────────────────────────────────────────
export function createMiroirCopilotKitActions(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): MiroirAction[] {
  return [
    createLendDocumentTool(domainController, applicationDeploymentMap),
    generateMiroirEntityTool,
    generateMiroirQueryTool,
    generateMiroirTransformerTool,
    generateMiroirReportTool,
    getMiroirContextTool,
  ];
}
