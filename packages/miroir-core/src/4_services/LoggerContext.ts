export type RunLogDir = ">" | "." | "<";

/** Crockford base32 without I, L, O, U — uppercase only, 6 chars ≈ 1e9 space. */
export const CROCKFORD_RUN_ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const RUN_LOG_PREFIX_PATTERN = /#([0-9A-HJKMNP-TV-Z]{6})\.(s\d+|-)[>.<]#/;

export function generateRunId(): string {
  let runId = "";
  for (let i = 0; i < 6; i++) {
    runId += CROCKFORD_RUN_ID_ALPHABET[Math.floor(Math.random() * CROCKFORD_RUN_ID_ALPHABET.length)];
  }
  return runId;
}

export function formatRunLogPrefix(
  runId: string | undefined,
  spanId: string | undefined,
  dir: RunLogDir | undefined,
): string {
  const run = runId ?? "*NoRun*";
  const span = spanId ?? "-";
  const direction = dir ?? ".";
  return `#${run}.${span}${direction}#`;
}

export function formatRunBanner(
  runId: string,
  phase: "START" | "END",
  status?: string,
): string {
  if (phase === "END") {
    return `RUN ${runId} END status=${status ?? "ok"}`;
  }
  return `RUN ${runId} START`;
}

/** INFO enter/exit body; prefix already includes `>` or `<`. */
export function formatSpanBoundaryLine(
  prefix: string,
  kind: "enter" | "exit",
  block: string,
  status?: string,
): string {
  if (kind === "enter") {
    return `${prefix} → ${block}`;
  }
  return `${prefix} ← ${block} status=${status ?? "ok"}`;
}

export interface LoggerContextElement {
  testSuite: string | undefined;
  test: string | undefined;
  testAssertion: string | undefined;
  compositeActionSequence: string | undefined;
  action: string | undefined;
  runId: string | undefined;
  spanId: string | undefined;
  dir: RunLogDir | undefined;
}

export function emptyLoggerContextElement(): LoggerContextElement {
  return {
    testSuite: undefined,
    test: undefined,
    testAssertion: undefined,
    compositeActionSequence: undefined,
    action: undefined,
    runId: undefined,
    spanId: undefined,
    dir: undefined,
  };
}

export const defaultLoggerContextElement: LoggerContextElement = emptyLoggerContextElement();

export class LoggerGlobalContext {
  public static contextElement: LoggerContextElement = emptyLoggerContextElement();

  public static testLogLabel: string = "";

  public static reset(): void {
    LoggerGlobalContext.contextElement = emptyLoggerContextElement();
    LoggerGlobalContext.testLogLabel = "";
  }

  public static getTestLogLabel(): string {
    return LoggerGlobalContext.testLogLabel;
  }

  public static computeTestLogLabel(): string {
    return (
      LoggerGlobalContext.contextElement?.testSuite +
      "." +
      LoggerGlobalContext.contextElement?.test +
      "." +
      LoggerGlobalContext.contextElement?.testAssertion
    );
  }

  public static getTestSuite(): string | undefined {
    return LoggerGlobalContext.contextElement?.testSuite;
  }

  public static getTest(): string | undefined {
    return LoggerGlobalContext.contextElement?.test;
  }

  public static getTestAssertion(): string | undefined {
    return LoggerGlobalContext.contextElement?.testAssertion;
  }

  public static getCompositeAction(): string | undefined {
    return LoggerGlobalContext.contextElement?.compositeActionSequence;
  }

  public static getAction(): string | undefined {
    return LoggerGlobalContext.contextElement?.action;
  }

  public static getRunId(): string | undefined {
    return LoggerGlobalContext.contextElement?.runId;
  }

  public static getSpanId(): string | undefined {
    return LoggerGlobalContext.contextElement?.spanId;
  }

  public static getRunLogDir(): RunLogDir | undefined {
    return LoggerGlobalContext.contextElement?.dir;
  }

  public static getRunLogPrefix(): string {
    return formatRunLogPrefix(
      LoggerGlobalContext.contextElement.runId,
      LoggerGlobalContext.contextElement.spanId,
      LoggerGlobalContext.contextElement.dir,
    );
  }

  public static setRunLogTokens(tokens: {
    runId?: string | undefined;
    spanId?: string | undefined;
    dir?: RunLogDir | undefined;
  }): void {
    if ("runId" in tokens) {
      LoggerGlobalContext.contextElement.runId = tokens.runId;
    }
    if ("spanId" in tokens) {
      LoggerGlobalContext.contextElement.spanId = tokens.spanId;
    }
    if ("dir" in tokens) {
      LoggerGlobalContext.contextElement.dir = tokens.dir;
    }
  }

  public static setTestSuite(testSuite: string | undefined): void {
    LoggerGlobalContext.contextElement.testSuite = testSuite;
    LoggerGlobalContext.testLogLabel = LoggerGlobalContext.computeTestLogLabel();
  }

  public static setTest(test: string | undefined): void {
    LoggerGlobalContext.contextElement.test = test;
    LoggerGlobalContext.testLogLabel = LoggerGlobalContext.computeTestLogLabel();
  }

  public static setTestAssertion(testAssertion: string | undefined): void {
    LoggerGlobalContext.contextElement.testAssertion = testAssertion;
    LoggerGlobalContext.testLogLabel = LoggerGlobalContext.computeTestLogLabel();
  }

  public static setCompositeAction(compositeActionSequence: string | undefined): void {
    LoggerGlobalContext.contextElement.compositeActionSequence = compositeActionSequence;
  }

  public static setAction(action: string | undefined): void {
    LoggerGlobalContext.contextElement.action = action;
  }
}
