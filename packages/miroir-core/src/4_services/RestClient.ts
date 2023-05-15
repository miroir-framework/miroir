// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

import { RestClientCallReturnType, RestClientInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
 
export class RestClient implements RestClientInterface {
  constructor(
    private customFetch:(...args:any) => any
  ){
    console.log("RestClient constructor")
  }

  async call(method:string, endpoint:string, args:any = {}):Promise<RestClientCallReturnType> {
    // console.log("RestClient call")
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
  
    if (body) {
      config.body = JSON.stringify(body)
    }
  
    let data
    try {
      const response = await this.customFetch(endpoint, config)

      // console.log("RestClient response", response);
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

  async get(endpoint:string, customConfig:any = {}): Promise<RestClientCallReturnType> {
    const result:RestClientCallReturnType = await this.call('GET', endpoint, { ...customConfig, method: 'GET' })
    console.log('RestClient get', endpoint, result)
    return result
  }

  async post(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result:Promise<RestClientCallReturnType> = this.call('POST', endpoint, { ...customConfig, body })
    console.log('RestClient post', endpoint, result)
    return result
  }

  async put(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result:Promise<RestClientCallReturnType> = this.call('PUT', endpoint, { ...customConfig, body })
    console.log('RestClient put', endpoint, result)
    return result
  }

  async delete(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    const result:Promise<RestClientCallReturnType> = this.call('DELETE', endpoint, { ...customConfig, body })
    console.log('RestClient delete', endpoint, result)
    return result
  }
}

export default RestClient;