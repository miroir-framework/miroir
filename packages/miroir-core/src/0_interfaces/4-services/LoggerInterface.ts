// Originally from Definitely Typed via log-level / logLevelNext see:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b4683d7/types/loglevel/index.d.ts
// Original definitions by: Stefan Profanter <https://github.com/Pro>
//                          Gabor Szmetanko <https://github.com/szmeti>
//                          Christian Rackerseder <https://github.com/screendriver>

// From LoglevelNext
// export type FactoryLevels = Record<Uppercase<string>, number> & {
export type FactoryLevels = {
  DEBUG: number;
  ERROR: number;
  INFO: number;
  SILENT: number;
  TRACE: number;
  WARN: number;
};

export const defaultLevels: FactoryLevels = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5
};

export type SomeLevel = number | string;

export interface PrefixTemplateOptions {
  level: string;
  logger: LoggerInterface;
}

export type PrefixTemplateFn = (options: PrefixTemplateOptions) => string;

export interface PrefixFactoryOptions {
  [key: string]: PrefixTemplateFn | string | undefined;
  level?: PrefixTemplateFn;
  name?: PrefixTemplateFn;
  template?: string;
  time?: PrefixTemplateFn;
}
export type Factory = any; // internal to loglevelNext
export interface LogLevelOptions {
  factory?: Factory;
  id?: string;
  level?: number | string;
  name?: string;
  prefix?: PrefixFactoryOptions;
}


// interface LoggerFactoryInterface extends LoggerInterface {
export interface LoggerFactoryInterface {
  create(opts: LogLevelOptions | string): LoggerInterface
  get loggers(): Record<string, LoggerInterface>
}

export interface LoggerFactoryAsyncInterface {
  create(opts: LogLevelOptions | string): Promise<LoggerInterface>
  get loggers(): Record<string, LoggerInterface>
}


export interface LoggerInterface {

  get name(): string;
  get level(): FactoryLevels[keyof FactoryLevels];
  get levels(): FactoryLevels;
  set level(logLevel: SomeLevel);
  disable(): void;
  enable(): void;

  /**
   * Output trace message to console.
   * This will also include a full stack trace
   *
   * @param msg any data to log to the console
   */
  trace(...msg: any[]): void;

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  debug(...msg: any[]): void;

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  log(...msg: any[]): void;

  /**
   * Output info message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  info(...msg: any[]): void;

  /**
   * Output warn message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  warn(...msg: any[]): void;

  /**
   * Output error message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  error(...msg: any[]): void;
}