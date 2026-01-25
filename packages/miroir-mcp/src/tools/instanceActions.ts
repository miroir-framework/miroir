import { z } from "zod";

/**
 * MCP Tool definitions for all 7 InstanceEndpoint actions
 * These match the InstanceAction types from miroir-core
 */

// Common schemas
export const UuidSchema = z.string().uuid();
export const ApplicationSectionSchema = z.enum(["model", "data"]);
export const EntityInstanceSchema = z.object({
  uuid: UuidSchema,
  parentUuid: UuidSchema,
}).passthrough(); // Allow additional properties

// // ################################################################################################
// // Tool: miroir_createInstance
// // ################################################################################################
// export const CreateInstanceToolSchema = z.object({
//   applicationSection: ApplicationSectionSchema,
//   deploymentUuid: UuidSchema,
//   parentUuid: UuidSchema.describe("Entity UUID (parent of instances to create)"),
//   instances: z.array(EntityInstanceSchema).describe("Array of entity instances to create"),
// });

export const createInstanceTool = {
  name: "miroir_createInstance",
  description:
    "Create new entity instances in Miroir. Creates one or more instances of a specific entity type in the specified application deployment.",
  inputSchema: {
    type: "object",
    properties: {
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section where instances will be created (model or data)",
      },
      deploymentUuid: {
        type: "string",
        description: "Deployment UUID where instances will be created",
      },
      parentUuid: {
        type: "string",
        description: "Entity UUID (parent entity of the instances to create)",
      },
      instances: {
        type: "array",
        description: "Array of entity instances to create. Each must have uuid and parentUuid.",
        items: {
          type: "object",
          properties: {
            uuid: { type: "string", description: "Instance UUID" },
            parentUuid: { type: "string", description: "Parent entity UUID" },
          },
          required: ["uuid", "parentUuid"],
          additionalProperties: true,
        },
      },
    },
    required: ["applicationSection", "deploymentUuid", "parentUuid", "instances"],
  },
};

// ################################################################################################
// Tool: miroir_getInstance
// ################################################################################################
// export const GetInstanceToolSchema = z.object({
//   application: UuidSchema,
//   applicationSection: ApplicationSectionSchema,
//   parentUuid: UuidSchema.describe("Entity UUID"),
//   uuid: UuidSchema.describe("Instance UUID to retrieve"),
// });

export const getInstanceTool = {
  name: "miroir_getInstance",
  description:
    "Retrieve a single entity instance by UUID. Returns the complete instance data for the specified entity instance.",
  inputSchema: {
    type: "object",
    properties: {
      application: {
        type: "string",
        description: "UUID of Application to query",
      },
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section to query (model or data)",
      },
      parentUuid: {
        type: "string",
        description: "UUID of Entity (parent entity)",
      },
      uuid: {
        type: "string",
        description: "UUID of Instance to retrieve",
      },
    },
    required: ["application", "applicationSection", "parentUuid", "uuid"],
  },
};

// ################################################################################################
// Tool: miroir_getInstances
// ################################################################################################
// export const GetInstancesToolSchema = z.object({
//   application: UuidSchema,
//   applicationSection: ApplicationSectionSchema,
//   parentUuid: UuidSchema.describe("Entity UUID"),
// });

export const getInstancesTool = {
  name: "miroir_getInstances",
  description:
    "Retrieve all instances of a specific entity type. Returns an array of all instances for the given entity.",
  inputSchema: {
    type: "object",
    properties: {
      application: {
        type: "string",
        description: "Application UUID to query",
      },
      parentUuid: {
        type: "string",
        description: "Entity UUID to get all instances for",
      },
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section to query (model or data)",
      },
    },
    required: [ "application", "applicationSection","parentUuid"],
  },
};

// ################################################################################################
// Tool: miroir_updateInstance
// ################################################################################################
// export const UpdateInstanceToolSchema = z.object({
//   applicationSection: ApplicationSectionSchema,
//   deploymentUuid: UuidSchema,
//   instances: z.array(EntityInstanceSchema).describe("Array of entity instances to update"),
// });

export const updateInstanceTool = {
  name: "miroir_updateInstance",
  description:
    "Update existing entity instances. Updates one or more instances with new data. Instances are identified by their uuid and parentUuid.",
  inputSchema: {
    type: "object",
    properties: {
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section where instances will be updated",
      },
      deploymentUuid: {
        type: "string",
        description: "Deployment UUID",
      },
      instances: {
        type: "array",
        description: "Array of entity instances with updated data",
        items: {
          type: "object",
          properties: {
            uuid: { type: "string", description: "Instance UUID" },
            parentUuid: { type: "string", description: "Parent entity UUID" },
          },
          required: ["uuid", "parentUuid"],
          additionalProperties: true,
        },
      },
    },
    required: ["applicationSection", "deploymentUuid", "instances"],
  },
};

// ################################################################################################
// Tool: miroir_deleteInstance
// ################################################################################################
// export const DeleteInstanceToolSchema = z.object({
//   applicationSection: ApplicationSectionSchema,
//   deploymentUuid: UuidSchema,
//   parentUuid: UuidSchema.describe("Entity UUID"),
//   uuid: UuidSchema.describe("Instance UUID to delete"),
// });

export const deleteInstanceTool = {
  name: "miroir_deleteInstance",
  description:
    "Delete a single entity instance by UUID. Removes the instance from the specified deployment.",
  inputSchema: {
    type: "object",
    properties: {
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section containing the instance",
      },
      deploymentUuid: {
        type: "string",
        description: "Deployment UUID",
      },
      parentUuid: {
        type: "string",
        description: "Entity UUID (parent entity)",
      },
      uuid: {
        type: "string",
        description: "Instance UUID to delete",
      },
    },
    required: ["applicationSection", "deploymentUuid", "parentUuid", "uuid"],
  },
};

// ################################################################################################
// Tool: miroir_deleteInstanceWithCascade
// ################################################################################################
// export const DeleteInstanceWithCascadeToolSchema = z.object({
//   applicationSection: ApplicationSectionSchema,
//   deploymentUuid: UuidSchema,
//   parentUuid: UuidSchema.describe("Entity UUID"),
//   uuid: UuidSchema.describe("Instance UUID to delete"),
// });

export const deleteInstanceWithCascadeTool = {
  name: "miroir_deleteInstanceWithCascade",
  description:
    "Delete an entity instance and all its dependent instances (cascade delete). Removes the instance and any related instances that reference it.",
  inputSchema: {
    type: "object",
    properties: {
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section containing the instance",
      },
      deploymentUuid: {
        type: "string",
        description: "Deployment UUID",
      },
      parentUuid: {
        type: "string",
        description: "Entity UUID (parent entity)",
      },
      uuid: {
        type: "string",
        description: "Instance UUID to delete with cascade",
      },
    },
    required: ["applicationSection", "deploymentUuid", "parentUuid", "uuid"],
  },
};

// ################################################################################################
// Tool: miroir_loadNewInstancesInLocalCache
// ################################################################################################
// export const LoadNewInstancesInLocalCacheToolSchema = z.object({
//   applicationSection: ApplicationSectionSchema,
//   deploymentUuid: UuidSchema,
//   parentUuid: UuidSchema.describe("Entity UUID"),
//   instances: z.array(EntityInstanceSchema).describe("Array of instances to load in cache"),
// });

export const loadNewInstancesInLocalCacheTool = {
  name: "miroir_loadNewInstancesInLocalCache",
  description:
    "Load new instances into the local cache without persisting them. Useful for temporary data or previewing changes before committing.",
  inputSchema: {
    type: "object",
    properties: {
      applicationSection: {
        type: "string",
        enum: ["model", "data"],
        description: "Section for cache loading",
      },
      deploymentUuid: {
        type: "string",
        description: "Deployment UUID",
      },
      parentUuid: {
        type: "string",
        description: "Entity UUID (parent entity)",
      },
      instances: {
        type: "array",
        description: "Array of instances to load in local cache",
        items: {
          type: "object",
          properties: {
            uuid: { type: "string", description: "Instance UUID" },
            parentUuid: { type: "string", description: "Parent entity UUID" },
          },
          required: ["uuid", "parentUuid"],
          additionalProperties: true,
        },
      },
    },
    required: ["applicationSection", "deploymentUuid", "parentUuid", "instances"],
  },
};

// ################################################################################################
// Export all tools
// ################################################################################################
export const allInstanceActionTools = [
  createInstanceTool,
  getInstanceTool,
  getInstancesTool,
  updateInstanceTool,
  deleteInstanceTool,
  deleteInstanceWithCascadeTool,
  loadNewInstancesInLocalCacheTool,
];
