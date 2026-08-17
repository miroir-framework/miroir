import {
  LogLevelOptions,
  LoggerFactoryAsyncInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  SpecificLoggerOptionsMap,
  defaultLevels,
  type LogTopic
} from "../0_interfaces/4-services/LoggerInterface";
import type { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirEventService } from "../3_controllers/MiroirEventService";
import { defaultLoggerContextElement, LoggerGlobalContext } from "./LoggerContext";
import { MiroirLogger } from "./MiroirLogger";
import { PreStartLogger } from "./PreStartLogger.js";

const testSeparator = "-";

/** Default level for pre-start loggers (matches catch-all preset). */
const PRE_START_DEFAULT_LEVEL: keyof typeof defaultLevels = "WARN";

function resolvePreStartDefaultLevel(): keyof typeof defaultLevels {
  const selection =
    (typeof process !== "undefined" && process.env?.MIROIR_LOG_CONFIG) ||
    (typeof process !== "undefined" && process.env?.VITE_MIROIR_LOG_CONFIG) ||
    (typeof process !== "undefined" && process.env?.VITE_MIROIR_LOG_CONFIG_FILENAME);
  if (!selection) {
    return PRE_START_DEFAULT_LEVEL;
  }
  const base = String(selection).split(/[\\/]/).pop()!.replace(/\.json$/i, "");
  if (base === "full-debug") {
    return "DEBUG";
  }
  if (base === "catch-all-detailed") {
    return "INFO";
  }
  return PRE_START_DEFAULT_LEVEL;
}
// ################################################################################################
export function templateLogLevelOptionsFactory(
  loggerName: string,
  level: number | string,
  template: string,
): LogLevelOptions {
  return {
    level: level,
    name: loggerName,
    prefix: {
      level: (opts) => `${opts.level}`,
      name: (opts) => opts.logger.name,
      testSuite: (opts) => LoggerGlobalContext.getTestSuite() ?? "*NoTestSuite*",
      test: (opts) =>
        testSeparator +
        (LoggerGlobalContext.getTest() ? LoggerGlobalContext.getTest() : "*NoTest*"),
      testAssertion: (opts) =>
        testSeparator +
        (LoggerGlobalContext.getTestAssertion() ? LoggerGlobalContext.getTestAssertion() : "*"),
      compositeActionSequence: (opts) =>
        testSeparator +
        (LoggerGlobalContext.getCompositeAction() ? LoggerGlobalContext.getCompositeAction() : "*"),
      action: (opts) =>
        testSeparator + (LoggerGlobalContext.getAction() ? LoggerGlobalContext.getAction() : "*"),
      runToken: () => LoggerGlobalContext.getRunLogPrefix(),
      phase: () => LoggerGlobalContext.getPhase() ?? "*",
      template:
        "{{runToken}} #{{testSuite}}{{test}}{{testAssertion}}{{compositeActionSequence}}{{action}}# {{phase}} " +
        template,
      time: () => new Date().toTimeString().split(" ")[0],
    },
  };
}

// ################################################################################################
export interface RegisteredLoggerToStart {
  returnLoggerContinuation: (value: LoggerInterface | PromiseLike<LoggerInterface>) => void;
  topic?: LogTopic,
  logLevel?: string | number,
  template?: string,
  started?: boolean,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export class MiroirLoggerFactory implements LoggerFactoryAsyncInterface {
  static logLevelNextAsFactory: LoggerFactoryInterface | undefined = undefined;
  static loggerOptions?: LoggerOptions;
  static specificLoggerOptionsMap?: SpecificLoggerOptionsMap;
  static defaultLogLevel: string | number;
  static defaultTemplate: string;

  static registeredLoggersToStart: { [k: string]: RegisteredLoggerToStart } = {};
  static preStartLoggers: Record<string, PreStartLogger> = {};
  static activityTracker: MiroirActivityTracker | undefined;
  static eventService: MiroirEventService | undefined;
  private static startPromise: Promise<void> | undefined;

  // ##############################################################################################
  static getLoggerName(
    packageName: string,
    cleanLevel: string,
    functionalityName: string,
  ) {
    return `${cleanLevel}_${packageName}_${functionalityName}`
  }

  static getStartedActivityTracker(): MiroirActivityTracker | undefined {
    return MiroirLoggerFactory.activityTracker;
  }

  static getStartedEventService(): MiroirEventService | undefined {
    return MiroirLoggerFactory.eventService;
  }

  /** Resolves after `startRegisteredLoggers` completes. No-op if start was never called. */
  static whenRegisteredLoggersStarted(): Promise<void> {
    return MiroirLoggerFactory.startPromise ?? Promise.resolve();
  }

  /**
   * Level-aware tagged logger for module scope before `startRegisteredLoggers` (#43).
   * Use instead of `console as any as LoggerInterface`.
   */
  static getPreStartLogger(loggerName: string): LoggerInterface {
    if (!MiroirLoggerFactory.preStartLoggers[loggerName]) {
      MiroirLoggerFactory.preStartLoggers[loggerName] = new PreStartLogger(
        loggerName,
        defaultLevels[resolvePreStartDefaultLevel()],
      );
    }
    return MiroirLoggerFactory.preStartLoggers[loggerName];
  }

  // ##############################################################################################
  // If called after startRegisteredLoggers, the logger is started immediately (#43).
  static registerLoggerToStart(
    loggerName: string,
    topic?: LogTopic,
    logLevel?: string | number,
    template?: string
  ): Promise<LoggerInterface> {
    MiroirLoggerFactory.getPreStartLogger(loggerName);
    if (
      MiroirLoggerFactory.activityTracker &&
      MiroirLoggerFactory.eventService &&
      MiroirLoggerFactory.logLevelNextAsFactory &&
      MiroirLoggerFactory.loggerOptions
    ) {
      const logger = MiroirLoggerFactory.createLogger(loggerName, topic, logLevel, template);
      MiroirLoggerFactory.preStartLoggers[loggerName]?.bind(logger);
      return Promise.resolve(logger);
    }
    const result = new Promise<LoggerInterface>((resolve) => {
      MiroirLoggerFactory.registeredLoggersToStart[loggerName] = {
        returnLoggerContinuation: resolve,
        topic,
        logLevel,
        template,
      };
    });
    return result;
  }

  // ###################################
  constructor() {}

  // ###################################
  private static getLogLevelOptionsFromMap(
    loggerName: string,
    logLevel?: string | number,
    template?: string
  ): LogLevelOptions {
    const resultlogLevel =
      MiroirLoggerFactory.specificLoggerOptionsMap && MiroirLoggerFactory.specificLoggerOptionsMap[loggerName]
        ? logLevel ??
          MiroirLoggerFactory.specificLoggerOptionsMap[loggerName].level ??
          MiroirLoggerFactory.defaultLogLevel
        : logLevel ?? MiroirLoggerFactory.defaultLogLevel;

    const resultTemplate =
      MiroirLoggerFactory.specificLoggerOptionsMap && MiroirLoggerFactory.specificLoggerOptionsMap[loggerName]
        ? template ?? MiroirLoggerFactory.specificLoggerOptionsMap[loggerName].template ?? MiroirLoggerFactory.defaultTemplate
        : template ?? MiroirLoggerFactory.defaultTemplate;

    const result = templateLogLevelOptionsFactory(loggerName, resultlogLevel, resultTemplate);
    // console.log("MiroirLoggerFactory getOptionsFromMap result",loggerName, resultlogLevel, resultTemplate);
    return result;
  }

  private static createLogger(
    loggerName: string,
    topic?: LogTopic,
    logLevel?: string | number,
    template?: string,
  ): LoggerInterface {
    if (
      !MiroirLoggerFactory.activityTracker ||
      !MiroirLoggerFactory.eventService ||
      !MiroirLoggerFactory.logLevelNextAsFactory ||
      !MiroirLoggerFactory.loggerOptions
    ) {
      throw new Error("MiroirLoggerFactory.createLogger called before startRegisteredLoggers");
    }
    const logLevelOptions = MiroirLoggerFactory.getLogLevelOptionsFromMap(
      loggerName,
      logLevel,
      template,
    );
    return new MiroirLogger(
      MiroirLoggerFactory.activityTracker,
      MiroirLoggerFactory.eventService,
      MiroirLoggerFactory.logLevelNextAsFactory.create(logLevelOptions),
      MiroirLoggerFactory.loggerOptions.contextFilter ?? defaultLoggerContextElement,
      loggerName,
      logLevel as any,
      template as any,
      topic,
    );
  }

  // ###################################
  static async startRegisteredLoggers(
    activityTracker: MiroirActivityTracker,
    eventService: MiroirEventService,
    logLevelNextAsFactory: LoggerFactoryInterface,
    loggerOptions: LoggerOptions,
  ) {
    MiroirLoggerFactory.activityTracker = activityTracker;
    MiroirLoggerFactory.eventService = eventService;
    MiroirLoggerFactory.logLevelNextAsFactory = logLevelNextAsFactory;
    MiroirLoggerFactory.loggerOptions = loggerOptions;
    MiroirLoggerFactory.defaultLogLevel = loggerOptions.defaultLevel;
    MiroirLoggerFactory.defaultTemplate = loggerOptions.defaultTemplate;
    MiroirLoggerFactory.specificLoggerOptionsMap = loggerOptions.specificLoggerOptions;

    const startPending = async () => {
      for (const l of Object.entries(MiroirLoggerFactory.registeredLoggersToStart)) {
        if (l[1].started) {
          continue;
        }
        const logger = MiroirLoggerFactory.createLogger(
          l[0],
          l[1].topic,
          l[1].logLevel,
          l[1].template,
        );
        MiroirLoggerFactory.preStartLoggers[l[0]]?.bind(logger);
        await l[1].returnLoggerContinuation(logger);
        l[1].started = true;
      }
    };

    if (!MiroirLoggerFactory.startPromise) {
      MiroirLoggerFactory.startPromise = startPending();
      return MiroirLoggerFactory.startPromise;
    }
    await MiroirLoggerFactory.startPromise;
    await startPending();
  }

  // ###################################
  get loggers(): Record<string, LoggerInterface> {
    return MiroirLoggerFactory.logLevelNextAsFactory?.loggers ?? {};
  }
}

// ################################################################################################
export function testLogger(loggerName: string, log: LoggerInterface) {
  console.log("###############################", loggerName, "logger Test: level", log.level);
  log.trace("loggerName:", loggerName, "@@@@@@@@@@@@ TRACE");
  log.debug("loggerName:", loggerName, "@@@@@@@@@@@@ DEBUG");
  log.info("loggerName:", loggerName, "@@@@@@@@@@@@ INFO");
  log.log("loggerName:", loggerName, "@@@@@@@@@@@@ LOG");
  log.warn("loggerName:", loggerName, "@@@@@@@@@@@@ WARN");
  log.error("loggerName:", loggerName, "@@@@@@@@@@@@ ERROR");
  console.log("#################### END TEST LOGS");
}
