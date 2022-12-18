// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

// import { any } from 'prop-types';

export interface MClientCallReturnType {
  status: number;
  data: any;
  // headers: any;
  headers: Headers;
  url: string;
}

export interface MclientI {
  // call(endpoint:string, args:any):Promise<MClientCallReturnType>;
  get(endpoint:string, customConfig?:any): Promise<MClientCallReturnType>;
  post(endpoint:string, body:any, customConfig?:any): Promise<MClientCallReturnType>;
}

export class MClient implements MclientI {
  constructor(
    private customFetch:(...args:any) => any
  ){
    console.log("MClient constructor")
  }

  async call(endpoint:string, args:any = {}):Promise<MClientCallReturnType> {
    console.log("MClient call")
    const { body, ...customConfig } = args;
    const headers = { 'Content-Type': 'application/json' }
  
    const config = {
      method: body ? 'POST' : 'GET',
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
      console.log("MwebClient response", response);
      // const response = await window.fetch(endpoint, config)
      // const response:any = await fetch(endpoint, config)
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
  
  get(endpoint:string, customConfig:any = {}): Promise<MClientCallReturnType> {
    const result:Promise<MClientCallReturnType> = this.call(endpoint, { ...customConfig, method: 'GET' })
    console.log('MClient get',endpoint, result)
    return result
  }
  
  post(endpoint:string, body:any, customConfig = {}): Promise<MClientCallReturnType> {
    console.log('MClient post',endpoint)
    return this.call(endpoint, { ...customConfig, body })
  }
}

export default MClient;