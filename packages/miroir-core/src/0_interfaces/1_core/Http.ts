export const HttpMethodsObject = {
  post: "post",
  put: "put",
  get: "get",
  delete: "delete",
};
export type HttpMethod = keyof typeof HttpMethodsObject;
export const HttpMethodsArray: HttpMethod[] = Object.keys(HttpMethodsObject) as HttpMethod[];