// lodash-es ships no types of its own and @types/lodash-es is not installed; its functions have the
// same signatures as lodash's (#370: the app imports lodash-es, bare lodash is a shim in the build).
declare module "lodash-es" {
  export { isObject, isUndefined, merge, transform } from "lodash";
}
