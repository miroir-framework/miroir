import {
  defaultLevels,
  type FactoryLevels,
  type LoggerInterface,
  type LogLevel,
  type SomeLevel,
} from "../0_interfaces/4-services/LoggerInterface";

function levelRank(level: LogLevel | SomeLevel): number {
  if (typeof level === "number") {
    return level;
  }
  const key = String(level).toUpperCase() as keyof FactoryLevels;
  return defaultLevels[key] ?? defaultLevels.INFO;
}

function formatPreStartLine(loggerName: string, level: LogLevel, args: unknown[]): string {
  const time = new Date().toTimeString().split(" ")[0];
  const head = args.length > 0 ? String(args[0]) : "";
  const tail = args.slice(1).map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  return `[${time}] ${level} ${loggerName} ### ${head}${tail ? " " + tail : ""}`;
}

/**
 * Level-aware logger used before `MiroirLoggerFactory.startRegisteredLoggers` completes.
 * Replaces raw `console` fallback (#43): tagged output, default WARN, binds to real logger on start.
 */
export class PreStartLogger implements LoggerInterface {
  private delegate: LoggerInterface | undefined;
  private readonly fallbackLevel: SomeLevel;

  constructor(
    public readonly name: string,
    fallbackLevel: SomeLevel = defaultLevels.WARN,
  ) {
    this.fallbackLevel = fallbackLevel;
  }

  get level(): FactoryLevels[keyof FactoryLevels] {
    return this.delegate?.level ?? (this.fallbackLevel as FactoryLevels[keyof FactoryLevels]);
  }

  get levels(): FactoryLevels {
    return this.delegate?.levels ?? defaultLevels;
  }

  set level(_logLevel: SomeLevel) {
    // no-op until delegate is bound
  }

  disable(): void {
    this.delegate?.disable();
  }

  enable(): void {
    this.delegate?.enable();
  }

  bind(delegate: LoggerInterface): void {
    this.delegate = delegate;
  }

  private emit(level: LogLevel, consoleFn: (...args: unknown[]) => void, ...args: unknown[]): void {
    if (this.delegate) {
      this.delegate[level](...args);
      return;
    }
    if (levelRank(level) < levelRank(this.fallbackLevel)) {
      return;
    }
    consoleFn(formatPreStartLine(this.name, level, args));
  }

  trace(...msg: unknown[]): void {
    this.emit("trace", console.trace, ...msg);
  }

  debug(...msg: unknown[]): void {
    this.emit("debug", console.debug, ...msg);
  }

  log(...msg: unknown[]): void {
    this.emit("info", console.log, ...msg);
  }

  info(...msg: unknown[]): void {
    this.emit("info", console.info, ...msg);
  }

  warn(...msg: unknown[]): void {
    this.emit("warn", console.warn, ...msg);
  }

  error(...msg: unknown[]): void {
    this.emit("error", console.error, ...msg);
  }
}
