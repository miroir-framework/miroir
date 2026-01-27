import {
  book1,
  entityBook,
  selfApplicationLibrary,
  user1,
  type ApplicationDeploymentMap,
  type DomainControllerInterface
} from "miroir-core";


import {
  mcpRequestHandlers_EntityEndpoint,
  mcpRequestHandlers_Library_lendingEndpoint
} from "../../src/tools/handlersForEndpoint.js";

import loglevelNextLog from 'loglevelnext';
import {
  defaultLevels,
  LoggerInterface,
  MiroirLoggerFactory,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type SpecificLoggerOptionsMap
} from "miroir-core";
import { expect, it } from "vitest";


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
  name: string;
  handler: any;
  params: any;
  tests: (expect: any, result: any) => void;
}

// ################################################################################################
const testEntity = entityBook; // Book entity
const testEntityUuid = entityBook.uuid; // Book entity
const testApplicationUuid = selfApplicationLibrary.uuid; // Library
const testInstance = book1; // Book1 instance
const testInstanceUuid = book1.uuid; // Book1 instance

export const mcpInstanceActionTests: McpToolTest[] = [
  {
    name: "should execute createInstance action",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_createInstance,
    params: {
      application: selfApplicationLibrary.uuid,
      applicationSection: "data" as const,
      parentUuid: entityBook.uuid,
      instances: [
        {
          parentName: "Book",
          parentUuid: entityBook.uuid,
          applicationSection: "data" as const,
          instances: [
            {
              uuid: "test-book-" + Date.now(),
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
    },
  },
  {
    name: "should execute getInstance action",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_getInstance,
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
    },
  },
  {
    name: "should execute getInstances action",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_getInstances,
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
    },
  },
  {
    name: "should execute updateInstance action",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_updateInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      instances: [
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
    },
  },
  {
    name: "should execute deleteInstance action",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_deleteInstance,
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
    },
  },
  {
    name: "calling deleteInstance action on non-existing instance should return error in content",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_deleteInstance,
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
      // Error should be in the text content
      const contentText = result.content[0].text;
      expect(contentText).toContain("error");
    },
  },
  {
    name: "calling getInstance action on non-existing instance should return error in content",
    handler: mcpRequestHandlers_EntityEndpoint.miroir_getInstance,
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
      // Error should be in the text content
      const contentText = result.content[0].text;
      expect(contentText).toContain("error");
    },
  },
];

// ################################################################################################
export const mcpLibraryEndpointTests: McpToolTest[] = [
  {
    name: "should execute lendDocument action",
    handler: mcpRequestHandlers_Library_lendingEndpoint.miroir_lendDocument,
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

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export async function runMcpTests(
  // mcpTests: McpToolTest[],
  mcpTest: McpToolTest,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  timeout = 30000,
) {
        const result = await mcpTest.handler.actionHandler(
          mcpTest.params,
          domainController,
          applicationDeploymentMap,
        );
        log.info(`${mcpTest.name} result:`, JSON.stringify(result, null, 2));
        // Verify the MCP layer processed the action correctly
        mcpTest.tests(expect, result);
        return result;
}
