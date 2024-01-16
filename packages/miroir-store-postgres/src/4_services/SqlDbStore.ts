import { AbstractStoreInterface, ActionReturnType, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlUuidEntityDefinition } from "../utils";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class SqlDbStore implements AbstractStoreInterface {
  public sqlSchemaTableAccess: SqlUuidEntityDefinition = {};
  public sequelize: Sequelize;

  // ##############################################################################################
  constructor(
    // actual arguments are:
    public sqlDbStoreName: string, // used only for debugging purposes
    public connectionString:string,
    public schema:string,
    public logHeader: string,
    // ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    this.sequelize = new Sequelize(this.connectionString, { schema: this.schema }); // Example for postgres
  }

  // ##############################################################################################
  async close(): Promise<ActionReturnType> {
    await this.sequelize.close();
    return Promise.resolve( { status: "ok" } );
    // disconnect from DB?
  }

  // ##############################################################################################
  getStoreName(): string {
    return this.sqlDbStoreName;
  }

  // ##############################################################################################
  public async open(): Promise<ActionReturnType> {
    try {
      await this.sequelize.authenticate();
      log.info(
        this.logHeader,
        "data Connection to postgres data schema",
        this.schema,
        "has been established successfully."
      );
    } catch (error) {
      log.error("Unable to connect data", this.schema, " to the postgres database:", error);
    }
    return Promise.resolve( { status: "ok" } );
  }
}
