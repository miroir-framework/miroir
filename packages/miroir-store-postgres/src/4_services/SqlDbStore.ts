import {
  ACTION_OK,
  Action2VoidReturnType,
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAbstractInterface
} from "miroir-core";
import { Sequelize } from "sequelize";
import { packageName } from "../constants";
import { EntityUuidIndexedSequelizeModel } from "../utils";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbStore")
).then((logger: LoggerInterface) => {log = logger});

export class SqlDbStore implements PersistenceStoreAbstractInterface {
  public sqlSchemaTableAccess: EntityUuidIndexedSequelizeModel = {};
  public sequelize: Sequelize;

  // ##############################################################################################
  constructor(
    // actual arguments are:
    public applicationSection: ApplicationSection,
    public sqlDbStoreName: string, // used only for debugging purposes
    public connectionString: string,
    public schema: string,
    public logHeader: string
  ) // ...args: any[] // mixin constructors are limited to args:any[] parameters
  {
    log.info(
      this.logHeader,
      "constructor called with sqlDbStoreName",
      this.sqlDbStoreName,
      "connectionString",
      this.connectionString,
      "schema",
      this.schema,
    );
    this.sequelize = new Sequelize(this.connectionString, {
      dialect: "postgres",
      schema: this.schema,
      define: {
        timestamps: false,
      },
      // timestamps: false,
    }); // Example for postgres
  }

  // ##############################################################################################
  async close(): Promise<Action2VoidReturnType> {
    await this.sequelize.close();
    return Promise.resolve(ACTION_OK);
    // disconnect from DB?
  }

  // ##############################################################################################
  getStoreName(): string {
    return this.sqlDbStoreName;
  }

  // ##############################################################################################
  public async open(): Promise<Action2VoidReturnType> {
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
    return Promise.resolve(ACTION_OK);
  }
}
