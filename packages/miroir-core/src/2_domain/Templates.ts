import {
  QueryTemplate,
  MiroirQuery,
  QueryFailed,
  QueryExtractObjectByDirectReference,
  QuerySelectExtractorWrapperReturningList,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveContextReference } from "./QuerySelectors.js";
import { transformer_InnerReference_resolve } from "./Transformers.js";

// ################################################################################################
export function resolveQueryTemplate(
  queryTemplate: QueryTemplate,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): MiroirQuery | QueryFailed {
  switch (queryTemplate.queryType) {
    case "literal": {
      return queryTemplate;
    }
    case "queryTemplateExtractObjectListByEntity": {
      if (queryTemplate.filter) {
        return {
          ...queryTemplate,
          queryType: "queryExtractObjectListByEntity",
          parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
          filter: {
            attributeName: queryTemplate.filter.attributeName,
            value: resolveContextReference(queryTemplate.filter.value, queryParams, contextResults).elementValue, // TODO: check for failure!
          },
        };
      } else {
        return {
          ...queryTemplate,
          queryType: "queryExtractObjectListByEntity",
          parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        };
      }
      break;
    }
    case "selectObjectByDirectReference": {
      return {
        ...queryTemplate,
        queryType: "selectObjectByDirectReference",
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        // instanceUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        instanceUuid: transformer_InnerReference_resolve(
          "build",
          queryTemplate.instanceUuid,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
      };
      break;
    }
    case "extractorWrapperReturningObject": {
      return {
        ...queryTemplate,
        queryType: "extractorWrapperReturningObject",
        definition: Object.fromEntries(
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            resolveQueryTemplate(e[1], queryParams, contextResults) as QueryExtractObjectByDirectReference, // TODO: generalize to MiroirQuery & check for failure!
          ])
        ),
      };
      break;
    }
    case "extractorWrapperReturningList": {
      return {
        ...queryTemplate,
        queryType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map(
          (e: QueryTemplate) =>
            resolveQueryTemplate(e, queryParams, contextResults) as QuerySelectExtractorWrapperReturningList
        ),
      };
      break;
    }
    case "wrapperReturningObject": {
      return {
        ...queryTemplate,
        // queryType: "wrapperReturningObject",
        definition: Object.fromEntries(
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            resolveQueryTemplate(e[1], queryParams, contextResults) as MiroirQuery, // TODO: generalize to MiroirQuery & check for failure!
          ])
        ),
      };
      break;
    }
    case "wrapperReturningList": {
      return {
        ...queryTemplate,
        // queryType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map(
          (e: QueryTemplate) => resolveQueryTemplate(e, queryParams, contextResults) as MiroirQuery
        ),
      };
      break;
    }
    case "selectObjectListByRelation": {
      return {
        ...queryTemplate,
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        // objectReference: resolveContextReference(queryTemplate.objectReference, queryParams, contextResults)
        objectReference: transformer_InnerReference_resolve(
          "build",
          queryTemplate.objectReference,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
      };
      break;
    }
    case "selectObjectListByManyToManyRelation": {
      return {
        ...queryTemplate,
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        objectListReference: resolveContextReference(queryTemplate.objectListReference, queryParams, contextResults)
          .elementValue, // TODO: check for failure!
      };
      break;
    }
    case "selectObjectByRelation": {
      return {
        ...queryTemplate,
        parentUuid: resolveContextReference(queryTemplate.parentUuid, queryParams, contextResults).elementValue, // TODO: check for failure!
        objectReference: resolveContextReference(queryTemplate.objectReference, queryParams, contextResults)
          .elementValue, // TODO: check for failure!
      };
      break;
    }
    case "queryCombiner": {
      return {
        ...queryTemplate,
        rootQuery: resolveQueryTemplate(queryTemplate.rootQuery, queryParams, contextResults) as MiroirQuery, // TODO: check for failure!
        subQuery: {
          ...queryTemplate.subQuery,
          query: resolveQueryTemplate(queryTemplate.subQuery.query, queryParams, contextResults) as MiroirQuery, // TODO: check for failure!
        },
      };
      break;
    }
    case "queryContextReference": {
      return queryTemplate;
      break;
    }
    default: {
      return {
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["AsyncQuerySelectors", "resolveQueryTemplate"],
        query: JSON.stringify(queryTemplate),
      };
      break;
    }
  }
}
