// pg ships no types and @types/pg is not installed: miroir-env only lists and drops schemas (#477).
declare module "pg" {
  type QueryResult = { rows: any[] };
  class Client {
    constructor(options: { host?: string; port?: number; user?: string; password?: string; database?: string });
    connect(): Promise<void>;
    query(text: string): Promise<QueryResult>;
    end(): Promise<void>;
  }
  const pg: { Client: typeof Client };
  export default pg;
}
