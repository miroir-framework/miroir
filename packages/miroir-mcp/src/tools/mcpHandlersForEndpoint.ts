import { type ZodTypeAny } from "zod";

import {
  type Action2ReturnType,
  MlElement,
  MlReference,
  LoggerInterface,
  MiroirLoggerFactory,
  resolveFundamentalSchemaForDeployment,
  resolveMlSchemaReferenceInContext,
  getEndpointActions,
  redactCredentialSecretsFromValue,
  type EndpointDefinition,
  type MetaModel,
  type SelfApplication,
  mlToZodTextAndZodSchema,
} from "miroir-core";
import { defaultMiroirMetaModel,  } from "miroir-app-miroir";
import { deployment_Miroir } from "miroir-app-admin";
import { mlElementToJsonSchema } from "./mlElementToJsonSchema.js";
import {
  isMlConversionLimitReached,
  normalizeMlConversionOptions,
  schemaReferenceKey,
  type MlConversionOptions,
} from "./mlConversionContext.js";


const packageName = "miroir-mcp";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", "mcpHandlersForEndpoint");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});


/**
 * Helper function to convert a ML payload schema to a Zod schema
 * Recursively resolves all schema references before conversion to avoid reference resolution errors
 * @param mlPayload - The ML schema definition from actionParameters.payload
 * @returns The Zod schema for validation
 */
// function mlPayloadToZodSchema(mlPayload: MlObject): ZodTypeAny {
function mlPayloadToZodSchema(mlPayload: MlElement): ZodTypeAny {
  // Resolve references for Zod conversion, but stop on cycles / depth — the meta-model is
  // recursive (mlElement, compositeAction, coreTransformerForBuildPlusRuntime, …).
  // The depth cap keeps payloads that reach the transformer unions (query templates, action sequences) from expanding
  // into a schema tree too big for memory: below it, values are accepted as `any` and the DomainController checks them.
  const resolvedMlSchema = resolveAllReferences(mlPayload, { maxDepth: MCP_PAYLOAD_VALIDATION_MAX_DEPTH });

  log.debug("mlPayloadToZodSchema resolved schema for MCP payload conversion");

  return mlToZodTextAndZodSchema(resolvedMlSchema, undefined, undefined, { datesAsString: true }).zodSchema;
}

export const MCP_PAYLOAD_VALIDATION_MAX_DEPTH = 12;

/**
 * `any` in place of a schema left unresolved; it keeps the element's own optional / nullable flags, or a cut optional
 * attribute (e.g. a transformer's `label`) would become required.
 */
function unresolvedMlAny(element?: MlElement): MlElement {
  return {
    type: "any",
    ...(element?.optional ? { optional: true } : {}),
    ...(element?.nullable ? { nullable: true } : {}),
  } as MlElement;
}

/**
 * Recursively resolves schema references in a ML element for Zod validation.
 * Cyclic references degrade to `any` instead of overflowing the stack.
 */
function resolveAllReferences(
  element: MlElement,
  conversionOptions?: MlConversionOptions,
): MlElement {
  if (!element || typeof element !== "object") {
    return element;
  }

  const options = normalizeMlConversionOptions(conversionOptions);
  if (options.depth >= options.maxDepth) {
    return unresolvedMlAny(element);
  }

  const childOptions: MlConversionOptions = {
    ...options,
    depth: options.depth + 1,
  };

  if (element.type === "schemaReference") {
    const ref = element as MlReference;
    const refKey = schemaReferenceKey(ref);
    if (isMlConversionLimitReached(options, refKey)) {
      return unresolvedMlAny(element);
    }

    options.resolvingRefs.add(refKey);
    try {
      const resolvedSchema = resolveMlSchemaReferenceInContext(
        ref,
        ref.context || {},
        {
          miroirFundamentalMlSchema: resolveFundamentalSchemaForDeployment(
            deployment_Miroir.uuid,
            defaultMiroirMetaModel as any as MetaModel,
            "static",
          ),
          endpointsByUuid: {},
          currentModel: defaultMiroirMetaModel as any as MetaModel,
        },
      );
      const resolved = resolveAllReferences(resolvedSchema, childOptions);
      // the reference's own optional / nullable flags apply to what it resolves to
      return {
        ...resolved,
        ...(ref.optional ? { optional: true } : {}),
        ...(ref.nullable ? { nullable: true } : {}),
      } as MlElement;
    } finally {
      options.resolvingRefs.delete(refKey);
    }
  }

  if (element.type === "object" && element.definition) {
    // `extend` holds schema references too (e.g. query payloads extend `shippingBox`): the Zod conversion gets no
    // reference context, so the extended attributes are inlined, and an extension cut by the depth limit is dropped.
    const { extend, ...withoutExtend } = element;
    const resolvedExtensions = (extend === undefined ? [] : Array.isArray(extend) ? extend : [extend]).map(
      (extension) => resolveAllReferences(extension as MlElement, childOptions),
    );
    const extensions = resolvedExtensions.filter((extension) => extension.type === "object" && extension.definition);
    return {
      ...withoutExtend,
      // the attributes of a dropped extension are unknown here: accept them
      ...(extensions.length < resolvedExtensions.length ? { nonStrict: true } : {}),
      definition: Object.fromEntries(
        [
          ...extensions.flatMap((extension) => Object.entries((extension as any).definition)),
          ...Object.entries(element.definition),
        ].map(([key, value]) => [key, resolveAllReferences(value as any, childOptions)]),
      ),
    };
  }

  if (element.type === "array" && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition, childOptions),
    };
  }

  if (element.type === "union" && element.definition && Array.isArray(element.definition)) {
    return {
      ...element,
      definition: element.definition.map((member: any) =>
        resolveAllReferences(member, childOptions),
      ),
    };
  }

  if (element.type === "record" && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition, childOptions),
    };
  }

  if (element.type === "tuple" && element.definition && Array.isArray(element.definition)) {
    return {
      ...element,
      definition: element.definition.map((member: any) =>
        resolveAllReferences(member, childOptions),
      ),
    };
  }

  if (element.type === "intersection" && element.definition) {
    const intersection = element.definition as { left?: MlElement; right?: MlElement };
    return {
      ...element,
      definition: {
        left: intersection.left
          ? resolveAllReferences(intersection.left, childOptions)
          : unresolvedMlAny(),
        right: intersection.right
          ? resolveAllReferences(intersection.right, childOptions)
          : unresolvedMlAny(),
      },
    } as MlElement;
  }

  if (element.type === "lazy" && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition as MlElement, childOptions),
    } as MlElement;
  }

  return element;
}

function mcpTextResult(subObject: Record<string, any>): McpTextResult {
  const redactedSubObject = redactCredentialSecretsFromValue(subObject) as Record<string, any>;
  return {
    content: [
      {
        type: "text",
        parsed: redactedSubObject,
        text: JSON.stringify(redactedSubObject, null, 2),
      },
    ],
  };
}

export type McpTextResult = { content: Array<{ type: string; text: string; parsed: Record<string, any> }> };

/**
 * Validates a tool's arguments against its payload schema, runs `execute` on the validated payload,
 * and formats the result for MCP, with credential secrets redacted. `execute` is where the action
 * runs (the endpoint action catalog's executor, #627).
 */
export async function handleMcpAction(
  toolName: string,
  params: unknown,
  schema: ZodTypeAny,
  execute: (validatedParams: any) => Promise<Action2ReturnType>,
): Promise<McpTextResult> {
  try {
    log.info(`${toolName} - received params:`, JSON.stringify(redactCredentialSecretsFromValue(params), null, 2));
    const parsedParams = schema.safeParse(params);
    if (!parsedParams.success) {
      const message = parsedParams.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      log.info(`${toolName} - validation failed:`, message);
      return mcpTextResult({ status: "error", action: toolName, error: { type: "validation_error", message } });
    }
    const result = await execute(parsedParams.data);
    log.info(`${toolName} - result:`, JSON.stringify(redactCredentialSecretsFromValue(result), null, 2));
    if (result.status === "ok") {
      return mcpTextResult({
        status: "success",
        action: toolName,
        result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
      });
    }
    return mcpTextResult({
      status: "error",
      action: toolName,
      error: {
        type: "errorType" in result ? result.errorType : "unknown",
        message: "errorMessage" in result ? result.errorMessage : "Action failed",
        stack: "errorStack" in result ? result.errorStack : undefined,
        context: "errorContext" in result ? result.errorContext : undefined,
      },
    });
  } catch (error) {
    log.error(`${toolName} - exception:`, error);
    return mcpTextResult({
      status: "error",
      action: toolName,
      error: { type: "validation_error", message: error instanceof Error ? error.message : String(error) },
    });
  }
}

// ################################################################################################
// Tool to schema and action mapping
// ################################################################################################
export type McpToolDescriptionPropertyObject = {
  type: "object";
  description?: string;
  properties: Record<string, McpToolDescriptionProperty>;
  required: string[];
  additionalProperties?: boolean;
  /** Shared definitions when ML schemaReferences are emitted as `$ref` (#248). */
  $defs?: Record<string, unknown>;
};

export type McpToolDescriptionPropertyRef = {
  $ref: string;
  $defs?: Record<string, unknown>;
};

export type McpToolDescriptionPropertyArray = {
  type: "array";
  description?: string;
  items: McpToolDescriptionProperty;
};
export type McpToolDescriptionPropertyString = {
      type: "string";
      description: string;
      enum?: string[];
    }
export type McpToolDescriptionProperty =
  | McpToolDescriptionPropertyString
  | McpToolDescriptionPropertyObject
  | McpToolDescriptionPropertyArray
  | McpToolDescriptionPropertyRef;

  export type McpToolDescription = {
  name: string;
  description?: string;
  /** JSON Schema for tool args; may be a root object or a root `$ref` with `$defs` (#248). */
  inputSchema: McpToolDescriptionPropertyObject | McpToolDescriptionPropertyRef;
};

export type McpRequestHandler<T extends McpToolDescription> = {
  mcpToolDescription: T;
  payloadZodSchema: ZodTypeAny;
  actionLabel: string;
};

// ################################################################################################
/** The MCP description and payload validator of one endpoint action. */
export function mcpToolEntry(
  endpoint: EndpointDefinition,
  actionType: string,
  toolName: string,
): McpRequestHandler<any> {
  const actionDef = getEndpointActions(endpoint)?.find(
    (action: any) => action.actionParameters.actionType.definition === actionType
  );
  if (!actionDef) {
    throw new Error(`Action definition not found for action type: ${actionType}`);
  }
  if (!actionDef.actionParameters.payload) {
    throw new Error(`Payload definition not found for action type: ${actionType}`);
  }
  const mlPayload = actionDef.actionParameters.payload;
  const actionDescription = actionDef.actionParameters.actionType.tag?.value?.description
    || actionDef.actionParameters.actionType.tag?.value?.defaultLabel
    || `Execute ${actionType} action on ${endpoint.name || endpoint.uuid}`;

  log.debug(`Creating MCP tool ${toolName} for action ${actionType} on endpoint ${endpoint.name}`);

  let payloadZodSchema: ZodTypeAny | undefined;
  return {
    mcpToolDescription: {
      name: toolName,
      description: actionDescription,
      inputSchema: mlElementToJsonSchema(mlPayload) as McpToolDescriptionPropertyObject,
    },
    get payloadZodSchema() {
      if (!payloadZodSchema) {
        payloadZodSchema = mlPayloadToZodSchema(mlPayload);
      }
      return payloadZodSchema;
    },
    actionLabel: `MCP: ${actionType.replace(/([A-Z])/g, " $1").trim()}`,
  };
}
