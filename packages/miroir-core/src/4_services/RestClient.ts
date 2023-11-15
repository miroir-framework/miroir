// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { RestClientCallReturnType, RestClientInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RestClient");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ##############################################################################################
export class RestClient implements RestClientInterface {
  constructor(
    private customFetch:(...args:any) => any
  ){
  }

  // ##############################################################################################
  async call(method:string, endpoint:string, args:any = {}):Promise<RestClientCallReturnType> {
    log.info("RestClient call", method, endpoint, args)
    const { body, ...customConfig } = args;
    const headers = { 'Content-Type': 'application/json' }
  
    const config = {
      // method: body ? 'POST' : 'GET',
      method: method,
      ...customConfig,
      headers: {
        ...headers,
        ...customConfig.headers,
      },
    }

    log.debug("RestClient call config", config)

    let data
    try {

      if (body) {
        config.body = JSON.stringify(body)
      }
    
      const response = await this.customFetch(endpoint, config)

      // log.info("RestClient response", response);
      data = await response?.json()
      if (response.ok) {
        // Return a result object similar to Axios
        return {
          status: response.status,
          data,
          headers: response.headers,
          url: response.url,
        }
      }
      throw new Error(response.statusText)
    } catch (err) {
      return Promise.reject(err.message ? err.message : data)
    }
  }

  // ##############################################################################################
  async get(endpoint:string, customConfig:any = {}): Promise<RestClientCallReturnType> {
    const result:RestClientCallReturnType = await this.call('GET', endpoint, { ...customConfig, method: 'GET' })
    log.trace('RestClient get', endpoint, result)
    return result
  }

  // ##############################################################################################
  async post(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result:Promise<RestClientCallReturnType> = this.call('POST', endpoint, { ...customConfig, body })
    log.trace('RestClient post', endpoint, result)
    return result
  }

  // ##############################################################################################
  async put(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result:Promise<RestClientCallReturnType> = this.call('PUT', endpoint, { ...customConfig, body })
    log.trace('RestClient put', endpoint, result)
    return result
  }

  // ##############################################################################################
  async delete(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result:Promise<RestClientCallReturnType> = this.call('DELETE', endpoint, { ...customConfig, body })
    log.trace('RestClient delete', endpoint, result)
    return result
  }
}

export default RestClient;