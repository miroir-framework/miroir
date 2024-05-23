export function alterObject(
  object: any,
  path: string[],
  value: any,
):any { // terminal recursion
  if (path.length == 0) {
    return value
  }
  const head = path[0]
  if (!object) {
    throw new Error("alterObject could not access attribute " + head + " for undefined object");
  }
  if (object[head]) {
   return {
    ...object,
    [head]: alterObject(object[head], path.slice(1),value)
  }
  } else {
    throw new Error("alterObject could not access attribute " + head + " for object " + JSON.stringify(object, null, 2));
  }
}