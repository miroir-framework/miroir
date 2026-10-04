// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

import { HttpMethod } from "../0_interfaces/1_core/Http";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { RestClientCallReturnType, RestClientInterface } from "../0_interfaces/4-services/PersistenceInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { type AccessDirectory } from "../1_core/authentication/AccessPolicy.js";
import {
  authenticateRequest,
  authorizeDeployment,
  type AuthenticationGate,
  type LoadedAccessDirectory,
} from "../1_core/authentication/AccessGate.js";
import {
  resolveAuthenticationEnabled,
  type IdentityDirectory,
} from "../1_core/authentication/AuthenticationPolicy.js";
import { handleAuthHttpRoute } from "../1_core/authentication/AuthenticationHttp.js";
import { deploymentUuidsFromHttpRequest } from "../1_core/authentication/deploymentUuidFromHttpRequest.js";
import type { ProcessCapabilities } from "../1_core/processCapabilities.js";
import { handleProcessCapabilitiesHttpRoute } from "./ProcessCapabilitiesHttp.js";
import { packageName } from "../constants";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";
import { getRestClientAuthorizationToken } from "./RestClient.js";
import { restServerDefaultHandlers } from "./RestServer";
import { redactCredentialSecretsFromValue } from "./redactCredentialSecrets.js";
import { cleanLevel } from "./constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestClientStub");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

// ##############################################################################################
/**
 * calls Rest Server directly, without going through the network.
 */
export class RestClientStub implements RestClientInterface {
  private persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;
  private serverDomainController: DomainControllerInterface | undefined;
  private identityDirectory: IdentityDirectory | undefined;
  private accessDirectory: AccessDirectory | undefined;
  /** #263: set by the hosts (CLI, Electron); otherwise built from the two snapshot setters. */
  private authenticationGate: AuthenticationGate | undefined;
  private processCapabilities: ProcessCapabilities | undefined;

  constructor(private rootApiUrl: string) {}

  /**
   * #263: the host's resolved hatch and a loader read on every gated call. Isolated emulated
   * sessions (setupMiroirTest) never set a gate nor a directory, and stay open.
   */
  setAuthenticationGate(gate: AuthenticationGate) {
    this.authenticationGate = gate;
  }

  /** Test seam (#71): a fixed directory, the hatch read from process.env. */
  setIdentityDirectory(directory: IdentityDirectory) {
    this.identityDirectory = directory;
  }

  setProcessCapabilities(snapshot: ProcessCapabilities) {
    this.processCapabilities = snapshot;
  }

  setAccessDirectory(directory: AccessDirectory) {
    this.accessDirectory = directory;
  }

  setPersistenceStoreControllerManager(
    persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface
  ) {
    this.persistenceStoreControllerManager = persistenceStoreControllerManager;
  }

  setServerDomainController(domainController: DomainControllerInterface) {
    this.serverDomainController = domainController;
  }

  private currentAuthenticationGate(): AuthenticationGate | undefined {
    if (this.authenticationGate) {
      return this.authenticationGate;
    }
    if (this.identityDirectory === undefined) {
      return undefined;
    }
    return {
      enabled: resolveAuthenticationEnabled({ env: process.env }),
      loadDirectory: async () => ({
        directory: this.identityDirectory!,
        grants: this.accessDirectory?.grants ?? [],
        deployments: this.accessDirectory?.deployments ?? [],
      }),
    };
  }

  // ##############################################################################################
  async call(
    rawUrl: string,
    method: HttpMethod,
    endpoint: string,
    args: any = {}
  ): Promise<RestClientCallReturnType> {
    // log.info("RestClient call", method, endpoint, args)
    const { body, ...customConfig } = args;
    const gate = this.currentAuthenticationGate();
    const tokenFromGetter = gate !== undefined ? getRestClientAuthorizationToken() : undefined;
    const authorizationHeader =
      customConfig?.headers?.Authorization ??
      customConfig?.headers?.authorization ??
      (tokenFromGetter ? `Bearer ${tokenFromGetter}` : undefined);
    // `/auth/status` needs only the gate's hatch value: only login and change-password read the
    // directory.
    const needsDirectory = /\/auth\/(login|change-password)\/?(\?|$)/.test(rawUrl) ||
      /\/auth\/(login|change-password)\/?(\?|$)/.test(endpoint);
    const directoryForAuthRoute: LoadedAccessDirectory | undefined =
      needsDirectory && gate ? await gate.loadDirectory() : undefined;
    const authHttp = await handleAuthHttpRoute({
      url: rawUrl,
      endpoint,
      body,
      authorizationHeader,
      directory: directoryForAuthRoute?.directory ?? this.identityDirectory,
      enabled: gate?.enabled,
      secret: gate?.secret,
    });
    if (authHttp) {
      if (authHttp.directory && gate?.persistPasswordChange && directoryForAuthRoute) {
        const authenticated = await authenticateRequest({ ...gate, enabled: true }, authorizationHeader);
        const passwordHash = authenticated.allowed && authenticated.principal
          ? authHttp.directory.credentials.find(
              (row) => row.miroirUser === authenticated.principal!.miroirUserUuid,
            )?.passwordHash
          : undefined;
        const persisted =
          authenticated.allowed && authenticated.principal && passwordHash
            ? await gate.persistPasswordChange({
                principal: authenticated.principal,
                credentialsValue: directoryForAuthRoute.credentialsValue,
                passwordHash,
              })
            : false;
        if (!persisted) {
          return {
            status: 401,
            data: { status: "error", errorType: "AuthenticationFailed" },
            headers: new Headers(),
            url: this.rootApiUrl + endpoint,
          };
        }
      } else if (authHttp.directory && this.identityDirectory !== undefined) {
        this.identityDirectory = authHttp.directory;
      }
      return {
        status: authHttp.status,
        data: authHttp.data,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
    }

    const capabilitiesHttp = handleProcessCapabilitiesHttpRoute({
      url: rawUrl,
      endpoint,
      capabilities: this.processCapabilities,
    });
    if (capabilitiesHttp) {
      return {
        status: capabilitiesHttp.status,
        data: capabilitiesHttp.data,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
    }

    // Isolated emulated sessions (setupMiroirTest) install no gate: no token verify, no 401. In
    // the browser, process.env.MIROIR_AUTH_ENABLED is often unset, so the hatch would default ON.
    const authEnabled = gate?.enabled ?? false;
    const authenticated = gate
      ? await authenticateRequest(gate, authorizationHeader)
      : ({ allowed: true, principal: undefined, access: undefined } as const);
    if (!authenticated.allowed) {
      return {
        status: authenticated.status,
        data: authenticated.body,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
    }
    const principal = authenticated.principal;

    // Same extraction as the server's REST gate (#263): action bodies are
    // `{ action, applicationDeploymentMap }`, query actions name the application.
    const access = authorizeDeployment(
      authEnabled,
      authenticated,
      deploymentUuidsFromHttpRequest({ params: args, body }),
    );
    if (!access.allowed) {
      return {
        status: access.status,
        data: access.body,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
    }

    if (this.persistenceStoreControllerManager === undefined) {
      throw new Error("RestClientStub: persistenceStoreControllerManager is not set");
    }
    if (this.serverDomainController === undefined) {
      throw new Error("RestClientStub: serverDomainController is not set");
    }

    const deploymentUuid = args["deploymentUuid"] ?? (body ?? {})["deploymentUuid"];
    const parentUuid = args["parentUuid"] ?? (body ?? {})["parentUuid"] ?? (body ?? {})["deploymentUuid"];
    const section = args["section"] ?? (body ?? {})["section"];
    const actionType = args["actionType"] ?? (body ?? {})["actionType"];

    let data;
    try {
      // log.info("restServerDefaultHandlers", restServerDefaultHandlers)
      log.debug(
        "RestClientStub call with params",
        "deploymentUuid",
        deploymentUuid,
        "parentUuid=",
        parentUuid,
        ", section=",
        section,
        ", method=",
        method,
        ", endpoint=",
        endpoint,
        ", body=",
        redactCredentialSecretsFromValue(body)
      );
      // log.info("RestClientStub for header", method, "rawUrl=", rawUrl, "endpoint=", endpoint, "sending body=", body);
      const methodToCall = restServerDefaultHandlers.find(
        (h) => h.method == method.toLowerCase() && h.url == rawUrl
      );
      log.debug("RestClientStub found methodToCall", methodToCall);
      if (!methodToCall) {
        throw new Error(`RestClientStub: No handler found for ${method} ${rawUrl}`);
      }

      // log.info("RestClientStub methodToCall", methodToCall);
      const result = await methodToCall.handler(
        true, // useDomainControllerToHandleModelAndInstanceActions: the domainController knows whether it has access to the persistenceStore or not, and will use the appropriate access method, depending on the query.
        (response: any) => (localData: any) => localData, // continuationFunction: the result from RestServer is wrapped in a "data" object
        undefined,
        this.persistenceStoreControllerManager,
        this.serverDomainController,
        method as any /* method */,
        endpoint,
        body, // body
        {
          // params
          actionType,
          deploymentUuid,
          parentUuid,
          section,
          authPrincipal: principal,
          ...customConfig,
        }
      );

      // log.info("RestClientStub inner result", JSON.stringify(result, undefined, 2));
      return {
        // simulating response to a REST call
        status: 200,
        data: result,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
    } catch (err: any) {
      return Promise.reject(err.message ? err.message : data);
    }
  }

  // ##############################################################################################
  async get(
    rawUrl: string,
    endpoint: string,
    customConfig: any = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "GET", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "get", endpoint, {
      ...customConfig,
      method: "GET",
    });
    // log.trace('RestClient get', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async post(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "POST", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "post", endpoint, {
      ...customConfig,
      body,
    });
    // log.trace('RestClient post', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async put(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "PUT", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "put", endpoint, {
      ...customConfig,
      body,
    });
    // log.trace('RestClient put', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async delete(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "DELETE", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "delete", endpoint, {
      ...customConfig,
      body,
    });
    // log.trace('RestClient delete', endpoint, result)
    return result;
  }
}

export default RestClientStub;