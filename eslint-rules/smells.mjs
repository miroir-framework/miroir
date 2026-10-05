// Smell detectors shared by eslint.config.mjs and the smell lens (#340): the file sets they apply to, and the detectors
// that graduated from the lens to errors (analysis D7). Each graduated detector runs as its own rule, `miroir/<smell-id>`,
// so eslint-suppressions.json counts each smell apart. Every message starts with a smell id of the miroir-code-quality
// skill (.agents/skills/miroir-code-quality/).

export const SRC = ["packages/*/src/**/*.{ts,tsx}"];
export const TESTS = ["packages/*/{test,tests}/**/*.{ts,tsx}", "packages/*/src/**/*.{test,spec}.{ts,tsx}"];
// Composition roots build the object graph and read the process environment; elsewhere both are smells.
// The standalone app's 4-tests folder builds test sessions, so it counts as a root.
export const ROOTS = [
  "packages/*/src/5_setup/**",
  "packages/*/src/**/{setup,setupTools,sagaTools,startup,storeStartup,environmentBoot,main,cli,platform,server,index}.{ts,tsx}",
  "packages/*/src/miroir-fwk/4-tests/**",
];
// React components and hooks.
export const VIEW = ["packages/*/src/**/*.tsx", "packages/*/src/**/4_view/**/*.ts", "packages/*/src/**/use[A-Z]*.ts"];
// The components and hooks of the 4-tests folder are views like any other.
export const TEST_SESSION_VIEWS = [
  "packages/*/src/miroir-fwk/4-tests/**/*.tsx",
  "packages/*/src/miroir-fwk/4-tests/**/use[A-Z]*.ts",
];
// The views that define the themes and the Themed components: where colors are written down.
export const THEME_VIEWS = [
  "packages/*/src/**/Themes/**/*.tsx",
  "packages/*/src/**/4_view/**/Themes/**/*.ts",
  "packages/*/src/**/Themes/**/use[A-Z]*.ts",
];

export const smell = (id, selector, text) => ({ selector, message: `[${id}] ${text}` });

// A function declared to return Action2ReturnType or Action2VoidReturnType, directly or in a Promise.
const RETURNS_ACTION =
  ":function:matches([returnType.typeAnnotation.typeName.name=/^Action2(Void)?ReturnType$/], [returnType.typeAnnotation.typeArguments.params.0.typeName.name=/^Action2(Void)?ReturnType$/])";

// `miroir/action-result`, everywhere in sources.
export const actionResult = [
  smell(
    "action-result",
    `${RETURNS_ACTION} ThrowStatement`,
    "throw in a function that returns an action result: callers check `status`, not exceptions. Return an Action2Error (`NotImplemented` for a stub).",
  ),
  smell(
    "action-result",
    `${RETURNS_ACTION} ReturnStatement > TSAsExpression[typeAnnotation.type='TSAnyKeyword']`,
    "`return … as any` in a function that returns an action result: the declared result type checks nothing.",
  ),
];

// `miroir/type-escape`, everywhere in sources: the double cast only. A single `as any` stays a lens warning.
export const typeEscape = [
  smell(
    "type-escape",
    "TSAsExpression > TSAsExpression.expression[typeAnnotation.type=/^TS(Unknown|Any)Keyword$/]",
    "Double cast: the compiler checks nothing here. Fix the type at its source, or validate the value.",
  ),
];

// `miroir/global-environment`, in sources outside the composition roots.
export const globalEnvironment = [
  smell(
    "global-environment",
    "MemberExpression[object.name='process'][property.name='env']",
    "process.env read outside a composition root: the value cannot differ per instance or per test. Take it as a parameter that the root fills.",
  ),
];
