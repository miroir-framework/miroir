// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { RestClientCallReturnType, RestClientInterface } from "../0_interfaces/4-services/PersistenceInterface.js";
import { packageName } from "../constants.js";
import { MiroirLoggerFactory } from "./LoggerFactory.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestClient")
).then((logger: LoggerInterface) => {log = logger});


// ##############################################################################################
export class RestClient implements RestClientInterface {
  constructor(private customFetch: (...args: any) => any) {}

  // ##############################################################################################
  async call(
    rawUrl: string, 
    method: string, 
    endpoint: string, 
    args: any = {}
  ): Promise<RestClientCallReturnType> {
    // log.info("RestClient call", method, endpoint, args)
    const { body, ...customConfig } = args;
    const headers = { "Content-Type": "application/json" };

    const config = {
      method: method,
      ...customConfig,
      headers: {
        ...headers,
        ...customConfig.headers,
      },
    };

    // log.debug("RestClient call config", config)

    let data;
    try {
      if (body) {
        config.body = JSON.stringify(body);
        // config.body = body;
      }
      // log.info("RestClient for header", method, endpoint, "sending body", config.body);
      // log.info("RestClient for header", method, endpoint, "using config", JSON.stringify(config, undefined, 2));
      log.info("RestClient for header", method, endpoint, "using config", config, undefined, 2);

      log.info("RestClient using fetch", this.customFetch);
      const response = await this.customFetch(endpoint, config);

      const responseText: string = await response.text();
      log.info("RestClient response length", responseText.length, responseText);
      const data = responseText.length > 0 ? JSON.parse(responseText) : undefined;
      log.info("RestClient parsed response", data);
      if (response.ok) {
        return {
          status: response.status,
          data,
          headers: response.headers,
          url: response.url,
        };
      }
      throw new Error(response.statusText);
    } catch (err: any) {
      return Promise.reject(err.message ? err.message : data);
    }
  }

  // ##############################################################################################
  async get(rawUrl: string, endpoint: string, customConfig: any = {}): Promise<RestClientCallReturnType> {
    const result: RestClientCallReturnType = await this.call(rawUrl, "GET", endpoint, { ...customConfig, method: "GET" });
    // log.trace('RestClient get', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async post(rawUrl: string, endpoint: string, body: any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result: RestClientCallReturnType = await this.call(rawUrl, "POST", endpoint, { ...customConfig, body });
    // log.trace('RestClient post', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async put(rawUrl: string, endpoint: string, body: any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result: RestClientCallReturnType = await this.call(rawUrl, "PUT", endpoint, { ...customConfig, body });
    // log.trace('RestClient put', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async delete(rawUrl: string, endpoint: string, body: any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result: RestClientCallReturnType = await this.call(rawUrl, "DELETE", endpoint, { ...customConfig, body });
    // log.trace('RestClient delete', endpoint, result)
    return result;
  }
}

export default RestClient;