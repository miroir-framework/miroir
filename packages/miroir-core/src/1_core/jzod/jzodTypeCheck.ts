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
  valuePath: (string | number)[],
  typePath: (string | number)[],
  element: JzodElement
}
export interface ResolvedJzodSchemaReturnTypeError {
  status: "error",
  valuePath: (string | number)[],
  typePath: (string | number)[],
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
        //   error: "jzodTypeCheck object extend clause schema " +
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

  // log.info(
  //   "recursivelyUnfoldUnionAndReferences called for union",
  //   jzodUnion,
  //   "found references to be explored",
  //   referencesToBeExplored,
  //   "resolvedReferences",
  //   resolvedReferences,
  //   "unionsToBeExplored",
  //   unionsToBeExplored,
  // );
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
      ).flatMap( // for sub-unions, return the sub-objects clauses, with their extend clauses resolved
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
      ).flatMap( // if schemaReferences are found, we resolve them, squashing the extend clause for objects
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
  discriminator: string | string[] | undefined,
  valueObject: any,
  valueObjectPath: (string | number)[],
  typePath: (string | number)[], // for logging purposes only
  // from above:
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
): {
  currentDiscriminatedObjectJzodSchema: JzodObject;
  currentDiscriminatedObjectJzodSchemas: JzodObject[];
  chosenDiscriminator: {discriminator: string, value: any}[];
} {
  const discriminators:string | string[] | undefined = !discriminator?discriminator:Array.isArray(discriminator) ? discriminator : [discriminator];
  // let currentDiscriminatedObjectJzodSchemas: JzodObject[] = [];
  // let usedDiscriminator: string | undefined = undefined;


  // "flatten" object hierarchy, if there is an extend clause, we resolve it
  let flattenedUnionChoices = objectUnionChoices.map(
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
            "jzodTypeCheck object extend clause schema " +
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
  log.info(
    "selectUnionBranchFromDiscriminator called for union-type value object with discriminator(s)=",
    discriminators,
    "valueObject[discriminator]=",
    discriminators??[].map(d => valueObject[d]),
    "relativeReferenceJzodContext=",
    JSON.stringify(relativeReferenceJzodContext, null, 2),
    "flattenedUnionChoices=",
    JSON.stringify(flattenedUnionChoices, null, 2),
    // JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
  );
  let i = 0;
  let chosenDiscriminator = [];
  if (!discriminators || discriminators.length == 0) {
    // no discriminator, proceed by eliminating all choices that do not match the valueObject
    flattenedUnionChoices = flattenedUnionChoices.filter((objectChoice) => {
      const objectChoiceKeys = Object.keys(objectChoice.definition);
      return Object.keys(valueObject).every(
        (valueObjectKey) =>
          objectChoiceKeys.includes(valueObjectKey) &&
          (objectChoice.definition[valueObjectKey]?.type != "literal" ||
            objectChoice.definition[valueObjectKey]?.definition == valueObject[valueObjectKey])
      );
    });
    log.info(
      "selectUnionBranchFromDiscriminator called for union-type value object with no discriminator, flattenedUnionChoices=",
      JSON.stringify(flattenedUnionChoices, null, 2),
      "valueObject=",
      JSON.stringify(valueObject, null, 2),
      // "valueObjectPath=",
      // valueObjectPath,
      // "typePath=",
      // typePath
    );
  } else {
    while (i < discriminators.length && flattenedUnionChoices.length > 1) {
      const disc = discriminators[i];
      flattenedUnionChoices = flattenedUnionChoices.filter(
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
      chosenDiscriminator.push({discriminator: disc, value: valueObject[disc]});
      i++;
    }
  }

  // log.info(
  //   "selectUnionBranchFromDiscriminator called for union-type value object with discriminator(s)=",
  //   discriminators,
  //   "valueObject[discriminator]=",
  //   discriminators.map(d => valueObject[d]),
  //   "found",
  //   found.length,
  //   "matches in objectUnionChoices for valueObject=",
  //   JSON.stringify(valueObject, null, 2),
  //   "found=",
  //   found,
  //   "objectUnionChoices=",
  //   JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
  //   // " found objectUnionChoices with transformerType=listPickElement=",
  //   // JSON.stringify(objectUnionChoices.filter((e:any) => e.definition['transformerType'].definition == "listPickElement")),
  // );

  if (flattenedUnionChoices.length == 0) {
    throw new Error(
      "jzodTypeCheck called for union-type value object with discriminator(s)=" +
        JSON.stringify(discriminators) +
        " valueObject[discriminator]=" +
        JSON.stringify(discriminators??[].map(d => valueObject[d])) +
        " found no match!"
    );
  }
  if (flattenedUnionChoices.length > 1) {
    throw new Error(
      "jzodTypeCheck called for union-type value object with discriminator(s)=" +
        JSON.stringify(discriminators) +
        " valueObject[discriminator]=" +
        JSON.stringify(discriminators??[].map(d => valueObject[d])) +
        " found many matches: " +
        flattenedUnionChoices.length +
        "objectUnionChoices=" +
        JSON.stringify(
          objectUnionChoices.map((e) => discriminators??[].map(d => (e.definition[d] as any)?.definition)),
          null,
          2
        )
    );
  }
  log.info("selectUnionBranchFromDiscriminator found exactly 1 match for union-type at valuepath=valueObject." +
    valueObjectPath.join("."),
    "typePath=",
    typePath.join("."),
    "chosen discriminator=",
    JSON.stringify(chosenDiscriminator, null, 2),
  );
  const currentDiscriminatedObjectJzodSchema: JzodObject =
    flattenedUnionChoices[0] as JzodObject;
  return { currentDiscriminatedObjectJzodSchema, currentDiscriminatedObjectJzodSchemas: flattenedUnionChoices, chosenDiscriminator };
}

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
export function jzodTypeCheck(
  jzodSchema: JzodElement,
  valueObject: any,
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
): ResolvedJzodSchemaReturnType {
  // log.info(
  //   "jzodTypeCheck called for path=valueObject." + 
  //   currentPath.join("."),
  //   "value",
  //   // JSON.stringify(valueObject, null, 2),
  //   valueObject,
  //   "schema",
  //   // JSON.stringify(jzodSchema, null, 2)
  //   jzodSchema
  // );
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
      //   "jzodTypeCheck schemaReference resultJzodSchema",
      //   JSON.stringify(resultJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return jzodTypeCheck(
        resultJzodSchema,
        valueObject,
        currentValuePath,
        [...currentTypePath, "ref:" + (jzodSchema.definition.relativePath??"NO_RELATIVE_PATH")],
        miroirFundamentalJzodSchema,
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
          valuePath: currentValuePath,
          typePath: [],
          error: "jzodTypeCheck object schema " +
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
            "jzodTypeCheck object extend clause schema " +
              JSON.stringify(jzodSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
          // return ({
          //   status: "error",
          //   error: "jzodTypeCheck object extend clause schema " +
          //       JSON.stringify(jzodSchema) +
          //       " is not an object " +
          //       JSON.stringify(extension)
          // })
        }
      } else {
        extendedJzodSchema = jzodSchema
      }
      // log.info("jzodTypeCheck object extendedJzodSchema",extendedJzodSchema)

      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(valueObject).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = jzodTypeCheck(
              extendedJzodSchema.definition[e[0]],
              e[1],
              [...currentValuePath, e[0]],
              [...currentTypePath, e[0]],
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            // log.info("jzodTypeCheck object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              // return resultSchemaTmp;
              log.warn(
                "jzodTypeCheck error on resolving object attribute " +
                  currentValuePath.join(".") + e[0] +
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
              error: "jzodTypeCheck error on resolving object, valueObject attribute " +
                currentValuePath.join(".") + e[0] +
                " not present in definition of type " +
                JSON.stringify(extendedJzodSchema) +
                " valueObject " + 
                JSON.stringify(valueObject)
            })
            return [e[0],{ type: "never" }]
          }
        } 
      );
      // log.info("jzodTypeCheck object resolved entries result",resolvedObjectEntries)

      // TODO: inheritance!!!
      const resultElement = {
        ...extendedJzodSchema,
        definition: Object.fromEntries(resolvedObjectEntries),
      } as JzodElement;
      // log.info(
      //   "jzodTypeCheck object at",
      //   currentValuePath.join("."),
      //   "type:",
      //   JSON.stringify(resultElement, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return { status: "ok", valuePath: currentValuePath, typePath: [], element: resultElement };
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
      //   "jzodTypeCheck called for union",
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
            log.info(
              "jzodTypeCheck object at",
              currentValuePath.join("."),
              "type:",
              JSON.stringify(resultJzodSchema, null, 2),
              "validates",
              JSON.stringify(valueObject, null, 2)
            );
            return {
              status: "ok",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              element: resultJzodSchema,
            };
          } else {
            return {
              status: "error",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              error:
                "jzodTypeCheck could not find string or literal type for value" +
                valueObject +
                " in resolved union " +
                JSON.stringify(concreteUnrolledJzodSchemas, null, 2),
            };
          }
          break;
        }
        case "object": {
          // value is an object, type is a union, if many options are possible we shall use a discriminator
          // const discriminator = jzodSchema.discriminator??"_undefined_"
          const discriminator = jzodSchema.discriminator

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

          // log.info(
          //   "jzodTypeCheck called for union-type value object found",
          //   objectUnionChoices.length,
          //   "discriminator=",
          //   discriminator,
          //   // "concreteUnrolledJzodSchemas",
          //   // concreteUnrolledJzodSchemas,
          //   "found object branches in the union",
          //   JSON.stringify(objectUnionChoices, null, 2),
          //   // objectUnionChoices,
          //   // "valueObject",
          //   // JSON.stringify(valueObject, null, 2),
          //   // "possible object branches=",
          //   // // JSON.stringify(objectUnionChoices.map(e => (e as any).definition[discriminator].definition), null, 2)
          // );

          // if there is only one object candidate, use this one
          if (objectUnionChoices.length == 1) {
            // only possible object choice, no need for a discriminator
            log.info(
              "jzodTypeCheck object at path=valueObject." + 
              currentValuePath.join("."),
              "only 1 object choice found, no discriminator needed",
            );
            const subElementSchema = jzodTypeCheck(
              objectUnionChoices[0],
              valueObject,
              currentValuePath,
              [...currentTypePath, "union choice"],
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            );
            return subElementSchema;
          }
          
          const {
            currentDiscriminatedObjectJzodSchema,
            currentDiscriminatedObjectJzodSchemas,
            chosenDiscriminator
          }: {
            currentDiscriminatedObjectJzodSchema: JzodObject;
            currentDiscriminatedObjectJzodSchemas: JzodObject[];
            chosenDiscriminator: {discriminator: string, value: any}[];
          } = selectUnionBranchFromDiscriminator(
            objectUnionChoices,
            discriminator,
            valueObject,
            currentValuePath,
            currentTypePath, // typePath
            // to resolve the extend clause of the object schema:
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );
          // TODO: test for selectUnionBranchFromDiscriminator result instead of using a try-catch block

          const objectJzodSchemaDefintion = Object.fromEntries(
            Object.entries(valueObject).map((a: [string, any]) => {
              const foundAttributeJzodSchema = (currentDiscriminatedObjectJzodSchema?.definition ?? ({} as any))[a[0]];
              log.info(
                "jzodTypeCheck for resolved union type calling on object attribute\n"+
                "valuePath=" + currentValuePath.join(".") + "." + a[0] + "\n" +
                "typePath=" + [...currentTypePath, JSON.stringify(chosenDiscriminator), a[0]].join(".") +
                "\n found schema:" + JSON.stringify(foundAttributeJzodSchema, null, 2) +
                "\n valueObject=" + JSON.stringify(valueObject, null, 2)
              );
              if (foundAttributeJzodSchema) {
                const subSchema = jzodTypeCheck(
                  foundAttributeJzodSchema,
                  a[1],
                  [...currentValuePath, a[0]],
                  [...currentTypePath, JSON.stringify(chosenDiscriminator), a[0]],
                  miroirFundamentalJzodSchema,
                  currentModel,
                  miroirMetaModel,
                  relativeReferenceJzodContext
                );
                if (subSchema.status == "ok") {
                  // log.info(
                  //   "jzodTypeCheck returning for union object attribute '" +
                  //   a[0] +
                  //   "' schema:", JSON.stringify(subSchema, null, 2)
                  // );
                  return [a[0], subSchema.element];
                } else {
                  log.warn(
                    "jzodTypeCheck union object could not resovle type for attribute '" +
                    currentValuePath.join(".") + a[0] +
                    "' error:", JSON.stringify(subSchema, null, 2)
                  );
                  return [a[0], { type: "never" } as JzodElement];
                }
              } else {
                log.warn(
                  "jzodTypeCheck union object could not find schema for attribute '" +
                  currentValuePath.join(".") + a[0] +
                  "' object Schema:", JSON.stringify(currentDiscriminatedObjectJzodSchema, null, 2)
                );
                return [a[0], { type: "never" } as JzodElement];
              }
            })
          );

          if (currentDiscriminatedObjectJzodSchemas) {
            log.info(
              "jzodTypeCheck object at path=valueObject." +
              currentValuePath.join("."),
              ", type:",
              JSON.stringify({ type: "object", definition: objectJzodSchemaDefintion }, null, 2),
              "validates",
              JSON.stringify(valueObject, null, 2)
            );

            return {
              status: "ok",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              element: { type: "object", definition: objectJzodSchemaDefintion },
            };
          } else {
            return {
              status: "error",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              error:
                "jzodTypeCheck could not find string type in resolved union " +
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
          throw new Error("jzodTypeCheck could not resolve type for union with valueObject " + valueObject);
          break;
        }
      }     
      // break;
    }
    case "record": {
      if ( typeof valueObject != "object") {
        throw new Error(
          "jzodTypeCheck object schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject)
        );
      }
      const definition: {[k:string]: JzodElement} = Object.fromEntries(
        Object.entries(valueObject).map(
          (e: [string, any]) => {
            const resultSchemaTmp = jzodTypeCheck(
              jzodSchema.definition,
              e[1],
              [...currentValuePath, e[0]],
              [...currentTypePath, e[0]],
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            );
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              log.warn(
                "jzodTypeCheck record could not find schema for attribute '" +
                currentValuePath.join(".") + "." + e[0] +
                "' error:", JSON.stringify(resultSchemaTmp, null, 2)
              );
              return [e[0],{ type: "never" }]
            }
          }
        ) as [string, JzodElement][]
      );
      // log.info("jzodTypeCheck record, converting to object definition", JSON.stringify(definition, null, 2))
      // log.info(
      //   "jzodTypeCheck record at path=valueObject." + 
      //   currentValuePath.join("."),
      //   ", type:",
      //   JSON.stringify({ type: "object", definition }, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        element: { type: "object", definition },
      };
    }
    case "literal": {
      if (valueObject == jzodSchema.definition)  {
        // log.info(
        //   "jzodTypeCheck literal at path=valueObject." + 
        //   currentValuePath.join("."),
        //   ", type:",
        //   JSON.stringify(jzodSchema, null, 2),
        //   "validates",
        //   JSON.stringify(valueObject, null, 2)
        // );

        return {
          status: "ok",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          element: jzodSchema,
        };
      } else {
        return {
          status: "error",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          error:
            "jzodTypeCheck could not find literal type in resolved union " +
            JSON.stringify(valueObject, null, 2) +
            " jzodSchema=" +
            JSON.stringify(jzodSchema, null, 2),
        };
      }
      break;
    }
    case "enum": {
      log.info(
        "jzodTypeCheck enum at path=valueObject." + 
        currentValuePath.join("."),
        ", type:",
        JSON.stringify(jzodSchema, null, 2),
        "validates",
        JSON.stringify(valueObject, null, 2)
      );
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        element: jzodSchema,
      };
    }
    case "tuple": {
      return {
        status: "error",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        error: "jzodTypeCheck can not handle tuple schema " +
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
          valuePath: currentValuePath,
          typePath: currentTypePath,
          error: "jzodTypeCheck array schema " +
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

      // log.info("jzodTypeCheck called resolveJzodSchemaReferenceInContext for array found innerSchema", JSON.stringify(innerSchema, null, 2));

      if (innerSchema.type != "union") {
        log.info(
          "jzodTypeCheck array innerSchema not union at path=valueObject." + 
          currentValuePath.join("."),
          ", type:",
          JSON.stringify({ type: "array", definition: innerSchema}, null, 2),
          "validates",
          JSON.stringify(valueObject, null, 2)
        );
        return {
          status: "ok",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          element: { type: "array", definition: innerSchema },
        };
      }

      // innerSchema is a union type, we have to unfold each element to its own type and return a tuple type
      const result: JzodElement[] = valueObject.map(
        (e:any, index: number) => {
          const resultSchemaTmp = jzodTypeCheck(
            innerSchema,
            e,
            [...currentValuePath, index],
            currentTypePath,
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );
          if (resultSchemaTmp.status == "ok") {
              return resultSchemaTmp.element
          } else {
            log.warn(
              "jzodTypeCheck record could not find schema for array element '" +
              e +
              "' error:", JSON.stringify(resultSchemaTmp, null, 2)
            );
            return { type: "never" }
          }
        }
      );

      log.info(
        "jzodTypeCheck array innerSchema is union at path=valueObject." + 
        currentValuePath.join("."),
        ", type:",
        JSON.stringify({ type: "tuple", definition: result}, null, 2),
        "validates",
        JSON.stringify(valueObject, null, 2)
      );
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        element: { type: "tuple", definition: result },
      };
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
      // log.info(
      //   "jzodTypeCheck", jzodSchema?.type, "at path=valueObject." + 
      //   currentValuePath.join("."),
      //   ", type:",
      //   JSON.stringify(jzodSchema, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return { status: "ok", valuePath: currentValuePath, typePath: [], element: jzodSchema };
    }
    default: {
      throw new Error(
        "jzodTypeCheck could not resolve schemaReferences for valueObject " +
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
  // log.info(
  //   "resolveJzodSchemaReferenceInContext called for reference",
  //   JSON.stringify(jzodReference, null, 2),
  // );
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


  // log.info(
  //   "resolveJzodSchemaReferenceInContext for reference",
  //   "absolutePath",
  //   jzodReference.definition.absolutePath,
  //   "relativePath",
  //   jzodReference.definition.relativePath,
  //   "relativeReferenceJzodContext",
  //   Object.keys(relativeReferenceJzodContext??{}),
  //   "result",
  //   targetJzodSchema,
  // );

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
