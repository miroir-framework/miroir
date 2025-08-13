import {
  LogLevelOptions,
  LoggerFactoryAsyncInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  SpecificLoggerOptionsMap
} from "../0_interfaces/4-services/LoggerInterface";
import { defaultLoggerContextElement, LoggerGlobalContext } from "./LoggerContext";
import { LoggerFilter } from "./LoggerFilter";

const testSeparator = "-";
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
      test: (opts) => testSeparator + (LoggerGlobalContext.getTest() ? LoggerGlobalContext.getTest() : "*NoTest*"),
      testAssertion: (opts) =>
        testSeparator + (LoggerGlobalContext.getTestAssertion() ? LoggerGlobalContext.getTestAssertion() : "*"),
      compositeAction: (opts) =>
        testSeparator + (LoggerGlobalContext.getCompositeAction() ? LoggerGlobalContext.getCompositeAction() : "*"),
      action: (opts) => testSeparator + (LoggerGlobalContext.getAction() ? LoggerGlobalContext.getAction() : "*"),
      template: "#{{testSuite}}{{test}}{{testAssertion}}{{compositeAction}}{{action}}# " + template,
      time: () => new Date().toTimeString().split(" ")[0],
    },
  };
}

// ################################################################################################
export interface RegisteredLoggerToStart {
  returnLoggerContinuation: (value: LoggerInterface | PromiseLike<LoggerInterface>) => void;
  logLevel?: string | number,
  template?: string,

}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export class MiroirLoggerFactory implements LoggerFactoryAsyncInterface {
  static effectiveLoggerFactory: LoggerFactoryInterface | undefined = undefined;
  static loggerOptions?: LoggerOptions;
  static specificLoggerOptionsMap?: SpecificLoggerOptionsMap;
  static defaultLogLevel: string | number;
  static defaultTemplate: string;

  static registeredLoggersToStart: { [k: string]: RegisteredLoggerToStart } = {};

  // ##############################################################################################
  static getLoggerName(
    packageName: string,
    cleanLevel: string,
    functionalityName: string,
  ) {
    return `${cleanLevel}_${packageName}_${functionalityName}`
  }

  // ##############################################################################################
  static registerLoggerToStart(
    loggerName: string,
    logLevel?: string | number,
    template?: string
  ): Promise<LoggerInterface> {
    // console.log("MiroirLoggerFactory.registerLoggerToStart", loggerName, logLevel, template);
    const result = new Promise<LoggerInterface>((resolve) => {
      MiroirLoggerFactory.registeredLoggersToStart[loggerName] = {
        returnLoggerContinuation: resolve,
        logLevel,
        template,
      };
    });
    // console.log("MiroirLoggerFactory.registerLoggerToStart DONE!", loggerName, logLevel, template);
    return result;
  }

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
    console.log("MiroirLoggerFactory getOptionsFromMap result",loggerName, resultlogLevel, resultTemplate);
    return result;
  }

  // ###################################
  static async startRegisteredLoggers(
    effectiveLoggerFactory: LoggerFactoryInterface,
    loggerOptions: LoggerOptions,
    // defaultLogLevel: string | number,
    // defaultTemplate: string,
    // specificLoggerOptionsMap?: SpecificLoggerOptionsMap
  ) {
    // console.log(
    //   "MiroirLoggerFactory.startRegisteredLoggers",
    //   // effectiveLoggerFactory,
    //   "defaultLogLevel",
    //   defaultLogLevel,
    //   "defaultTemplate",
    //   defaultTemplate,
    //   "specificLoggerOptionsMap",
    //   specificLoggerOptionsMap
    // );
    MiroirLoggerFactory.effectiveLoggerFactory = effectiveLoggerFactory;
    MiroirLoggerFactory.defaultLogLevel = loggerOptions.defaultLevel;
    MiroirLoggerFactory.defaultTemplate = loggerOptions.defaultTemplate;
    MiroirLoggerFactory.specificLoggerOptionsMap = loggerOptions.specificLoggerOptions;
    for (const l of Object.entries(MiroirLoggerFactory.registeredLoggersToStart)) {
      // console.log(
      //   "MiroirLoggerFactory.startRegisteredLoggers starting logger",
      //   l[0],
      // );
      // TODO: no await on a resolve, this is a try, rather nonsensical
      const logLevelOptions = MiroirLoggerFactory.getLogLevelOptionsFromMap(l[0], l[1].logLevel, l[1].template);
      await l[1].returnLoggerContinuation(
        new LoggerFilter(
          effectiveLoggerFactory.create(
            logLevelOptions
          ),
          loggerOptions.contextFilter ?? defaultLoggerContextElement,
          l[0], l[1].logLevel as any, l[1].template as any
        )
      );
      console.log(
        "MiroirLoggerFactory.startRegisteredLoggers logger",
        l[0], "started with options:", JSON.stringify(logLevelOptions, null, 2)
      );
    }
    console.log("MiroirLoggerFactory.startRegisteredLoggers DONE!");
  }

  // ###################################
  get loggers(): Record<string, LoggerInterface> {
    return MiroirLoggerFactory.effectiveLoggerFactory?.loggers ?? {};
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
