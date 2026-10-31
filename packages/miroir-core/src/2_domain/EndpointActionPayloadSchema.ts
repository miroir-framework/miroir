import type { ZodTypeAny } from "zod";

import { deployment_Miroir } from "miroir-app-admin";
import { defaultMiroirMetaModel } from "miroir-app-miroir";

import type {
  MlElement,
  MlReference,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { mlToZodTextAndZodSchema } from "../1_core/mls/mlJzodAdapter";
import { resolveMlSchemaReferenceInContext } from "../1_core/mls/mlsResolveSchemaReferenceInContext";
import type { EndpointActionEntry } from "./EndpointActionCatalog";
import { resolveFundamentalSchemaForDeployment } from "./schemaForDeployment";

// ################################################################################################
// #627: payload validation shared by every surface of the endpoint action catalog (MCP tools,
// CLI commands, CopilotKit actions and its REST route). `executeEndpointAction` assumes a payload
// already validated against `entry.payload`; `validateEndpointActionPayload` is that check.
// ################################################################################################

/**
 * Depth past which payload schemas are accepted as `any`: the meta-model is recursive
 * (mlElement, compositeAction, transformers, …), and payloads that reach the transformer unions
 * would otherwise expand into a schema tree too big for memory. The DomainController checks the
 * values below it.
 */
export const ENDPOINT_ACTION_PAYLOAD_VALIDATION_MAX_DEPTH = 12;

type ResolutionOptions = { resolvingRefs?: Set<string>; depth?: number; maxDepth?: number };
type NormalizedResolutionOptions = { resolvingRefs: Set<string>; depth: number; maxDepth: number };

function normalizeResolutionOptions(options?: ResolutionOptions): NormalizedResolutionOptions {
  return {
    resolvingRefs: options?.resolvingRefs ?? new Set<string>(),
    depth: options?.depth ?? 0,
    maxDepth: options?.maxDepth ?? ENDPOINT_ACTION_PAYLOAD_VALIDATION_MAX_DEPTH,
  };
}

function schemaReferenceKey(ref: MlReference): string {
  const definition = ref.definition as { absolutePath?: string; relativePath?: string };
  return `${definition.absolutePath ?? ""}#${definition.relativePath ?? ""}`;
}

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
  conversionOptions?: ResolutionOptions,
): MlElement {
  if (!element || typeof element !== "object") {
    return element;
  }

  const options = normalizeResolutionOptions(conversionOptions);
  if (options.depth >= options.maxDepth) {
    return unresolvedMlAny(element);
  }

  const childOptions: ResolutionOptions = {
    ...options,
    depth: options.depth + 1,
  };

  if (element.type === "schemaReference") {
    const ref = element as MlReference;
    const refKey = schemaReferenceKey(ref);
    if (options.resolvingRefs.has(refKey)) {
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
            defaultMiroirMetaModel,
            "static",
          ),
          endpointsByUuid: {},
          currentModel: defaultMiroirMetaModel,
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

/**
 * The Zod schema of an Endpoint action payload, with schema references resolved (cyclic ones and
 * those past `maxDepth` become `any`) and dates accepted as strings, as JSON callers send them.
 */
export function endpointActionPayloadZodSchema(
  payload: MlElement,
  maxDepth: number = ENDPOINT_ACTION_PAYLOAD_VALIDATION_MAX_DEPTH,
): ZodTypeAny {
  const resolved = resolveAllReferences(payload, { maxDepth });
  return mlToZodTextAndZodSchema(resolved, undefined, undefined, { datesAsString: true }).zodSchema;
}

const payloadZodSchemaCache = new WeakMap<object, ZodTypeAny>();

/** `endpointActionPayloadZodSchema` of `entry.payload`, built once per payload schema. */
export function endpointActionEntryZodSchema(entry: EndpointActionEntry): ZodTypeAny {
  const key = entry.payload as object;
  let schema = payloadZodSchemaCache.get(key);
  if (!schema) {
    schema = endpointActionPayloadZodSchema(entry.payload as MlElement);
    payloadZodSchemaCache.set(key, schema);
  }
  return schema;
}

export type EndpointActionPayloadValidation =
  | { valid: true; payload: unknown }
  | { valid: false; message: string };

/** Checks `payload` against the entry's payload schema; `message` lists each issue with its path. */
export function validateEndpointActionPayload(
  entry: EndpointActionEntry,
  payload: unknown,
): EndpointActionPayloadValidation {
  const parsed = endpointActionEntryZodSchema(entry).safeParse(payload);
  if (parsed.success) {
    return { valid: true, payload: parsed.data };
  }
  return {
    valid: false,
    message: parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; "),
  };
}
