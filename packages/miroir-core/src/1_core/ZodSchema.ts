import { ZodType, ZodTypeAny, string, z } from "zod";
import { ZodReferentialElement, ZodReferentialElementSet, ZodReferentialElementSetSchema, ZodSimpleElement } from "../0_interfaces/1_core/ZodSchema";

// const resSchema = z.record(z.string(),z.any())
// type ResType = z.infer<typeof resSchema>;
export type ResType = {[k:string]:ZodType};

// export function getZodReferentialType(element:ZodReferentialElement):ZodTypeAny {
  // export function getZodReferentialSetType(elementSet:ZodReferentialElementSet):ZodType<ZodReferentialElementSet> {
export function getZodReferentialSetType(elementSet:ZodReferentialElementSet):ResType {
  // const entries = Object.entries(elementSet);
  // if (entries.length > 2) {
    
    let result:ResType = Object.fromEntries(
      Object.entries(elementSet).map(entry=>[entry[0],getZodReferentialType(entry[1],()=>result)])
    )
    
    // z.union(
    //   // entries.map(entry=>getZodReferentialType(entry[1],result) as readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]])
    //   entries.map(entry=>getZodReferentialType(entry[1],result)) as any // readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]
    // );
    return result
  // } else {
  //   return {}
  // }

}

export function getZodReferentialType(element:ZodReferentialElement,getRoot:()=>ResType):ZodTypeAny {
// export function getZodReferentialType(element:ZodReferentialElement,root:ZodTypeAny):ZodType<ZodReferentialElement> {
  switch (element.type) {
    case "referentialElement": {
      return z.lazy(()=>getRoot()[element.definition]);
      break;
    }
    case "simpleObject": {
      if (element.optional) {
        return z.object(
          Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(a[1], getRoot)]))
        ).optional()
      } else {
        return z.object(
          Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(a[1], getRoot)]))
        )
      }
      break;
    }
    case "simpleType": {
      if (element.optional) {
        return z[element.definition]().optional()
      } else {
        return z[element.definition]()
      }
      break;
    }
    case "simpleArray": {
      if (element.optional) {
        return z.array(getZodReferentialType(element.definition, getRoot)).optional()
      } else {
        return z.array(getZodReferentialType(element.definition, getRoot))
      }
      break;
    }
    default:
      return z.any()
      break;
  }
}

export function getZodSimpleType(element:ZodSimpleElement):ZodTypeAny {
  return getZodReferentialType(element as ZodReferentialElement,()=>({}));
  // switch (element.type) {
  //   case "simpleObject": {
  //     if (element.optional) {
  //       return z.object(
  //         Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSimpleType(a[1])]))
  //       ).optional()
  //     } else {
  //       return z.object(
  //         Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSimpleType(a[1])]))
  //       )
  //     }
  //     break;
  //   }
  //   case "simpleType": {
  //     if (element.optional) {
  //       return z[element.definition]().optional()
  //     } else {
  //       return z[element.definition]()
  //     }
  //     break;
  //   }
  //   case "simpleArray": {
  //     if (element.optional) {
  //       return z.array(getZodSimpleType(element.definition)).optional()
  //     } else {
  //       return z.array(getZodSimpleType(element.definition))
  //     }
  //     break;
  //   }
  //   default:
  //     return z.any()
  //     break;
  // }
}