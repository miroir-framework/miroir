

import {
  // mcpRequestHandlers,
  // mcpRequestHandlers_Library_lendingEndpoint
} from "../../src/tools/handlersForEndpoint.js";

import loglevelNextLog from 'loglevelnext';
import {
  defaultLevels,
  LoggerInterface,
  MiroirLoggerFactory,
  noValue,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type SpecificLoggerOptionsMap
} from "miroir-core";
import {
  book1,
  entityBook,
  selfApplicationLibrary,
  user1,
} from "miroir-test-app_deployment-library";
import { getMcpRequestHandlers } from "../../src/index.js";


const packageName = "miroir-mcp";
const fileName = "mcpTools.test";
  
const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
}

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  // context: undefined,
  specificLoggerOptions: specificLoggerOptions,
}

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", fileName)
).then((logger: LoggerInterface) => {
  log = logger;
});


// ################################################################################################
export interface McpToolTest {
  testName: string;
  toolName: string;
  handler: any;
  params: any;
  tests: (expect: any, result: any) => void;
}

const mcpRequestHandlers = getMcpRequestHandlers();

// ################################################################################################
const testEntity = entityBook; // Book entity
const testEntityUuid = entityBook.uuid; // Book entity
const testApplicationUuid = selfApplicationLibrary.uuid; // Library
const testInstance = book1; // Book1 instance
const testInstanceUuid = book1.uuid; // Book1 instance
const testBookUuid = (noValue as any).uuid; // A book UUID to be used in tests
export const mcpInstanceActionTests: McpToolTest[] = [
  {
    testName: "should execute createInstance action",
    toolName: "miroir_createInstance",
    handler: mcpRequestHandlers.miroir_createInstance,
    params: {
      application: selfApplicationLibrary.uuid,
      applicationSection: "data" as const,
      parentUuid: entityBook.uuid,
      objects: [
        {
          parentName: "Book",
          parentUuid: entityBook.uuid,
          applicationSection: "data" as const,
          instances: [
            {
              uuid: testBookUuid,
              parentUuid: entityBook.uuid,
              name: "Test Book from MCP",
              author: "Test Author",
              isbn: "TEST-123",
            } as any,
          ],
        },
      ],
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].parsed?.status).toBe("success");
    },
  },
  {
    testName: "should execute getInstance action",
    toolName: "miroir_getInstance",
    handler: mcpRequestHandlers.miroir_getInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      uuid: testInstanceUuid,
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].parsed?.status).toBe("success");
    },
  },
  {
    testName: "should execute getInstances action",
    toolName: "miroir_getInstances",
    handler: mcpRequestHandlers.miroir_getInstances,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].parsed?.status).toBe("success");
    },
  },
  {
    testName: "should execute updateInstance action",
    toolName: "miroir_updateInstance",
    handler: mcpRequestHandlers.miroir_updateInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      objects: [
        {
          parentName: testEntity.name,
          parentUuid: testEntity.uuid,
          applicationSection: "data" as const,
          instances: [
            {
              ...testInstance,
              name: "Updated Book Name from MCP",
            } as any,
          ],
        },
      ],
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].parsed?.status).toBe("success");
    },
  },
  {
    testName: "should execute deleteInstance action",
    toolName: "miroir_deleteInstance",
    handler: mcpRequestHandlers.miroir_deleteInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      objects: [
        testInstance
      ],
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].parsed?.status).toBe("success");
    },
  },
  {
    testName: "calling deleteInstance action on non-existing instance should return error in content",
    toolName: "miroir_deleteInstance",
    handler: mcpRequestHandlers.miroir_deleteInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      uuid: "non-existing-uuid",
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].parsed?.status).toBe("error");
    },
  },
  {
    testName: "calling getInstance action on non-existing instance should return error in content",
    toolName: "miroir_getInstance",
    handler: mcpRequestHandlers.miroir_getInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      uuid: "non-existent-uuid",
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].parsed?.status).toBe("error");
    },
  },
];

// ################################################################################################
export const mcpLibraryEndpointTests: McpToolTest[] = [
  {
    testName: "should execute lendDocument action",
    toolName: "miroir_lendDocument",
    handler: mcpRequestHandlers.miroir_lendDocument,
    params: {
      book: book1.uuid,
      user: user1.uuid,
      startDate: new Date().toISOString(),
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toMatch("success");
    },
  },
];

if (!mcpLibraryEndpointTests) {
  // console.warn("lendDocument handler not found in mcpRequestHandlers, library endpoint tests will be skipped");
  throw new Error("lendDocument handler not found in mcpRequestHandlers, library endpoint tests cannot be executed");
}

export const ALL_MCP_TEST_CASES: McpToolTest[] = [
  // ...mcpInstanceActionTests,
  ...mcpLibraryEndpointTests,
];
