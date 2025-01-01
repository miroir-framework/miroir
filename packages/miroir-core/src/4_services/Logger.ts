import {
  LogLevelOptions,
  LoggerFactoryAsyncInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  SpecificLoggerOptionsMap
} from "../0_interfaces/4-services/LoggerInterface.js";

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
      template: template,
      time: () => new Date().toTimeString().split(" ")[0],
    },
  };
}

// ################################################################################################
export class MiroirLoggerFactory implements LoggerFactoryAsyncInterface {
  static effectiveLoggerFactory: LoggerFactoryInterface | undefined = undefined;
  static specificLoggerOptionsMap?: SpecificLoggerOptionsMap;
  static defaultLogLevel: string | number;
  static defaultTemplate: string;

  static waitingLoggers: {
    [k: string]: {
      options?: {
        loggerName: string,
        logLevel?: string | number,
        template?: string,
      },
      resolve: (value: LoggerInterface | PromiseLike<LoggerInterface>) => void;
    };
  } = {};

  constructor() {}

  // ###################################
  private static getLogLevelOptionsFromMap(
    loggerName: string,
    logLevel?: string | number,
    template?: string,
  ): LogLevelOptions {
    const result =  MiroirLoggerFactory.specificLoggerOptionsMap && MiroirLoggerFactory.specificLoggerOptionsMap[loggerName]
      ? templateLogLevelOptionsFactory(
          loggerName,
          logLevel ?? MiroirLoggerFactory.specificLoggerOptionsMap[loggerName].level ?? MiroirLoggerFactory.defaultLogLevel,
          template ?? MiroirLoggerFactory.specificLoggerOptionsMap[loggerName].template ?? MiroirLoggerFactory.defaultTemplate,
        )
      : templateLogLevelOptionsFactory(
          loggerName,
          logLevel ?? MiroirLoggerFactory.defaultLogLevel,
          template ?? MiroirLoggerFactory.defaultTemplate,
        );
    // console.log("MiroirLoggerFactory getOptionsFromMap result",loggerName,logLevel, template,MiroirLoggerFactory.specificLoggerOptionsMap, result);
    return result;
  }

  // ###################################
  static setEffectiveLoggerFactoryWithLogLevelNext(
    effectiveLoggerFactory: LoggerFactoryInterface,
    defaultLogLevel: string | number,
    defaultTemplate: string,
    specificLoggerOptionsMap?: SpecificLoggerOptionsMap
  ) {
    MiroirLoggerFactory.effectiveLoggerFactory = effectiveLoggerFactory;
    MiroirLoggerFactory.defaultLogLevel = defaultLogLevel;
    MiroirLoggerFactory.defaultTemplate = defaultTemplate;
    MiroirLoggerFactory.specificLoggerOptionsMap = specificLoggerOptionsMap;
    for (const l of Object.entries(MiroirLoggerFactory.waitingLoggers)) {
      l[1].resolve(
        effectiveLoggerFactory.create(
          MiroirLoggerFactory.getLogLevelOptionsFromMap(l[0], l[1].options?.logLevel, l[1].options?.template)
        )
      );
    }
  }

  // ###################################
  static async asyncCreateLogger(
    loggerName: string, 
    logLevel?: string | number,
    template?: string,
    ): Promise<LoggerInterface> {
    
    let result: Promise<LoggerInterface>
    // console.log("MiroirLoggerFactory.create", loggerName, "has to wait:", !MiroirLoggerFactory.effectiveLoggerFactory);
    if (!MiroirLoggerFactory.effectiveLoggerFactory) {
      const getLoggerResult = new Promise<LoggerInterface>((resolve) => {
        // console.log("MiroirLoggerFactory.create received effective logger for", loggerName);

        // TODO: MiroirLoggerFactory.waitingLoggers could be accessed concurrently, so it should be protected??
        delete MiroirLoggerFactory.waitingLoggers[loggerName];
        MiroirLoggerFactory.waitingLoggers = {
          ...MiroirLoggerFactory.waitingLoggers,
          [loggerName]: { resolve: resolve, options: {loggerName, logLevel, template} },
        };
      });
      result =  getLoggerResult;
    } else {
      // console.log("MiroirLoggerFactory.create asked for logger", loggerName, "when root logger is known, ok.");

      result = Promise.resolve(
        MiroirLoggerFactory.effectiveLoggerFactory?.create(MiroirLoggerFactory.getLogLevelOptionsFromMap(loggerName, logLevel, template))
      );
    }
    // return result.then((value)=>{testLogger(loggerName,value); return value})
    return result
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
