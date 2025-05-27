import {
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  JzodReference,
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

// export const miroirFundamentalJzodSchema2 = miroirFundamentalJzodSchema;
// import { miroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Jzod")
).then((logger: LoggerInterface) => {log = logger});



export interface ResolvedJzodSchemaReturnTypeOK {
  status: "ok",
  element: JzodElement
}
export interface ResolvedJzodSchemaReturnTypeError {
  status: "error",
  error: string
}
export type ResolvedJzodSchemaReturnType = ResolvedJzodSchemaReturnTypeError | ResolvedJzodSchemaReturnTypeOK;

// ################################################################################################
export function resolveObjectExtendClauseAndDefinition(
  jzodObject: JzodObject,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): JzodObject {
  // if (j.type == "object") {
    if (jzodObject.extend) {
      // const extension = resolveJzodSchemaReferenceInContext(
      const extension:JzodElement = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        jzodObject.extend,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      )
      const resolvedDefinition = Object.fromEntries(
        Object.entries(jzodObject.definition).filter(
          (e:[string, JzodElement]) => e[1].type == "schemaReference"
        ).map(
          (e) => [e[0], resolveJzodSchemaReferenceInContext(
            miroirFundamentalJzodSchema,
            e[1] as JzodReference,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          )]
        )
      );
      if (extension.type == "object") {
        return {
          type: "object",
          definition: {
            ...extension.definition,
            ...jzodObject.definition,
            ...resolvedDefinition
          }
        }
      } else {
        throw new Error(
          "resolveObjectExtendClauseAndDefinition object extend clause schema " +
            JSON.stringify(jzodObject) +
            " is not an object " +
            JSON.stringify(extension)
        );
        // return ({
        //   status: "error",
        //   error: "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
        //       JSON.stringify(jzodSchema) +
        //       " is not an object " +
        //       JSON.stringify(extension)
        // })
      }
    } else {
      return jzodObject
    }
  // } else {
  //   return j;
  // }
}

// ################################################################################################
export const recursivelyUnfoldUnionAndReferences = (
  jzodUnion: JzodUnion,
  expandedReferences: Set<string>,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): ({
  result: JzodElement[],
  expandedReferences: Set<string>,
}) => {
  // TODO: handle case when resolved reference is itself a reference
  // TODO: handle case when resolved reference is itself union with references (is that done?)

  let result: JzodElement[] = jzodUnion.definition
  .filter((a: JzodElement) => a.type != "schemaReference" && a.type != "union");

  // treating references
  const referencesToBeExplored: JzodReference[] = jzodUnion.definition
  .filter((a: JzodElement) => a.type == "schemaReference")
  .filter((a => !expandedReferences.has(a.definition.relativePath as any)))
  ;
  const resolvedReferences: JzodElement[] = referencesToBeExplored.map((a: JzodReference) =>
    resolveJzodSchemaReferenceInContext(
      miroirFundamentalJzodSchema,
      a,
      currentModel,
      miroirMetaModel,
      { ...relativeReferenceJzodContext, ...a.context }
    )
  );

  for (const r of resolvedReferences.filter((a: JzodElement) => a.type != "union") as JzodElement[]) {
    result.push(r);
  }

  
  // treating unions
  const newExpandedReferences = new Set(referencesToBeExplored.map((a: JzodReference) => a.definition.relativePath as string));
  const unionsToBeExplored: JzodUnion[] = [
    ...jzodUnion.definition.filter((a: JzodElement) => a.type == "union") as JzodUnion[],
    ...resolvedReferences.filter((a: JzodElement) => a.type == "union") as JzodUnion[]];

  log.info(
    "recursivelyUnfoldUnionAndReferences called for union",
    jzodUnion,
    "found references to be explored",
    referencesToBeExplored,
    "resolvedReferences",
    resolvedReferences,
    "unionsToBeExplored",
    unionsToBeExplored,
  );
  for (const r of unionsToBeExplored) {
    const {result: subResult, expandedReferences: subExpandedReferences} = recursivelyUnfoldUnionAndReferences(
      r as JzodUnion,
      newExpandedReferences,
      miroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      relativeReferenceJzodContext
    );
    for (const s of subResult) {
      result.push(s);
    }
    subExpandedReferences.forEach(ref => newExpandedReferences.add(ref));
  }
  return {
    result,
    expandedReferences: newExpandedReferences,
  }
}

// ################################################################################################
export function unionChoices (
  concreteUnrolledJzodSchemas: JzodElement[],
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
) {
  return concreteUnrolledJzodSchemas
    .filter((j) => j.type == "object")
    .concat(
      (
        concreteUnrolledJzodSchemas.filter(
          (j: JzodElement): boolean => j.type == "union"
        ) as JzodUnion[]
      ).flatMap(
        (j: JzodUnion): JzodObject[] =>
          (j.definition.filter((k: JzodElement) => k.type == "object") as JzodObject[]).map(
            (k: JzodObject): JzodObject =>
              resolveObjectExtendClauseAndDefinition(
                k,
                miroirFundamentalJzodSchema,
                currentModel,
                miroirMetaModel,
                relativeReferenceJzodContext
              )
          ) as JzodObject[]
      ),
      (
        concreteUnrolledJzodSchemas.filter((j: JzodElement) => j.type == "union") as JzodUnion[]
      ).flatMap(
        (j: JzodUnion) =>
          (
            (
              j.definition.filter(
                (k: JzodElement) => k.type == "schemaReference"
              ) as JzodReference[]
            )
              .map((k: JzodReference) =>
                resolveJzodSchemaReferenceInContext(
                  miroirFundamentalJzodSchema,
                  k,
                  currentModel,
                  miroirMetaModel,
                  { ...relativeReferenceJzodContext, ...k.context }
                )
              )
              .filter((j) => j.type == "object") as JzodObject[]
          ).map(
            (k: JzodObject): JzodObject =>
              resolveObjectExtendClauseAndDefinition(
                k,
                miroirFundamentalJzodSchema,
                currentModel,
                miroirMetaModel,
                relativeReferenceJzodContext
              )
          ) as JzodObject[]
      )
    )
  ;
}
;

// #####################################################################################################
// #####################################################################################################
export function selectUnionBranchFromDiscriminator(
  objectUnionChoices: JzodObject[],
  discriminator: string | string[],
  valueObject: any,
  // from above:
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
) {
  const discriminators = Array.isArray(discriminator) ? discriminator : [discriminator];
  // let currentDiscriminatedObjectJzodSchemas: JzodObject[] = [];
  // let usedDiscriminator: string | undefined = undefined;

  log.info(
    "selectUnionBranchFromDiscriminator called for union-type value object with discriminator(s)=",
    discriminators,
    "valueObject[discriminator]=",
    discriminators.map(d => valueObject[d]),
    "relativeReferenceJzodContext=",
    JSON.stringify(relativeReferenceJzodContext, null, 2),
    "objectUnionChoices=",
    JSON.stringify(objectUnionChoices, null, 2),
    // JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
  );

  // "flatten" object hierarchy, if there is an extend clause, we resolve it
  let found = objectUnionChoices.map(
    (jzodObjectSchema) => {
      let extendedJzodSchema: JzodObject
      if (jzodObjectSchema.extend) {
        const extension = resolveJzodSchemaReferenceInContext(
          miroirFundamentalJzodSchema,
          jzodObjectSchema.extend,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
        if (extension.type == "object") {
          extendedJzodSchema = {
            type: "object",
            definition: {
              ...extension.definition,
              ...jzodObjectSchema.definition
            }
          }
        } else {
          throw new Error(
            "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
              JSON.stringify(jzodObjectSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
        }
      } else {
        extendedJzodSchema = jzodObjectSchema
      }
      return extendedJzodSchema;
    }
  );
  let i = 0;
  while (i < discriminators.length && found.length > 1) {
    const disc = discriminators[i];
    found = found.filter(
      (a) =>
        (
          a.type == "object" &&
          a.definition[disc]?.type == "literal" &&
          (a.definition[disc] as JzodLiteral).definition == valueObject[disc]
        ) ||
        (
          a.type == "object" &&
          a.definition[disc]?.type == "enum" &&
          (a.definition[disc] as JzodEnum).definition.includes(valueObject[disc])
        )
    );
    i++;
  }

  log.info(
    "selectUnionBranchFromDiscriminator called for union-type value object with discriminator(s)=",
    discriminators,
    "valueObject[discriminator]=",
    discriminators.map(d => valueObject[d]),
    "found",
    found.length,
    "matches in objectUnionChoices for valueObject=",
    JSON.stringify(valueObject, null, 2),
    "found=",
    found,
    "objectUnionChoices=",
    JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
    // " found objectUnionChoices with transformerType=listPickElement=",
    // JSON.stringify(objectUnionChoices.filter((e:any) => e.definition['transformerType'].definition == "listPickElement")),
  );

  if (found.length == 0) {
    throw new Error(
      "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator(s)=" +
        JSON.stringify(discriminators) +
        " valueObject[discriminator]=" +
        JSON.stringify(discriminators.map(d => valueObject[d])) +
        " found no match!"
    );
  }
  if (found.length > 1) {
    throw new Error(
      "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator(s)=" +
        JSON.stringify(discriminators) +
        " valueObject[discriminator]=" +
        JSON.stringify(discriminators.map(d => valueObject[d])) +
        " found many matches: " +
        found.length +
        "objectUnionChoices=" +
        JSON.stringify(
          objectUnionChoices.map((e) => discriminators.map(d => (e.definition[d] as any)?.definition)),
          null,
          2
        )
    );
  }

  const currentDiscriminatedObjectJzodSchema: JzodObject =
    found[0] as JzodObject;
  return { currentDiscriminatedObjectJzodSchema, currentDiscriminatedObjectJzodSchemas: found };
}

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
export function resolveReferencesForJzodSchemaAndValueObject(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodSchema: JzodElement,
  valueObject: any,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
): ResolvedJzodSchemaReturnType {
  log.info(
    "resolveReferencesForJzodSchemaAndValueObject called for valueObject",
    // JSON.stringify(valueObject, null, 2),
    valueObject,
    "schema",
    // JSON.stringify(jzodSchema, null, 2)
    jzodSchema
  );
  switch (jzodSchema?.type) {
    case "schemaReference": {
      const newContext = {...relativeReferenceJzodContext, ...jzodSchema.context}
      const resultJzodSchema = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        newContext
      );
      // log.info(
      //   "resolveReferencesForJzodSchemaAndValueObject schemaReference resultJzodSchema",
      //   JSON.stringify(resultJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return resolveReferencesForJzodSchemaAndValueObject(
        miroirFundamentalJzodSchema,
        resultJzodSchema,
        valueObject,
        currentModel,
        miroirMetaModel,
        newContext
      );
      break;
    }
    case "object": {
      if ( typeof valueObject != "object") {
        return ({
          status: "error",
          error: "resolveReferencesForJzodSchemaAndValueObject object schema " +
              JSON.stringify(jzodSchema) +
              " for value " +
              JSON.stringify(valueObject)
        })
      }

      let extendedJzodSchema: JzodObject
      if (jzodSchema.extend) {
        const extension = resolveJzodSchemaReferenceInContext(
          miroirFundamentalJzodSchema,
          jzodSchema.extend,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
        if (extension.type == "object") {
          extendedJzodSchema = {
            type: "object",
            definition: {
              ...extension.definition,
              ...jzodSchema.definition
            }
          }
        } else {
          throw new Error(
            "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
              JSON.stringify(jzodSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
          // return ({
          //   status: "error",
          //   error: "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
          //       JSON.stringify(jzodSchema) +
          //       " is not an object " +
          //       JSON.stringify(extension)
          // })
        }
      } else {
        extendedJzodSchema = jzodSchema
      }
      // log.info("resolveReferencesForJzodSchemaAndValueObject object extendedJzodSchema",extendedJzodSchema)

      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(valueObject).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              extendedJzodSchema.definition[e[0]],
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            // log.info("resolveReferencesForJzodSchemaAndValueObject object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              // return resultSchemaTmp;
              log.warn(
                "resolveReferencesForJzodSchemaAndValueObject error on resolving object attribute " +
                  e[0] +
                  " not present in definition of (extend resolved) type " +
                  JSON.stringify(extendedJzodSchema) +
                  " valueObject " +
                  JSON.stringify(valueObject) +
                  " found error: " + resultSchemaTmp.error
              );
              return [e[0],{ type: "never" }]
            }
          } else {
            // TODO: RETURN AN ERROR ResolvedJzodSchemaReturnTypeError
            log.warn({
              error: "resolveReferencesForJzodSchemaAndValueObject error on resolving object, valueObject attribute " +
                e[0] +
                " not present in definition of type " +
                JSON.stringify(extendedJzodSchema) +
                " valueObject " + 
                JSON.stringify(valueObject)
            })
            return [e[0],{ type: "never" }]
          }
        } 
      );
      // log.info("resolveReferencesForJzodSchemaAndValueObject object resolved entries result",resolvedObjectEntries)

      // TODO: inheritance!!!
      const resultElement = {
        ...extendedJzodSchema,
        definition: Object.fromEntries(resolvedObjectEntries),
      } as JzodElement;
      // log.info("resolveReferencesForJzodSchemaAndValueObject object result", JSON.stringify(result, null, 2))
      return {status: "ok", element: resultElement};
      break;
    }
    case "union":{
      const concreteUnrolledJzodSchemas: JzodElement[] = recursivelyUnfoldUnionAndReferences(
        jzodSchema,
        new Set(),
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      ).result;

      // log.info(
      //   "resolveReferencesForJzodSchemaAndValueObject called for union",
      //   "concreteUnrolledJzodSchemas resolved type:",
      //   JSON.stringify(concreteUnrolledJzodSchemas, null, 2)
      // );
      switch (typeof valueObject) {
        case "string": {
          // TODO: the following line may introduce some non-determinism, in the case many records actually match the "find" predicate! BAD!
          const resultJzodSchema = concreteUnrolledJzodSchemas.find(
            (a) =>
              (a.type == "string") ||
              (a.type == "literal" && a.definition == valueObject)
          );
          if (resultJzodSchema) {
            // log.info("resolveReferencesForJzodSchemaAndValueObject found for union string returning type: " + JSON.stringify(resultJzodSchema, null, 2));
            return { status: "ok", element: resultJzodSchema}
          } else {
            return {
              status: "error",
              error:
                "resolveReferencesForJzodSchemaAndValueObject could not find string or literal type for value" +
                valueObject +
                " in resolved union " +
                JSON.stringify(concreteUnrolledJzodSchemas, null, 2),
            };
          }
          break;
        }
        case "object": {
          // value is an object, type is a union, if many options are possible we shall use a discriminator
          const discriminator = jzodSchema.discriminator??"_undefined_"

          /**
           * resolve type for object, either:
           * - only 1 object type is possible, or
           * - there is a discriminator and there is only 1 possible union branch for the valueObject[discriminator]
           * - there are several discriminators for the union (and / or subunions, 1 level) and exactly 1 possible union branch match of valueObject[discriminators[index]] for any index.
           * - subUnions are supported, but only 1 level deep, and schemaReferences must refer to an object type.
           */
          const objectUnionChoices = unionChoices(
            concreteUnrolledJzodSchemas,
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );

          log.info(
            "resolveReferencesForJzodSchemaAndValueObject called for union-type value object found",
            objectUnionChoices.length,
            "discriminator=",
            discriminator,
            "concreteUnrolledJzodSchemas",
            concreteUnrolledJzodSchemas,
            "found object branches in the union",
            JSON.stringify(objectUnionChoices, null, 2),
            "valueObject",
            JSON.stringify(valueObject, null, 2),
            // objectUnionChoices,
            // "possible object branches=",
            // // JSON.stringify(objectUnionChoices.map(e => (e as any).definition[discriminator].definition), null, 2)
          );

          // if there is only one object candidate, use this one
          if (objectUnionChoices.length == 1) {
            // only possible object choice, no need for a discriminator
            const subElementSchema = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              objectUnionChoices[0],
              valueObject,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            );
            return subElementSchema;
          }
          
          var {
            currentDiscriminatedObjectJzodSchema,
            currentDiscriminatedObjectJzodSchemas,
          }: {
            currentDiscriminatedObjectJzodSchema: JzodObject;
            currentDiscriminatedObjectJzodSchemas: JzodObject[];
          } = selectUnionBranchFromDiscriminator(
            objectUnionChoices,
            discriminator,
            valueObject,
            // to resolve the extend clause of the object schema:
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );


          const objectJzodSchemaDefintion = Object.fromEntries(
            Object.entries(valueObject).map((a: [string, any]) => {
              const foundAttributeJzodSchema = (currentDiscriminatedObjectJzodSchema?.definition ?? ({} as any))[a[0]];
              log.info(
                "resolveReferencesForJzodSchemaAndValueObject for union called on object attribute '"+
                a[0] +
                "' found schema:" + JSON.stringify(foundAttributeJzodSchema, null, 2)
              );
              if (foundAttributeJzodSchema) {
                const subSchema = resolveReferencesForJzodSchemaAndValueObject(
                  miroirFundamentalJzodSchema,
                  foundAttributeJzodSchema,
                  a[1],
                  currentModel,
                  miroirMetaModel,
                  relativeReferenceJzodContext
                );
                if (subSchema.status == "ok") {
                  // log.info(
                  //   "resolveReferencesForJzodSchemaAndValueObject returning for union object attribute '" +
                  //   a[0] +
                  //   "' schema:", JSON.stringify(subSchema, null, 2)
                  // );
                  return [a[0], subSchema.element];
                } else {
                  log.warn(
                    "resolveReferencesForJzodSchemaAndValueObject union object could not resovle type for attribute '" +
                    a[0] +
                    "' error:", JSON.stringify(subSchema, null, 2)
                  );
                  return [a[0], { type: "never" } as JzodElement];
                }
              } else {
                log.warn(
                  "resolveReferencesForJzodSchemaAndValueObject union object could not find schema for attribute '" +
                  a[0] +
                  "' object Schema:", JSON.stringify(currentDiscriminatedObjectJzodSchema, null, 2)
                );
                return [a[0], { type: "never" } as JzodElement];
              }
            })
          );

          if (currentDiscriminatedObjectJzodSchemas) {
            return { status: "ok", element: { type: "object", definition: objectJzodSchemaDefintion } };
          } else {
            return {
              status: "error",
              error:
                "resolveReferencesForJzodSchemaAndValueObject could not find string type in resolved union " +
                JSON.stringify(concreteUnrolledJzodSchemas, null, 2),
            };
          }
        }
        case "number":
        case "bigint":
        case "boolean":
        case "function":
        case "symbol": // TODO: what does this correspond to?
        case "undefined":
        default: {
          throw new Error("resolveReferencesForJzodSchemaAndValueObject could not resolve type for union with valueObject " + valueObject);
          break;
        }
      }     
      // break;
    }
    case "record": {
      if ( typeof valueObject != "object") {
        throw new Error(
          "resolveReferencesForJzodSchemaAndValueObject object schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject)
        );
      }
      const definition: {[k:string]: JzodElement} = Object.fromEntries(
        Object.entries(valueObject).map(
          (e: [string, any]) => {
            const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              jzodSchema.definition,
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              log.warn(
                "resolveReferencesForJzodSchemaAndValueObject record could not find schema for attribute '" +
                e[0] +
                "' error:", JSON.stringify(resultSchemaTmp, null, 2)
              );
              return [e[0],{ type: "never" }]
            }
          }
        ) as [string, JzodElement][]
      );
      // log.info("resolveReferencesForJzodSchemaAndValueObject record, converting to object definition", JSON.stringify(definition, null, 2))
      return {status: "ok", element: { type: "object", definition } };
    }
    case "literal": {
      if (valueObject == jzodSchema.definition)  {
        return { status: "ok", element: jzodSchema };
      } else {
        return {
          status: "error",
          error:
            "resolveReferencesForJzodSchemaAndValueObject could not find literal type in resolved union " +
            JSON.stringify(valueObject, null, 2) +
            " jzodSchema=" +
            JSON.stringify(jzodSchema, null, 2),
        };
      }
      break;
    }
    case "enum": {
      return { status: "ok", element: jzodSchema };
    }
    case "tuple": {
      return {
        status: "error",
        error: "resolveReferencesForJzodSchemaAndValueObject can not handle tuple schema " +
        JSON.stringify(jzodSchema) +
        " for value " +
        JSON.stringify(valueObject)
      }
      break;
    }
    case "array": {
      if ( !Array.isArray(valueObject)) {
        return {
          status: "error",
          error: "resolveReferencesForJzodSchemaAndValueObject array schema " +
          JSON.stringify(jzodSchema) +
          " for value " +
          JSON.stringify(valueObject)
        }
      }
      const innerSchema = jzodSchema.definition.type == "schemaReference"?
        resolveJzodSchemaReferenceInContext(
          miroirFundamentalJzodSchema,
          jzodSchema.definition,
          currentModel,
          miroirMetaModel,
          {...relativeReferenceJzodContext, ...jzodSchema.definition.context}
        )
      : jzodSchema.definition
      ;

      // log.info("resolveReferencesForJzodSchemaAndValueObject called resolveJzodSchemaReferenceInContext for array found innerSchema", JSON.stringify(innerSchema, null, 2));

      if (innerSchema.type != "union") {
        return { status: "ok", element: { type: "array", definition: innerSchema } }
      }

      // innerSchema is a union type, we have to unfold each element to its own type and return a tuple type
      const result: JzodElement[] = valueObject.map(
        (e:any) => {
          const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
            miroirFundamentalJzodSchema,
            innerSchema,
            e,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          )
          if (resultSchemaTmp.status == "ok") {
              return resultSchemaTmp.element
          } else {
            log.warn(
              "resolveReferencesForJzodSchemaAndValueObject record could not find schema for array element '" +
              e +
              "' error:", JSON.stringify(resultSchemaTmp, null, 2)
            );
            return { type: "never" }
          }
        }
      );

      return { status: "ok", element: { type: "tuple", definition: result } }
      // if (jzodSchema.definition.type == "schemaReference") {
      //   // TODO: for now, we take the type of the first array element, for union types this should be a tuple of effective types!
      //   const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
      //     miroirFundamentalJzodSchema,
      //     jzodSchema.definition,
      //     valueObject[0],
      //     currentModel,
      //     miroirMetaModel,
      //     relativeReferenceJzodContext
      //   )
      //   // return resultSchemaTmp;
      //   if (resultSchemaTmp.status == "ok") {
      //     if (resultSchemaTmp.element.type == "union") {
      //       // union type, we have to unfold each element to its own type and return a tuple type
          
      //     }
      //     return { status: "ok", element: { type: "array", definition: resultSchemaTmp.element } }
      //   } else {
      //     // return resultSchemaTmp;
      //     return resultSchemaTmp;
      //   }

        
      // } else {
      //   return {status: "ok", element: jzodSchema};
      // }
      break;
    }
    // plain Attributes
    case "uuid":
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "undefined":
    case "any":
    case "date":
    case "never":
    case "null":
    case "unknown":
    case "void":
    // other schema types
    case "intersection":
    case "promise":
    case "set":
    case "function":
    case "map":
    // case "simpleType":
    case "lazy": {
      return {status: "ok", element: jzodSchema}
    }
    default: {
      throw new Error(
        "resolveReferencesForJzodSchemaAndValueObject could not resolve schemaReferences for valueObject " +
          JSON.stringify(valueObject, undefined, 2) +
          " and schema " +
          JSON.stringify(jzodSchema)
      );
      break;
    }
  }

}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function resolveJzodSchemaReferenceInContext(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodReference: JzodReference | JzodObject | (JzodReference | JzodObject | undefined)[],
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
): JzodElement {
  if (Array.isArray(jzodReference)) {
    // Aggregate resolved items into an object with keys as indices
    const resolvedItems = jzodReference.map((ref, idx) => {
      if (ref === undefined) return undefined;
      return resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        ref,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
    });
    // If all items are objects with a definition, merge them into one object
    if (resolvedItems.every(item => item && item.type === "object" && typeof item.definition === "object")) {
      const mergedDefinition = Object.assign(
        {},
        ...resolvedItems.map(item => (item as JzodObject).definition)
      );
    return { type: "object", definition: mergedDefinition };
    } else {
      throw new Error(
        "resolveJzodSchemaReferenceInContext can not handle array of references with mixed types or non-object definitions: " +
          JSON.stringify(resolvedItems)
      );
    }
  }
  if (jzodReference.type == "object") {
    throw new Error(
      "resolveJzodSchemaReferenceInContext can not handle object reference " +
        JSON.stringify(jzodReference)
    );
  }
  if ((!jzodReference.definition || !jzodReference.definition?.absolutePath) && !relativeReferenceJzodContext) {
    throw new Error(
      "resolveJzodSchemaReferenceInContext can not handle complex / unexisting reference " +
        JSON.stringify(jzodReference) +
        " for empty relative reference: " +
        JSON.stringify(relativeReferenceJzodContext)
    );
  }
  log.info(
    "resolveJzodSchemaReferenceInContext called for reference",
    JSON.stringify(jzodReference, null, 2),
  );
  const absoluteReferences = (currentModel
    ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas, ...(miroirMetaModel as any).jzodSchemas] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: { [k: string]: JzodElement } = jzodReference?.definition.absolutePath
    ? absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition
        .context ?? {}
    : relativeReferenceJzodContext ?? jzodReference;

  const targetJzodSchema: JzodElement | undefined = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema[jzodReference?.definition.relativePath]
    : { type: "object", definition: absoluteReferenceTargetJzodSchema };


  log.info(
    "resolveJzodSchemaReferenceInContext for reference",
    "absolutePath",
    jzodReference.definition.absolutePath,
    "relativePath",
    jzodReference.definition.relativePath,
    "relativeReferenceJzodContext",
    Object.keys(relativeReferenceJzodContext??{}),
    "result",
    targetJzodSchema,
  );

  if (!targetJzodSchema) {
    throw new Error(
      "resolveJzodSchemaReferenceInContext could not resolve reference " +
        JSON.stringify(jzodReference.definition) +
        " absoluteReferences keys " +
        JSON.stringify(absoluteReferences.map(r => r.uuid)) +
        " current Model " + Object.keys(currentModel??{}) + 
        " relativeReferenceJzodContext keys " +
        JSON.stringify(relativeReferenceJzodContext)
    );
  }

  return targetJzodSchema;
}


// ################################################################################################
// TODO: redundant to resolveJzodSchemaReferenceInContext, resolveJzodSchemaReference is used only in JzodTools, refactor / merge with resolveJzodSchemaReferenceInContext.
export function resolveJzodSchemaReference(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodReference?: JzodReference,
  currentModel?: MetaModel,
  relativeReferenceJzodContext?: JzodObject | JzodReference,
): JzodElement {
  // const fundamentalJzodSchemas = miroirFundamentalJzodSchema.definition.context
  const absoluteReferences = (currentModel
    // ? (currentModel as any).jzodSchemas
    // : []
    ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: JzodObject | JzodReference | undefined = jzodReference?.definition
    .absolutePath
    ? {
        type: "object",
        definition:
          absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition.context ?? {},
      }
    : relativeReferenceJzodContext ?? jzodReference;
  const targetJzodSchema = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema?.type == "object" && absoluteReferenceTargetJzodSchema?.definition
      ? absoluteReferenceTargetJzodSchema?.definition[jzodReference?.definition.relativePath]
      : absoluteReferenceTargetJzodSchema?.type == "schemaReference" && absoluteReferenceTargetJzodSchema?.context
      ? absoluteReferenceTargetJzodSchema?.context[jzodReference?.definition.relativePath]
      : undefined
    : absoluteReferenceTargetJzodSchema;


  if (!targetJzodSchema) {
    console.error(
      "resolveJzodSchemaReference failed for jzodSchema",
      jzodReference,
      "result",
      targetJzodSchema,
      " absoluteReferences", 
      absoluteReferences,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "currentModel",
      currentModel,
      "rootJzodSchema",
      relativeReferenceJzodContext
    );
    throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(jzodReference) + " absoluteReferences" + absoluteReferences);
  }

  return targetJzodSchema;
}
