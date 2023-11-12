import {
  FactoryLevels,
  LogLevelOptions,
  LoggerFactoryAsyncInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  defaultLevels,
} from "../0_interfaces/4-services/LoggerInterface";

// ################################################################################################
export class MiroirLoggerFactory implements LoggerFactoryAsyncInterface {
  static effectiveLoggerFactory: LoggerFactoryInterface | undefined = undefined;
  // static waitingLoggers: {[k:string]:Promise<LoggerInterface>} = {}
  static waitingLoggers: {
    [k: string]: {
      options: LogLevelOptions | string;
      resolve: (value: LoggerInterface | PromiseLike<LoggerInterface>) => void;
    };
  } = {};

  constructor() {}

  static setEffectiveLogger(effectiveLoggerFactory: LoggerFactoryInterface) {
    console.log("setEffectiveLogger", effectiveLoggerFactory);

    MiroirLoggerFactory.effectiveLoggerFactory = effectiveLoggerFactory;
    for (const l of Object.entries(MiroirLoggerFactory.waitingLoggers)) {
      console.log("notifying", l[0]);
      // l[1](effectiveLogger.getLogger(l[0]))
      l[1].resolve(effectiveLoggerFactory.create(l[1].options));
      console.log("done notifying", l[0]);
    }
  }

  // async getLogger(name: string): Promise<LoggerInterface> {
  async create(opts: LogLevelOptions | string): Promise<LoggerInterface> {
    const name = typeof opts == "string" ? opts : opts.name ?? "";
    console.log("getLogger", name, "has to wait:", !MiroirLoggerFactory.effectiveLoggerFactory);
    if (!MiroirLoggerFactory.effectiveLoggerFactory) {
      const getLoggerResult = new Promise<LoggerInterface>((resolve) => {
        console.log("received effective logger for", name);

        // const resolveResult = MiroirLogger.waitingLoggers[name];
        delete MiroirLoggerFactory.waitingLoggers[name];
        // resolve(resolveResult);
        MiroirLoggerFactory.waitingLoggers = {
          ...MiroirLoggerFactory.waitingLoggers,
          [name]: { resolve: resolve, options: opts },
        };
      });
      // MiroirLogger.waitingLoggers = {...MiroirLogger.waitingLoggers, [name]:getLoggerResult};
      return getLoggerResult;
    } else {
      console.log("asked for logger", name, "when root logger is known, ok.");

      return Promise.resolve(MiroirLoggerFactory.effectiveLoggerFactory?.create(opts));
    }
  }

  get loggers(): Record<string, LoggerInterface> {
    return MiroirLoggerFactory.effectiveLoggerFactory?.loggers ?? {};
  }

}

export const loggerAsyncFactory: LoggerFactoryAsyncInterface = new MiroirLoggerFactory();

// ################################################################################################
export function testLogger(loggerName: string, log: LoggerInterface) {
  console.log("###############################", loggerName, "logger Test: level", log.level);
  log.trace(loggerName, "@@@@@@@@@@@@ TRACE");
  log.debug(loggerName, "@@@@@@@@@@@@ DEBUG");
  log.info(loggerName, "@@@@@@@@@@@@ INFO");
  log.log(loggerName, "@@@@@@@@@@@@ LOG");
  log.warn(loggerName, "@@@@@@@@@@@@ WARN");
  log.error(loggerName, "@@@@@@@@@@@@ ERROR");
  console.log("#################### END TEST LOGS");
}

// ################################################################################################
export function createLogger(
  loggerName: string,
  setLog: (value: LoggerInterface) => void,
  testLog: (loggerName: string, value: LoggerInterface) => void
) {
  loggerAsyncFactory
    .create({
      level: defaultLevels.INFO,
      name: loggerName,
      prefix: {
        level: (opts) => `[${opts.level}]`,
        name: (opts) => opts.logger.name,
        template: '{{time}} {{level}} ',
        time: () => new Date().toTimeString().split(' ')[0]
      }
    })
    .then((value: LoggerInterface) => {
      setLog(value);
      testLog(loggerName, value);
    });
}

