import { MongoClient, Db, Collection, Document } from 'mongodb';
import {
  ACTION_OK,
  Action2Error,
  Action2VoidReturnType,
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory
} from "miroir-core";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDb")
).then((logger: LoggerInterface) => {log = logger});

/**
 * MongoDb is a wrapper around the MongoDB client that manages:
 * - Database connection
 * - Collection management (one collection per Entity UUID)
 * - Basic CRUD operations on documents
 * 
 * Similar to IndexedDb class which uses Level library with sublevels.
 */
export class MongoDb {
  public client: MongoClient | undefined = undefined;
  public db: Db | undefined = undefined;
  private collections: Map<string, Collection<Document>> = new Map();
  private logHeader: string;

  // #############################################################################################
  constructor(
    public applicationSection: ApplicationSection,
    private connectionString: string,
    private databaseName: string
  ) {
    this.logHeader = 'MongoDb ' + databaseName;
  }

  // #############################################################################################
  public async closeObjectStore(): Promise<void> {
    if (this.client) {
      log.info(this.logHeader, 'closeObjectStore closing db', this.databaseName, this.applicationSection, '...');
      await this.client.close();
      log.info(this.logHeader, 'closeObjectStore db closed');
    } else {
      log.info(this.logHeader, 'closeObjectStore db already closed', this.databaseName, this.applicationSection);
    }
    this.client = undefined;
    this.db = undefined;
    this.collections.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async openObjectStore(): Promise<void> {
    try {
      log.info('openObjectStore called for', this.databaseName);
      if (this.client !== undefined && this.db !== undefined) {
        log.info(this.logHeader, 'openObjectStore existing db already opened', this.databaseName);
      } else {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        log.info('openObjectStore created and connected to db', this.databaseName);
        
        // Load existing collections from the database into the internal map
        // This ensures we can properly clear them during resetModel
        const existingCollections = await this.db.listCollections().toArray();
        for (const collInfo of existingCollections) {
          if (!this.collections.has(collInfo.name)) {
            const collection = this.db.collection(collInfo.name);
            this.collections.set(collInfo.name, collection);
            log.debug(this.logHeader, 'loaded existing collection:', collInfo.name);
          }
        }
        log.info(this.logHeader, 'openObjectStore loaded existing collections:', this.getCollections());
      }
      log.info('openObjectStore done for', this.databaseName);
    } catch (error) {
      log.error('openObjectStore could not open', this.databaseName, error);
      throw error;
    }
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async clearObjectStore(): Promise<void> {
    log.info(this.logHeader, 'clearObjectStore clearing all collections');
    if (this.db) {
      const collectionNames = await this.db.listCollections().toArray();
      for (const collInfo of collectionNames) {
        await this.db.collection(collInfo.name).deleteMany({});
        log.debug(this.logHeader, 'clearObjectStore cleared collection:', collInfo.name);
      }
    }
    this.collections.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################
  public addCollections(collectionNames: string[]): void {
    log.info(this.logHeader, 'addCollections:', collectionNames, 'existing collections', this.getCollections());
    if (!this.db) {
      log.error(this.logHeader, 'addCollections called without open database');
      return;
    }
    for (const collectionName of collectionNames) {
      if (!this.collections.has(collectionName)) {
        const collection = this.db.collection(collectionName);
        this.collections.set(collectionName, collection);
        log.debug(this.logHeader, 'added collection:', collectionName);
      }
    }
  }

  // #############################################################################
  public hasCollection(collectionName: string): boolean {
    return this.collections.has(collectionName);
  }

  // #############################################################################
  public getCollections(): string[] {
    return Array.from(this.collections.keys());
  }

  // #############################################################################
  public async removeCollections(collectionNames: string[]): Promise<void> {
    log.info(this.logHeader, 'removeCollections:', collectionNames);
    if (!this.db) {
      log.error(this.logHeader, 'removeCollections called without open database');
      return;
    }
    for (const collectionName of collectionNames) {
      if (this.collections.has(collectionName)) {
        try {
          await this.db.collection(collectionName).drop();
          log.debug(this.logHeader, 'dropped collection:', collectionName);
        } catch (error: any) {
          // Collection might not exist in the database yet
          if (error.codeName !== 'NamespaceNotFound') {
            log.warn(this.logHeader, 'error dropping collection:', collectionName, error);
          }
        }
        this.collections.delete(collectionName);
      }
    }
    return Promise.resolve();
  }

  // #############################################################################################
  public async getInstance(parentUuid: string, instanceUuid: string): Promise<any> {
    const collection = this.collections.get(parentUuid);
    log.debug(this.logHeader, 'getInstance for entity', parentUuid, 'instance uuid', instanceUuid);
    
    if (collection) {
      const result = await collection.findOne({ _id: instanceUuid as any });
      if (result) {
        // Remove MongoDB's _id and return with uuid
        const { _id, ...rest } = result as any;
        return { uuid: _id, ...rest };
      }
      log.warn(this.logHeader, 'getInstance instance not found:', instanceUuid);
      return undefined;
    } else {
      log.error(this.logHeader, 'getInstance collection for parentUuid not found:', parentUuid);
      throw new Error(`Collection ${parentUuid} does not exist!`);
    }
  }

  // #############################################################################################
  public async getAllInstances(parentUuid: string): Promise<any[]> {
    const collection = this.collections.get(parentUuid);
    if (!collection) {
      throw new Error(`Entity ${parentUuid} does not exist!`);
    }
    const results = await collection.find({}).toArray();
    // Transform _id back to uuid for each document
    const transformedResults = results.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { uuid: _id, ...rest };
    });
    log.trace(this.logHeader, 'getAllInstances', parentUuid, "result count", transformedResults.length);
    return Promise.resolve(transformedResults);
  }

  // #############################################################################################
  public async putInstance(parentUuid: string, value: any): Promise<Action2VoidReturnType> {
    const collection = this.collections.get(parentUuid);
    log.debug(this.logHeader, 'putInstance in collection', parentUuid, 'hasCollection:', this.hasCollection(parentUuid), 'value:', value);
    
    if (collection) {
      // Use uuid as _id, remove uuid from document to avoid duplication
      const { uuid, ...rest } = value;
      await collection.replaceOne(
        { _id: uuid as any },
        { ...rest, parentUuid: value.parentUuid },
        { upsert: true }
      );
      return Promise.resolve(ACTION_OK);
    } else {
      log.error(this.logHeader, 'putInstance collection not found:', parentUuid);
      return Promise.resolve(
        new Action2Error("FailedToUpdateInstance", `Collection ${parentUuid} does not exist`)
      );
    }
  }

  // #############################################################################################
  public async putBulkInstances(parentUuid: string, values: any[]): Promise<Action2VoidReturnType> {
    const collection = this.collections.get(parentUuid);
    if (collection) {
      const operations = values.map((value) => {
        const { uuid, ...rest } = value;
        return {
          replaceOne: {
            filter: { _id: uuid as any },
            replacement: { ...rest, parentUuid: value.parentUuid },
            upsert: true
          }
        };
      });
      if (operations.length > 0) {
        await collection.bulkWrite(operations);
      }
      return Promise.resolve(ACTION_OK);
    } else {
      log.error(this.logHeader, 'putBulkInstances collection not found:', parentUuid);
      return Promise.resolve(
        new Action2Error("FailedToUpdateInstance", `Collection ${parentUuid} does not exist`)
      );
    }
  }

  // #############################################################################################
  public async deleteInstance(parentUuid: string, instanceUuid: string): Promise<Action2VoidReturnType> {
    const collection = this.collections.get(parentUuid);
    log.debug(this.logHeader, 'deleteInstance from collection', parentUuid, 'instance', instanceUuid);
    
    if (collection) {
      const result = await collection.deleteOne({ _id: instanceUuid as any });
      if (result.deletedCount === 0) {
        log.warn(this.logHeader, 'deleteInstance instance not found:', instanceUuid);
      }
      return Promise.resolve(ACTION_OK);
    } else {
      log.error(this.logHeader, 'deleteInstance collection not found:', parentUuid);
      return Promise.resolve(
        new Action2Error("FailedToDeleteInstance", `Collection ${parentUuid} does not exist`)
      );
    }
  }
}
