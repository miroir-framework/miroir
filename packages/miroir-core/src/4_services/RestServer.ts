import { RestServiceHandler } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { restMethodGetHandler, restMethodModelActionRunnerHandler, restMethodsPostPutDeleteHandler } from "./RestTools";

export const restServerDefaultHandlers: RestServiceHandler[] = [
  {
    method: "get",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
    handler: restMethodGetHandler
  },
  {
    method: "put",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "delete",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/modelWithDeployment/:deploymentUuid/:actionName",
    handler: restMethodModelActionRunnerHandler
  },
];
