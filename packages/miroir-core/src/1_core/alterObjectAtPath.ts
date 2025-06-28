export function alterObjectAtPath(
  object: any,
  path: string[],
  value: any,
):any { // terminal recursion
  if (path.length == 0) {
    return value
  }
  const head = path[0]
  if (!object) {
    throw new Error("alterObjectAtPath could not access attribute " + head + " for undefined object");
  }
  // if (object[head]) {
    return {
      ...object,
      [head]: alterObjectAtPath(object[head], path.slice(1),value)
    }
  // } else {
  //   throw new Error("alterObjectAtPath could not access attribute " + head + " for object " + JSON.stringify(object, null, 2));
  // }
}

/**
 * 
 * @param object 
 * @param path 
 * @param value 
 * @returns 
 * 
 */
export function deleteObjectAtPath(
  object: any,
  path: (string | number)[],
):any { // terminal recursion
  if (path.length == 0) {
    return object;
  }
  if (path.length == 1) {
    return Object.fromEntries(
      Object.entries(object).filter(a => a[0] != path[0])
    )
  }
  return {
    ...object,
    [path[0]]:deleteObjectAtPath(object[path[0]], path.slice(1))
  };
}