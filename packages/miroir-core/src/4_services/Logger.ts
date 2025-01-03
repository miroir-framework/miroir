import {
  LogLevelOptions,
  LoggerFactoryAsyncInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  SpecificLoggerOptionsMap
} from "../0_interfaces/4-services/LoggerInterface.js";
import { CurrentlyExecuting } from "./CurrentlyExecuting.js";

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
      testSuite: (opts) => CurrentlyExecuting.getTestSuite() ?? "*",
      test: (opts) => testSeparator + (CurrentlyExecuting.getTest() ? CurrentlyExecuting.getTest() : "*"),
      testAssertion: (opts) =>
        testSeparator + (CurrentlyExecuting.getTestAssertion() ? CurrentlyExecuting.getTestAssertion() : "*"),
      compositeAction: (opts) =>
        testSeparator + (CurrentlyExecuting.getCompositeAction() ? CurrentlyExecuting.getCompositeAction() : "*"),
      action: (opts) => testSeparator + (CurrentlyExecuting.getAction() ? CurrentlyExecuting.getAction() : "*"),
      template: "##{{testSuite}}{{test}}{{testAssertion}}{{compositeAction}}{{action}}## " + template,
      time: () => new Date().toTimeString().split(" ")[0],
    },
  };
}

export interface RegisteredLoggerToStart {
  startLogger: (value: LoggerInterface | PromiseLike<LoggerInterface>) => void;
  logLevel?: string | number,
  template?: string,

}
// ################################################################################################
export class MiroirLoggerFactory implements LoggerFactoryAsyncInterface {
  static effectiveLoggerFactory: LoggerFactoryInterface | undefined = undefined;
  static specificLoggerOptionsMap?: SpecificLoggerOptionsMap;
  static defaultLogLevel: string | number;
  static defaultTemplate: string;

  // static registeredLoggersToStart: { [k: string]: (value: LoggerInterface | PromiseLike<LoggerInterface>) => void } = {};
  static registeredLoggersToStart: { [k: string]: RegisteredLoggerToStart } = {};

  static getLoggerName(
    packageName: string,
    cleanLevel: string,
    functionalityName: string,
  ) {
    return `${cleanLevel}_${packageName}_${functionalityName}`
  }
  
  static registerLoggerToStart(
    loggerName: string,
    logLevel?: string | number,
    template?: string
  ): Promise<LoggerInterface> {
    // console.log("MiroirLoggerFactory.registerLoggerToStart", loggerName, logLevel, template);
    const result = new Promise<LoggerInterface>((resolve) => {
      MiroirLoggerFactory.registeredLoggersToStart[loggerName] = {
        startLogger: resolve,
        logLevel,
        template,
      };
    });
    console.log("MiroirLoggerFactory.registerLoggerToStart DONE!", loggerName, logLevel, template);
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
    // console.log("MiroirLoggerFactory getOptionsFromMap result",loggerName, resultlogLevel, resultTemplate);
    return result;
  }

  // ###################################
  static async startRegisteredLoggers(
    effectiveLoggerFactory: LoggerFactoryInterface,
    defaultLogLevel: string | number,
    defaultTemplate: string,
    specificLoggerOptionsMap?: SpecificLoggerOptionsMap
  ) {
    console.log("MiroirLoggerFactory.startRegisteredLoggers", effectiveLoggerFactory, defaultLogLevel, defaultTemplate, specificLoggerOptionsMap);
    MiroirLoggerFactory.effectiveLoggerFactory = effectiveLoggerFactory;
    MiroirLoggerFactory.defaultLogLevel = defaultLogLevel;
    MiroirLoggerFactory.defaultTemplate = defaultTemplate;
    MiroirLoggerFactory.specificLoggerOptionsMap = specificLoggerOptionsMap;
    for (const l of Object.entries(MiroirLoggerFactory.registeredLoggersToStart)) {
      console.log(
        "MiroirLoggerFactory.startRegisteredLoggers starting logger",
        l[0],
      );
      // TODO: no await on a resolve, this is a try, rather nonsensical
      await l[1].startLogger(
        effectiveLoggerFactory.create(
          MiroirLoggerFactory.getLogLevelOptionsFromMap(l[0], l[1].logLevel, l[1].template)
        )
      );
      console.log(
        "MiroirLoggerFactory.startRegisteredLoggers logger",
        l[0], "started!"
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
