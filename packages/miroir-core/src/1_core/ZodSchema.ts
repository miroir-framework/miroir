import { AnyZodObject, ZodLazy, ZodObject, ZodTypeAny, z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { ResType, ZodReferentialElement, ZodReferentialElementSet, ZodSimpleElement, zodJsonBootstrapSchema } from "../0_interfaces/1_core/IZodSchema";

const serialize = require('serialize-javascript');


// ######################################################################################################
export function getZodReferentialSetType(elementSet:ZodReferentialElementSet,generateForTs?: boolean):ResType {
  // console.log('getZodReferentialSetType called generateForTs', generateForTs);
  let result:ResType = {}
  
  for (const entry of Object.entries(elementSet)) {
    result[entry[0]] = getZodReferentialType(entry[0],entry[1],()=>result,generateForTs)
  }
  console.log('getZodReferentialSetType done', Object.keys(result))
  // result = Object.fromEntries(
  //   Object.entries(elementSet).map(entry=>[entry[0],getZodReferentialType(entry[0],entry[1],()=>result,generateForTs)])
  // )
  return result;
}

// ######################################################################################################
export function getZodReferentialType(name:string, element:ZodReferentialElement,getSchemaReferences:()=>ResType,generateForTs?: boolean):ZodTypeAny {
  console.log("getZodReferentialType",name,"converting",element.type,(element.type =='referentialElement'?element.definition:''));
  switch (element.type) {
    case "simpleBootstrapElement": {
      // return z.lazy(()=>getZodReferentialType(name, {type:"referentialElement", definition:"ZodSimpleElementSchema"},getSchemaReferences,generateForTs));
      return getZodReferentialType(name, {type:"referentialElement", definition:"ZodSimpleElementSchema"},getSchemaReferences,generateForTs);
      // return z.lazy(()=>getSchemaReferences()["ZodSimpleElementSchema"]);
    }
    case "literal": {
      return z.literal(element.definition);
    }
    case "lazy": {
      // console.log("getZodReferentialType",name,"converting lazy",element);
      return z.lazy(()=>getZodReferentialType(name, element.definition,getSchemaReferences,generateForTs));
    }
    case "function": {
      // console.log("getZodReferentialType",name,"converting function",element);
      if (element.returns) {
        // return z.function().args(...element.args as any).returns(element.returns).implement(element.implements);
        // const args:ZodTypeAny[] = Object.fromEntries(Object.entries(element.args).map(e=>[e[0],getZodReferentialType(e[1],getSchemaReferences,generateForTs)]));
        const args:ZodTypeAny[] = Object.entries(element.args).map(e=>getZodReferentialType(name, e[1],getSchemaReferences,generateForTs));
        return z.function().args(...args as any).returns(getZodReferentialType(name, element.returns,getSchemaReferences,generateForTs));
      } else {
        // return z.function().args(...element.args as any).implement(element.implements);
        return z.function().args(...element.args as any);
      }
    }
    case "enum": {
      if (Array.isArray(element.definition) && element.definition.length > 1) {
        return z.enum([...element.definition] as any)
        // return z.enum(element.definition as readonly [string, ...string[]])
      } else {
        return z.any();
      }
      break;
    }
    case "referentialElement": {
      // console.log("getZodReferentialType",name,"converting referentialElement",element.definition);
      if (element.optional) {
          // if (generateForTs) {
          //   /**
          //    * withGetType does not work without the z.lazy(), this prevents returning directly the getSchemaReferences()[element.definition] object,
          //    * and thus prevents referring to defined schemas in the 'extend' clause. Avoiding to use zod-to-ts for testing purposes
          //    * shall allow to extend objects.
          //   */ 
          //   return withGetType(z.lazy(() => getSchemaReferences()[element.definition]).optional(), (ts) =>
          //     ts.factory.createIdentifier(element.definition)
          //   );
          //   // return withGetType(getSchemaReferences()[element.definition].optional(),(ts) => ts.factory.createIdentifier(element.definition));
          // } else {
            // console.log("getZodReferentialType converting referentialElement NOT for TS",element.definition, getSchemaReferences()[element.definition]);
            return z.lazy(()=>{
              // console.log('referentialElement lazy optional called for',name,'element',element,'getSchemaReferences()[element.definition]',getSchemaReferences()[element.definition] );
              const references = getSchemaReferences();
              if (references && references[element.definition]) {
                return references[element.definition].optional()
              } else {
                throw new Error('when converting optional' +name + 'could not find schema' + element.definition + ' in ' + Object.keys(references))
              }
            });
            // return getSchemaReferences()[element.definition].optional();
          // }
        } else {
          // if (generateForTs) {
          //   return withGetType(z.lazy(() => getSchemaReferences()[element.definition]),(ts) => ts.factory.createIdentifier(element.definition));
          //   // return withGetType(getSchemaReferences()[element.definition],(ts) => ts.factory.createIdentifier(element.definition));
          // } else {
            // console.log("getZodReferentialType converting referentialElement NOT for TS",element.definition, getSchemaReferences()[element.definition]);
            // return getSchemaReferences()[element.definition];
            return z.lazy(()=>{
              // console.log('referentialElement lazy  called for',name,'element',element,'getSchemaReferences()[element.definition]',getSchemaReferences()[element.definition] );
              const references = getSchemaReferences();
              if (references && references[element.definition]) {
                return references[element.definition]
              } else {
                throw new Error('when converting ' + name + ' could not find schema ' + element.definition + ' in ' + Object.keys(references))
              }
            });
          // }
          
        }
      // return z.lazy(()=>getRoot()[element.definition]);
      break;
    }
    case "object": {
      // if (element.extend) {
        
      //   // if (element.optional) {
      //   //   return z.object(
      //   //     Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(a[1], getSchemaReferences, generateForTs)]))
      //   //   ).optional()
      //   // } else {
      //     console.log("getZodReferentialType object",name,"extend element",element,'extend',element.extend);
      //     // return z.lazy(
      //     //   () => {
      //     //     if (element.extend) {
      //           const convertedElementSchema:AnyZodObject = getZodReferentialType(name, element.extend, getSchemaReferences, generateForTs) as AnyZodObject;
      //           // console.log("getZodReferentialType convertedElementSchema",JSON.stringify(convertedElementSchema));
      //           return convertedElementSchema.extend( 
      //             Object.fromEntries(
      //               Object.entries(element.definition).map((a) => [
      //                 a[0],
      //                 getZodReferentialType(name, a[1], getSchemaReferences, generateForTs),
      //               ])
      //             )
      //           );
      //         // } else {
      //         //   console.log("getZodReferentialType lazy element.extend not true",element);
      //         //   return z.any();
      //         // }
      //       // }
      //     // );
      //   // }
      // } else {
        if (element.optional) {
          console.log("getZodReferentialType",name," object optional element",element);
          return z.object(
            Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(name, a[1], getSchemaReferences, generateForTs)]))
          ).optional()
        } else {
          console.log("getZodReferentialType",name," object element",element);
          return z.object(
            Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(name, a[1], getSchemaReferences, generateForTs)]))
          )
        // }
      }
      break;
    }
    // case "simpleObject": {
    //     if (element.optional) {
    //       return z.object(
    //         Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(a[1], getSchemaReferences, generateForTs)]))
    //       ).optional()
    //     } else {
    //       return z.object(
    //         Object.fromEntries(Object.entries(element.definition).map(a=>[a[0],getZodReferentialType(a[1], getSchemaReferences, generateForTs)]))
    //       )
    //     }
    //   break;
    // }
    case "simpleType": {
      if (element.optional) {
        return (z as any)[element.definition]().optional()
      } else {
        return (z as any)[element.definition]()
      }
      break;
    }
    case "simpleArray": {
      if (element.optional) {
        return z.array(getZodReferentialType(name, element.definition, getSchemaReferences, generateForTs)).optional()
      } else {
        return z.array(getZodReferentialType(name, element.definition, getSchemaReferences, generateForTs))
      }
      break;
    }
    case "simpleUnion": {
      // if (element.optional) {
      //   return z.array(getZodReferentialType(name, element.definition, getSchemaReferences, generateForTs)).optional()
      // } else {
        return z.union(element.definition.map(e=>getZodReferentialType(name, e, getSchemaReferences, generateForTs)) as any)
      // }
      break;
    }
    case "referentialUnion": {
      // if (element.optional) {
      //   return z.array(getZodReferentialType(name, element.definition, getSchemaReferences, generateForTs)).optional()
      // } else {
        return z.union(element.definition.map(e=>getZodReferentialType(name, e, getSchemaReferences, generateForTs)) as any)
      // }
      break;
    }
    case "record": {
      return z.record(z.string(),getZodReferentialType(name, element.definition, getSchemaReferences, generateForTs));
    }
    default:
      return z.any()
      break;
  }
}

export function getZodSimpleType(name:string,element:ZodSimpleElement):ZodTypeAny {
  return getZodReferentialType(name, element as ZodReferentialElement,()=>({}));
}


export function referentialElementDependencies(element:ZodSimpleElement | ZodReferentialElement):string[] {
  switch (element.type) {
    // case "simpleBootstrapElement":
    case "literal":
    case "simpleType":
    case "referentialElement":
    case "enum": {
      return []
      break;
    }
    case "function": {
      return []
      break;
    }
    case "lazy":
    case "record":
    case "simpleArray":{
      return referentialElementDependencies(element.definition)
      break;
    }
    case "referentialUnion":{ // definition is an array of ZodReferentialElement
      return element.definition.reduce((acc:string[],curr:ZodSimpleElement | ZodReferentialElement)=>acc.concat(referentialElementDependencies(curr)),[]);
      // return element.definition.reduce((acc:string[],curr:any):string[]=>{return [] as string[]},[] as string[]);
      // return []
      break;
    }
    case "simpleUnion": { // definition is an array of ZodReferentialElement
      return element.definition.reduce((acc:string[],curr:ZodSimpleElement)=>acc.concat(referentialElementDependencies(curr)),[]);
      // return element.definition.reduce((acc:string[],curr:any):string[]=>{return [] as string[]},[] as string[]);
      // return []
      break;
    }
    case "object": { // definition is an object of ZodReferentialElement
      return Object.entries(element.definition).reduce((acc:string[],curr:[string,ZodReferentialElement])=>acc.concat(referentialElementDependencies(curr[1])),[]);
      break;
    }
    default:
      return []
      break;
  }

}
// ##############################################################################################################
export function _zodToJsonSchema(referentialSet:ResType, dependencies:{[k:string]:string[]},name?: string):{[k:string]:any} {
  console.log('############################################# _zodToJsonSchema called',name,);
  const referentialSetEntries = Object.entries(referentialSet);
  let result:{[k:string]:any} = {};

  for (const entry of referentialSetEntries) {
    console.log('_zodToJsonSchema',name,'calling zodToJsonSchema on',entry[0],'already defined',Object.keys(referentialSet));
    const localDependencies = dependencies[entry[0]];
    console.log("_zodToJsonSchema",name,"localDependencies",localDependencies);
    const localReferentialSet = Object.fromEntries(Object.entries(referentialSet).filter(e=>localDependencies.includes(e[0])));
    // const convertedCurrent = zodToJsonSchema(entry[1], {definitions:referentialSet});
    const convertedCurrent = zodToJsonSchema(entry[1], {$refStrategy:"relative"});
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


