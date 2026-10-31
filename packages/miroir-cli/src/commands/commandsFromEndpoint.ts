import { type ZodTypeAny } from "zod";

import {
  type Action2ReturnType,
  ApplicationDeploymentMap,
  currentApplicationDeploymentMap,
  DomainControllerInterface,
  executeEndpointAction,
  listEndpointActions,
  MlElement,
  LoggerInterface,
  MiroirLoggerFactory,
  endpointActionEntryZodSchema,
  type EndpointActionEntry,
  type MlObject,
} from "miroir-core";

const packageName = "miroir-cli";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", "commandsFromEndpoint");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// CLI Result Types
// ################################################################################################
export interface CliSuccessResult {
  status: "success";
  command: string;
  result?: any;
}

export interface CliErrorResult {
  status: "error";
  command: string;
  error: {
    type: string;
    message: string;
    stack?: string;
    context?: any;
  };
}

export type CliResult = CliSuccessResult | CliErrorResult;

// ################################################################################################
// CLI Command Handler Types
// ################################################################################################
export type CliExecuteFunction = (
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<CliResult>;

export interface CliCommandDescription {
  name: string;
  description: string;
  options: CliCommandOption[];
}

export interface CliCommandOption {
  name: string;
  description: string;
  required: boolean;
  type: "string" | "boolean" | "json";
}

export interface CliCommandHandler<T extends CliCommandDescription> {
  commandDescription: T;
  payloadZodSchema: ZodTypeAny;
  /** The endpoint action catalog entry the command runs (#627). */
  entry: EndpointActionEntry;
  execute: CliExecuteFunction;
}

export type CliRequestHandlers = Record<string, CliCommandHandler<any>>;

/**
 * Extract CLI command options from ML schema
 */
function extractCommandOptions(mlPayload: MlObject): CliCommandOption[] {
  const options: CliCommandOption[] = [];
  
  if (mlPayload.type !== 'object' || !mlPayload.definition) {
    return options;
  }

  for (const [name, schema] of Object.entries(mlPayload.definition)) {
    const schemaElement = schema as MlElement;
    const isRequired = !schemaElement.optional;
    const description = (schemaElement as any).tag?.value?.description || 
                       (schemaElement as any).tag?.value?.defaultLabel ||
                       `${name} parameter`;
    
    // Determine option type
    let type: "string" | "boolean" | "json" = "string";
    if (schemaElement.type === 'boolean') {
      type = "boolean";
    } else if (schemaElement.type === 'object' || schemaElement.type === 'array' || schemaElement.type === 'record') {
      type = "json";
    }

    options.push({
      name,
      description,
      required: isRequired,
      type,
    });
  }

  return options;
}

// ################################################################################################
/**
 * #263: the emulated server's 401 / 403 reaches the CLI wrapped in persistence errors; report its
 * AuthenticationRequired / AccessDenied as the command's error type.
 */
function authenticationErrorType(error: unknown, depth = 0): string | undefined {
  if (!error || typeof error !== "object" || depth > 8) {
    return undefined;
  }
  const errorType = (error as { errorType?: unknown }).errorType;
  if (errorType === "AccessDenied" || errorType === "AuthenticationRequired") {
    return errorType;
  }
  const inner = (error as { innerError?: unknown }).innerError;
  const innerErrors = Array.isArray(inner) ? inner : [inner];
  for (const innerError of innerErrors) {
    const found = authenticationErrorType(innerError, depth + 1);
    if (found) {
      return found;
    }
  }
  return undefined;
}

// ################################################################################################
// Core Action Handler
// ################################################################################################

/**
 * Validates a command's payload, runs `execute` on it and formats the result for the CLI.
 */
export async function handleCliAction(
  commandName: string,
  params: unknown,
  schema: () => ZodTypeAny,
  execute: (validatedParams: any) => Promise<Action2ReturnType>,
): Promise<CliResult> {
  try {
    log.info(`${commandName} - received params:`, params);
    const validatedParams = schema().parse(params);
    const result = await execute(validatedParams);
    log.info(`${commandName} - result:`, JSON.stringify(result, null, 2));
    if (result.status === "ok") {
      return {
        status: "success",
        command: commandName,
        result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
      };
    }
    return {
      status: "error",
      command: commandName,
      error: {
        type: authenticationErrorType(result) ?? ("errorType" in result ? result.errorType : "unknown"),
        message: ("errorMessage" in result ? result.errorMessage : "Action failed") as any,
        stack: ("errorStack" in result ? result.errorStack : undefined) as any,
        context: "errorContext" in result ? result.errorContext : undefined,
      },
    };
  } catch (error) {
    log.error(`${commandName} - exception:`, error);
    return {
      status: "error",
      command: commandName,
      error: {
        type: "validation_error",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ################################################################################################
// Commands from the endpoint action catalog (#627)
// ################################################################################################

/** The CLI command of one catalog entry, named as the MCP tool of the same action. */
export function cliCommandEntry(entry: EndpointActionEntry): CliCommandHandler<any> {
  // converted on first use: some framework payloads (deep schema references) do not convert, and
  // listing or registering the commands must not depend on that
  let payloadZodSchema: ZodTypeAny | undefined;
  const getPayloadZodSchema = () => (payloadZodSchema ??= endpointActionEntryZodSchema(entry));
  const actionLabel = `CLI: ${entry.actionType.replace(/([A-Z])/g, " $1").trim()}`;
  return {
    commandDescription: {
      name: entry.name,
      description: `${entry.description} (${entry.applicationName})`,
      options: extractCommandOptions(entry.payload as MlObject),
    },
    get payloadZodSchema() {
      return getPayloadZodSchema();
    },
    entry,
    execute: (payload, domainController, applicationDeploymentMap) =>
      handleCliAction(entry.name, payload, getPayloadZodSchema, (validatedPayload) =>
        executeEndpointAction(entry, validatedPayload, {
          domainController,
          applicationDeploymentMap: currentApplicationDeploymentMap(
            domainController.getLocalCache(),
            applicationDeploymentMap,
          ),
          actionLabel,
        }),
      ),
  };
}

/**
 * One command per Endpoint action of every deployed application, from the live model. An entry
 * that cannot be turned into a command is skipped, so one bad Endpoint cannot stop the CLI.
 */
export function getAllCommands(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): CliCommandHandler<any>[] {
  const handlers: CliCommandHandler<any>[] = [];
  for (const entry of listEndpointActions(domainController.getLocalCache(), applicationDeploymentMap)) {
    try {
      handlers.push(cliCommandEntry(entry));
    } catch (error) {
      log.warn(`getAllCommands: skipping ${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return handlers;
}

/** Command names the CLI itself defines, never used as aliases. */
export const RESERVED_CLI_COMMAND_NAMES: readonly string[] = ["list", "help"];

/**
 * Short names: an action type that exactly one command runs is an alias of that command
 * (`lendDocument` for `Library_lendDocument`), unless it is reserved or already a command name.
 */
export function cliCommandAliases(
  handlers: CliCommandHandler<any>[],
  reservedNames: readonly string[] = RESERVED_CLI_COMMAND_NAMES,
): Record<string, string> {
  const commandNames = new Set(handlers.map((handler) => handler.commandDescription.name));
  const byActionType = new Map<string, string[]>();
  for (const handler of handlers) {
    const names = byActionType.get(handler.entry.actionType) ?? [];
    names.push(handler.commandDescription.name);
    byActionType.set(handler.entry.actionType, names);
  }
  const aliases: Record<string, string> = {};
  for (const [actionType, names] of byActionType) {
    if (names.length !== 1 || reservedNames.includes(actionType) || commandNames.has(actionType)) {
      if (names.length > 1 || reservedNames.includes(actionType)) {
        log.info(`cliCommandAliases: no alias ${actionType} (${names.join(", ")})`);
      }
      continue;
    }
    aliases[actionType] = names[0];
  }
  return aliases;
}

/** The command of a name or an alias. */
export function getCommandByName(
  handlers: CliCommandHandler<any>[],
  name: string,
): CliCommandHandler<any> | undefined {
  const commandName = cliCommandAliases(handlers)[name] ?? name;
  return handlers.find((handler) => handler.commandDescription.name === commandName);
}
