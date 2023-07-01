import { AnyZodObject, ZodLazy, ZodObject, ZodTypeAny, optional, z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { ResType, ZodReferentialElement, ZodReferentialElementSet, ZodSchemaAndDescription, ZodSimpleElement, zodJsonBootstrapSchema, ZodReferentialElementSchema, ZodReferentialUnion } from "../0_interfaces/1_core/IZodSchema";

const serialize = require('serialize-javascript');


export function getDescriptions(set:ResType) {
 return  Object.fromEntries(Object.entries(set).map(a=>[a[0],a[1].description]))
}

// ######################################################################################################
export function getZodSchemaFromJsonZodSchemaSet(elementSet:ZodReferentialElementSet,generateForTs?: boolean):ResType {
  // console.log('getZodSchemaFromJsonZodSchemaSet called generateForTs', generateForTs);
  let result:ResType = {}
  
  for (const entry of Object.entries(elementSet)) {
    result[entry[0]] = getZodSchemaFromJsonZodSchema(entry[0],entry[1],()=>result,generateForTs)
  }
  console.log('getZodSchemaFromJsonZodSchemaSet done', Object.keys(result))
  // console.log('getZodSchemaFromJsonZodSchemaSet done', result)
  // result = Object.fromEntries( 
  //   Object.entries(elementSet).map(entry=>[entry[0],getZodSchemaFromJsonZodSchema(entry[0],entry[1],()=>result,generateForTs)])
  // )
  return result;
}


// ######################################################################################################
export function getZodSchemaFromJsonZodSchema(name:string, element:ZodReferentialElement,getSchemaReferences:()=>ResType,generateForTs?: boolean):ZodSchemaAndDescription {
  console.log("getZodSchemaFromJsonZodSchema",name,"converting",element.type,(['referentialElement','simpleType','literal'].includes(element.type)?'definition ' + (element as any)['definition']:''));
  switch (element.type) {
    case "simpleBootstrapElement": {
      // return z.lazy(()=>getZodSchemaFromJsonZodSchema(name, {type:"referentialElement", definition:"ZodSimpleElementSchema"},getSchemaReferences,generateForTs));
      return getZodSchemaFromJsonZodSchema(name, {type:"schemaReference", definition:"ZodSimpleElementSchema"},getSchemaReferences,generateForTs);
      // return z.lazy(()=>getSchemaReferences()["ZodSimpleElementSchema"]);
    }
    case "literal": {
      return {
        zodSchema:z.literal(element.definition),
        description: `z.literal(${element.definition})`
      }
    }
    case "lazy": {
      // console.log("getZodSchemaFromJsonZodSchema",name,"converting lazy",element);
      const sub = getZodSchemaFromJsonZodSchema(name, element.definition,getSchemaReferences,generateForTs);
      return {
        zodSchema:z.lazy(()=>sub.zodSchema),
        description:`z.lazy(()=>${sub.description}),`
      }
    }
    case "function": {
      // console.log("getZodSchemaFromJsonZodSchema",name,"converting function",element);
      const args = Object.entries(element.args).map(e=>getZodSchemaFromJsonZodSchema(name, e[1],getSchemaReferences,generateForTs));
      if (element.returns) {
        const returns = getZodSchemaFromJsonZodSchema(name, element.returns,getSchemaReferences,generateForTs);
        return {
          zodSchema:z.function().args(...args.map(z=>z.zodSchema) as any).returns(returns.zodSchema),
          description:`z.function().args(${JSON.stringify(args.map(z=>z.description))}).returns(${returns.description})`
        };

      } else {
        // return z.function().args(...element.args as any);
        return {
          zodSchema:z.function().args(...args.map(z=>z.zodSchema) as any),
          description:`z.function().args(${JSON.stringify(args.map(z=>z.description))})`
        };
      }
    }
    case "enum": {
      if (Array.isArray(element.definition) && element.definition.length > 1) {
        return {
          zodSchema:z.enum([...element.definition] as any),
          description:`z.enum(${JSON.stringify([...element.definition])} as any)`
        }
        // return z.enum(element.definition as readonly [string, ...string[]])
      } else {
        return {
          zodSchema:z.any(),
          description: `z.any()`
        };
      }
      break;
    }
    case "schemaReference": {
      // console.log("getZodSchemaFromJsonZodSchema",name,"converting referentialElement",element.definition);
      // if (element.optional) {
          return {
            zodSchema: z.lazy(((optional:boolean) => {
              const references = getSchemaReferences();
              // console.log('referentialElement lazy optional called for',name,'element',element,'getSchemaReferences()[element.definition]',getSchemaReferences()[element.definition] );
              if (references && references[element.definition]) {
                return optional?references[element.definition].zodSchema.optional():references[element.definition].zodSchema;
              } else {
                throw new Error(
                  "when converting optional" +
                    name +
                    "could not find schema" +
                    element.definition +
                    " in " +
                    Object.keys(references)
                );
              }
            }).bind(null,element.optional)),
            description: `z.lazy(() =>references[${element.definition}].zodSchema` + (element.optional?'.optional()':''),
          };
        // } else {
        //     return z.lazy(()=>{
        //       // console.log('referentialElement lazy  called for',name,'element',element,'getSchemaReferences()[element.definition]',getSchemaReferences()[element.definition] );
        //       const references = getSchemaReferences();
        //       if (references && references[element.definition]) {
        //         return references[element.definition]
        //       } else {
        //         throw new Error('when converting ' + name + ' could not find schema ' + element.definition + ' in ' + Object.keys(references))
        //       }
        //     });
          
        // }
      break;
    }
    case "object": {
        // if (element.optional) {
          console.log("getZodSchemaFromJsonZodSchema",name," object element",element,"optional",optional);
          const sub = Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSchemaFromJsonZodSchema(name, a[1], getSchemaReferences, generateForTs)]))
          const schemas =  Object.fromEntries(Object.entries(sub).map(a=>[a[0],a[1].zodSchema]));
          const descriptions =  Object.fromEntries(Object.entries(sub).map(a=>[a[0],a[1].description]));
          // const descriptions =  Object.fromEntries(Object.entries(sub).map(a=>[a[0],"toto"]));
          return {
            zodSchema: element.optional?z.object(schemas as any).optional():z.object(schemas as any),
            description: element.optional?`z.object(${JSON.stringify(descriptions)})`:`z.object(${JSON.stringify(descriptions)}).optional()`
          }
        //   return z.object(
        //     Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSchemaFromJsonZodSchema(name, a[1], getSchemaReferences, generateForTs)]))
        //   ).optional()
        // } else {
        //   console.log("getZodSchemaFromJsonZodSchema",name," object element",element);
        //   return z.object(
        //     Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSchemaFromJsonZodSchema(name, a[1], getSchemaReferences, generateForTs)]))
        //   )
      // }
      break;
    }
    // case "simpleObject": {
    //     if (element.optional) {
    //       return z.object(
    //         Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSchemaFromJsonZodSchema(a[1], getSchemaReferences, generateForTs)]))
    //       ).optional()
    //     } else {
    //       return z.object(
    //         Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodSchemaFromJsonZodSchema(a[1], getSchemaReferences, generateForTs)]))
    //       )
    //     }
    //   break;
    // }
    case "simpleType": {
      return {
        zodSchema: element.optional?(z as any)[element.definition]().optional():(z as any)[element.definition](),
        description: element.optional?`z.${element.definition}().optional()`:`z.${element.definition}()`
      }
      // if (element.optional) {
      //   return (z as any)[element.definition]().optional()
      // } else {
      //   return (z as any)[element.definition]()
      // }
      break;
    }
    case "array": {
      const sub = getZodSchemaFromJsonZodSchema(name, element.definition, getSchemaReferences, generateForTs);
      return {
        zodSchema: element.optional?z.array(sub.zodSchema).optional():z.array(sub.zodSchema),
        description: element.optional?`z.array(${sub.description}).optional()`:`z.array(${sub.description})`
      }
      // if (element.optional) {
      //   return z.array(getZodSchemaFromJsonZodSchema(name, element.definition, getSchemaReferences, generateForTs)).optional()
      // } else {
      //   return z.array(getZodSchemaFromJsonZodSchema(name, element.definition, getSchemaReferences, generateForTs))
      //   // return z.array(getZodSchemaFromJsonZodSchema(name, element.definition, getSchemaReferences, generateForTs))
      // }
      break;
    }
    // case "simpleUnion": {
    //   const sub = element.definition.map((e:ZodReferentialElementSchema)=>getZodSchemaFromJsonZodSchema(name, e, getSchemaReferences, generateForTs))
    //   return {
    //     zodSchema:z.union( sub.map(s=>s.zodSchema)as any),
    //     description:`z.union(${JSON.stringify(sub.map(s=>s.description))})`
    //   }
    //   // return z.union(element.definition.map(e=>getZodSchemaFromJsonZodSchema(name, e, getSchemaReferences, generateForTs)) as any)
    //   break;
    // }
    case "referentialUnion": {
      const sub = (element as ZodReferentialUnion).definition.map(e=>getZodSchemaFromJsonZodSchema(name, e, getSchemaReferences, generateForTs))
      return {
        zodSchema:z.union( sub.map(s=>s.zodSchema)as any),
        description:`z.union(${JSON.stringify(sub.map(s=>s.description))})`
      }
      // return z.union(element.definition.map(e=>getZodSchemaFromJsonZodSchema(name, e, getSchemaReferences, generateForTs)) as any)
      break;
    }
    case "record": {
      const sub = getZodSchemaFromJsonZodSchema(name, element.definition, getSchemaReferences, generateForTs)
      return {
        zodSchema:z.record(z.string(),sub.zodSchema),
        description:`z.record(z.string(),${sub.description})`,
      }
      // return z.record(z.string(),getZodSchemaFromJsonZodSchema(name, element.definition, getSchemaReferences, generateForTs));
    }
    default:
      return {zodSchema:z.any(),description:"z.any()"}
      break;
  }
}

// export function getZodSimpleType(name:string,element:ZodSimpleElement):ZodTypeAny {
//   return getZodSchemaFromJsonZodSchema(name, element as ZodReferentialElement,()=>({}));
// }


export function referentialElementDependencies(element:ZodSimpleElement | ZodReferentialElement):string[] {
  console.log("referentialElementDependencies called for",element.type);
  let result: string[]
  switch (element.type) {
    // case "simpleBootstrapElement":
    case "literal":
    case "simpleType":
    case "enum": {
      result = []
      break;
    }
    case "function": {
      result = []
      break;
    }
    case "schemaReference": {
      result = [element.definition];
      break;
    }
    case "lazy":
    case "record":
    case "array":{
      result = referentialElementDependencies(element.definition)
      break;
    }
    case "referentialUnion":{ // definition is an array of ZodReferentialElement
      result = element.definition.reduce((acc:string[],curr:ZodSimpleElement | ZodReferentialElement)=>acc.concat(referentialElementDependencies(curr)),[]);
      // return element.definition.reduce((acc:string[],curr:any):string[]=>{return [] as string[]},[] as string[]);
      // return []
      break;
    }
    case "referentialUnion": { // definition is an array of ZodReferentialElement
      result = element.definition.reduce((acc:string[],curr:ZodSimpleElement)=>acc.concat(referentialElementDependencies(curr)),[]);
      // return element.definition.reduce((acc:string[],curr:any):string[]=>{return [] as string[]},[] as string[]);
      // return []
      break;
    }
    case "object": { // definition is an object of ZodReferentialElement
      result = Object.entries(element.definition).reduce((acc:string[],curr:[string,ZodReferentialElement])=>acc.concat(referentialElementDependencies(curr[1])),[]);
      break;
    }
    default:
      result = []
      break;
  }

  return result.filter((s)=>s != "ZodSimpleBootstrapElementSchema")
}
// ##############################################################################################################
export function _zodToJsonSchema(referentialSet:ResType, dependencies:{[k:string]:string[]},name?: string):{[k:string]:any} {
  console.log('############################################# _zodToJsonSchema called',name,);
  const referentialSetEntries = Object.entries(referentialSet);
  let result:{[k:string]:any} = {};

  for (const entry of referentialSetEntries) {
    console.log('@@@@@@@@@@@@@@@@@@@@@@@ _zodToJsonSchema',name,'calling zodToJsonSchema on',entry[0],'already defined',Object.keys(referentialSet));
    const localDependencies = dependencies[entry[0]];
    console.log("_zodToJsonSchema",name,'for',entry[0],"localDependencies",localDependencies);
    const localReferentialSet = Object.fromEntries(Object.entries(referentialSet).filter(e=>localDependencies && localDependencies.includes(e[0]) || e[0] == entry[0]).map(e=>[e[0],e[1].zodSchema]));
    // const convertedCurrent = zodToJsonSchema(entry[1], {definitions:referentialSet});
    const convertedCurrent = zodToJsonSchema(entry[1].zodSchema, {$refStrategy:"relative",definitions:localReferentialSet});
    // const convertedCurrent = zodToJsonSchema(entry[1]);
    console.log('_zodToJsonSchema',name,'converted',convertedCurrent);
    result[entry[0]] = convertedCurrent;
  }
  // const result = {
  //   node: Object.fromEntries(
  //     referentialSetEntries.map(
  //       (e:[string,any])=> {
  //         console.log('_zodToJsonSchema',name,'calling zodToJsonSchema on',e[0]);
  //         const result:[string,any] = [e[0], zodToJsonSchema(e[1], {definitions:referentialSet})];
  //         console.log('_zodToJsonSchema',name,'return',result);
  //         return result
  //       }
  //     )
  //   )
  // } as any;
  // console.log('_zodToJsonSchema return',result);
  return result;
}

// // ######################################################################################################
// // export function _zodToTs(referentialSet:ResType, name: string):{node:{[k:string]:{tsType:any /*ZodToTsReturn*/,reference:any}}} {
// export function _zodToTs(referentialSet:ResType, name: string):{node:{[k:string]:any /*ZodToTsReturn*/}} {
//   // console.log('_zodToTs referentialSet called',referentialSet);
//   const result = {
//     node: Object.fromEntries(
//       Object.entries(referentialSet).map(
//         (e:[string,any])=> {
//           // console.log('_zodToTs called for',name,'calling zodToTs on',e[0]);
//           const tsType = zodToTs(e[1],e[0]).node
//           // const reference = withGetType(z.instanceof(Date),(ts) => ts.factory.createIdentifier(e[0]),)
//           // const result:[string,any] = [e[0], {tsType,ref: reference}];
//           const result:[string,any] = [e[0], tsType];
//           // console.log('_zodToTs zodToTs return',result);
//           return result
//         }
//       )
//     )
//   } as any;
//   // console.log('_zodToTs zodToTs return',result);
//   return result;
// }


// // ######################################################################################################
// export function _printNode(node:{[k:string]:any /*ZodToTsReturn*/}, withName?:boolean):string {
//   // console.log('_printNode called on',node);
//   const entries = Object.entries(node);
//   return (`${entries.length > 1?'{':''}${
//     entries.map((e:[string,any],i)=> {
//       // console.log('_printNode index',i,e);
//       const currentNode = '' + (withName?e[0] + ':':'') + printNode(e[1]) //+ ((i<entries.length-1)?',':'')
//       // console.log('_printNode index',i,currentNode);
      
//       return currentNode
//     })}${entries.length > 1?'}':''}`)
// }


