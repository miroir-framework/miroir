// Smell lens (#340): the repo's ESLint config plus warn-level rules that point at code smells.
// It is not part of `npm run lint`: findings are review prompts, not errors. A rule that should block
// graduates to eslint.config.mjs as an error, with its existing violations counted in eslint-suppressions.json.
// Every custom message starts with a smell id of the miroir-code-quality skill (.agents/skills/miroir-code-quality/).
// Run: npm run smells -- --diff origin/_integration   or   npm run smells -- <paths>
// Tests: node --test eslint-rules/smell-lens.test.mjs (part of npm run lint)
import { builtinRules } from "eslint/use-at-your-own-risk";
import reactHooks from "eslint-plugin-react-hooks";
import base from "../eslint.config.mjs";
import { ROOTS, smell, SRC, TEST_SESSION_VIEWS, TESTS, THEME_VIEWS, VIEW } from "./smells.mjs";

// The smells that graduated to eslint.config.mjs (#340 D7) are errors there, where eslint-suppressions.json hides the
// counted violations. Bulk suppressions count errors only: as warnings here, every violation shows. A severity alone
// keeps the options that eslint.config.mjs gives each file.
const GRADUATED = [
  "miroir/action-result",
  "miroir/type-escape",
  "miroir/global-environment",
  "miroir/pub-sub",
  "miroir/component-io",
  "react-hooks/set-state-in-effect",
  "max-depth",
];

const UUID = "/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/";
// A hex color (`#333`, `1px solid #e0e0e0`), an rgb() color, white or black. A translucent rgba() tint reads on any background.
const COLOR = "/(^|[\\s(,:])#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?\\b|\\brgb\\(|^(white|black)$/";
const SERVICE = "/(Service|Controller|Tracker|Registry|Store|Cache)$/i";
// A parameter named `...Uuid` or typed `Uuid`.
const UUID_PARAM = "Identifier.params:matches([name=/Uuid$/], [typeAnnotation.typeAnnotation.typeName.name='Uuid'])";

const anywhereInSrc = [
  smell(
    "swallowed-error",
    "CatchClause > BlockStatement.body:not(:has(ThrowStatement, ReturnStatement, AssignmentExpression, CallExpression[callee.type='Identifier'], CallExpression[callee.property.name!=/^(debug|info|warn|error|log|trace)$/]))",
    "This catch only logs, or does nothing: execution goes on as if the call had worked. Return an Action2Error, rethrow, or state the policy in a comment.",
  ),
  smell(
    "swallowed-error",
    "CallExpression[callee.property.name='catch'] > :function.arguments[body.type='BlockStatement'][body.body.length=0]",
    "Empty .catch handler: the rejection disappears.",
  ),
  smell(
    "module-state",
    "Program > VariableDeclaration[kind='let'] > VariableDeclarator[id.name!='log']",
    "Module-level `let`: every importer shares it, and its setter creates call-order rules. Pass it in, or keep it in an instance built by the composition root.",
  ),
  smell(
    "module-state",
    "Program > ExportNamedDeclaration > VariableDeclaration[kind='let']",
    "Exported module-level `let`: every importer shares it and sees it change.",
  ),
  smell(
    "module-state",
    "Program > :matches(VariableDeclaration, ExportNamedDeclaration > VariableDeclaration) > VariableDeclarator > NewExpression.init[callee.name=/^(Map|Set|WeakMap|WeakSet)$/]",
    "Module-level collection: a process-wide cache or registry, shared by every instance (the client and server controllers of an emulated server included).",
  ),
  smell(
    "module-state",
    // `const EMPTY = {}` kept as a stable reference is fine: names starting with empty/default/none are skipped.
    "Program > :matches(VariableDeclaration, ExportNamedDeclaration > VariableDeclaration)[kind='const'] > VariableDeclarator[id.name!=/^(empty|default|none|no[A-Z_])/i] > :matches(ObjectExpression[properties.length=0], ArrayExpression[elements.length=0]).init",
    "Module-level empty object or array: if it is filled at run time, it is a process-wide registry shared by every instance.",
  ),
  smell(
    "module-state",
    "PropertyDefinition[static=true][readonly!=true]:not([value.type=/FunctionExpression$/])",
    "Mutable static field: a global reached by name instead of injected. A lazy `getInstance(args)` keeps the arguments of its first call.",
  ),
  smell(
    "module-state",
    "ExportNamedDeclaration > FunctionDeclaration[id.name=/ForTests?$/]",
    "A `...ForTests` export resets module state for tests: the state belongs in an instance that the test builds.",
  ),
  smell(
    "positional-mixup",
    `:matches(:function, TSFunctionType, TSMethodSignature, TSDeclareFunction, TSEmptyBodyFunctionExpression) > ${UUID_PARAM} ~ ${UUID_PARAM}`,
    "Second uuid parameter in one positional list: `Uuid` is a string, so swapped arguments still type-check. Take one options object.",
  ),
  smell(
    "boolean-flag",
    // A one-parameter function's boolean is the value it sets (`setShowTypes(show: boolean)`), not a flag.
    ":function[params.length>1] > :matches(Identifier.params[typeAnnotation.typeAnnotation.type='TSBooleanKeyword'], AssignmentPattern.params[right.type='Literal'][right.raw=/^(true|false)$/])",
    "Boolean flag parameter: the call site reads `f(x, true)`. Split the function, or take a named option.",
  ),
  smell(
    "magic-value",
    `Literal[value=${UUID}]`,
    "Uuid literal in code: import the model element from its deployment package and use its `.uuid`, or name the constant once.",
  ),
  smell(
    "timing",
    "CallExpression:matches([callee.name=/^(debounce|throttle)$/i], [callee.property.name=/^(debounce|throttle)$/i])",
    "Debounce or throttle: often hides an update loop or a missing event. Find the event that should drive the update.",
  ),
  smell(
    "timing",
    "CallExpression[callee.name=/^use(Layout)?Effect$/] CallExpression[callee.name='setTimeout']",
    "Timer inside an effect: the work is sequenced by time instead of by the event that makes it valid.",
  ),
  smell(
    "timing",
    "CallExpression[callee.name='setTimeout'][arguments.1.value=0]",
    "setTimeout(…, 0) defers work to dodge an ordering problem: make the ordering explicit.",
  ),
  ...["", "IfStatement > BlockStatement > "].map((nested) =>
    smell(
      "effect-derived-state",
      `CallExpression[callee.name=/^(React\\.)?useMemo$/] > :function.arguments:first-child > BlockStatement > ${nested}ExpressionStatement > CallExpression[callee.name=/^set[A-Z]/]`,
      "setState inside useMemo: a memo must be pure. Derive the value during render, or reset the state where the change happens (the event handler, or a `key`).",
    ),
  ),
  smell(
    "state-from-props",
    "CallExpression[callee.name=/^(React\\.)?useState$/] > MemberExpression.arguments[object.name='props']",
    "State initialised from a prop: it goes stale when the prop changes. Derive the value during render, or key the component.",
  ),
  smell(
    "unstable-deps",
    "CallExpression[callee.name=/^use(Effect|LayoutEffect|Memo|Callback)$/] > ArrayExpression.arguments CallExpression:matches([callee.name=/stringify/i], [callee.property.name=/stringify/i])",
    "Serialising in a dependency list: the string is rebuilt on every render, and the hook still re-runs on every structural change.",
  ),
  smell(
    "service-read-in-render",
    `CallExpression[callee.name=/^(React\\.)?useMemo$/] > ArrowFunctionExpression.arguments:first-child > CallExpression.body:matches([callee.object.name=${SERVICE}], [callee.object.property.name=${SERVICE}])`,
    "useMemo around a service read: nothing re-renders when the service's data changes. Expose the data through a hook that subscribes (useSyncExternalStore).",
  ),
  smell(
    "logger",
    "Program > VariableDeclaration:has(CallExpression[callee.property.name='getLoggerName']) ~ VariableDeclaration:has(CallExpression[callee.property.name='getLoggerName'])",
    "Second logger in this file: one logger per file, named after the file (docs/contributing/code-style.md).",
  ),
];

const outsideCompositionRoots = [
  smell(
    "wiring",
    "NewExpression[callee.name=/^(DomainController|PersistenceStoreControllerManager|PersistenceStoreController|MiroirContext|MiroirEventService|MiroirActivityTracker|LocalCache|RestClient)$/]",
    "Core service built outside a composition root: wiring belongs in 5_setup or in the runtime's setup file.",
  ),
];

// Outside the theme definitions. A fallback after a theme value (`theme.colors?.text || "#000"`) is not reported.
const themeBypass =
  "Color written in a component: it ignores the theme the user picked, the dark one included. Read it from useMiroirTheme(), e.g. currentTheme.colors.error.";
const outsideThemes = [
  smell("theme-bypass", `Literal[value=${COLOR}]:not(LogicalExpression > Literal.right)`, themeBypass),
  smell("theme-bypass", `TemplateElement[value.raw=${COLOR}]`, themeBypass),
];

// `vi.fn(actual.f)`: a spy over the real export, which the test observes without replacing it.
const SPY = "CallExpression[callee.object.name='vi'][callee.property.name='fn'][arguments.0.type='MemberExpression']";
const inTests = [
  smell(
    "mocked-own-module",
    // A factory whose properties are all spies keeps the real code: it is not reported.
    `CallExpression[callee.object.name='vi'][callee.property.name='mock']:not([arguments.length=2]:has(${SPY}):not(:has(Property:not([value.callee.property.name='fn'][value.arguments.0.type='MemberExpression'])))) > Literal.arguments:first-child[value=/^(\\.|miroir-)/]`,
    "vi.mock of Miroir's own code: the test checks the mock, not the integration. Prefer a MiroirTest or a real in-memory adapter.",
  ),
];

// `npm run smells -- --diff` keeps a finding when the change touches a line it spans. max-params reports the function
// head and exhaustive-deps the dependency list, so a sixth parameter added on its own line, or a value newly read in a
// hook body, would be dropped. These copies report the parameter list, and the whole hook call.
const spanning = (rule, spanOf, stockId) => ({
  meta: rule.meta,
  create: (context) =>
    rule.create(
      Object.create(context, {
        report: {
          value: (problem) => {
            const span = problem.node && spanOf(problem.node);
            if (!span) return context.report(problem);
            const reported = problem.loc?.start ?? problem.loc ?? problem.node.loc.start;
            if (!silencedOnLine(context, reported.line, [context.id, stockId])) context.report({ ...problem, loc: span });
          },
        },
      }),
    ),
});
// An `eslint-disable-next-line` or `eslint-disable-line` comment names the line the rule reported: once the report
// starts higher up, ESLint no longer matches the two, so the copy applies the comment itself.
const silencedOnLine = (context, line, ruleIds) =>
  context.sourceCode.getAllComments().some((comment) => {
    const directive = /^\s*eslint-disable-(next-line|line)\b(.*)$/s.exec(comment.value);
    if (!directive) return false;
    const target = directive[1] === "line" ? comment.loc.start.line : comment.loc.end.line + 1;
    const rules = directive[2].split("--")[0].split(",").map((rule) => rule.trim()).filter(Boolean);
    return target === line && (rules.length === 0 || rules.some((rule) => ruleIds.includes(rule)));
  });
const parameterList = (fn) => (fn.params?.length ? { start: fn.loc.start, end: fn.params.at(-1).loc.end } : undefined);
// The hook call, when the report is on its dependency list (a missing dependency) or on the hook's name (no list).
// A report on one entry of the list (a complex expression) stays on that entry.
const hookCall = (node) =>
  node.parent?.type === "CallExpression" && (node.parent.callee === node || node.parent.arguments.at(-1) === node)
    ? node.parent.loc
    : undefined;
const lens = { rules: { "max-params": spanning(builtinRules.get("max-params"), parameterList, "max-params") } };
// exhaustive-deps keeps its id, so the `eslint-disable` comments that name it still apply: the base config's
// react-hooks plugin is swapped for a copy that carries the spanning rule.
const reactHooksSpanning = {
  ...reactHooks,
  rules: {
    ...reactHooks.rules,
    "exhaustive-deps": spanning(reactHooks.rules["exhaustive-deps"], hookCall, "react-hooks/exhaustive-deps"),
  },
};
const withSpanningHooks = (config) =>
  config.plugins?.["react-hooks"] ? { ...config, plugins: { ...config.plugins, "react-hooks": reactHooksSpanning } } : config;

export default [
  ...base.map(withSpanningHooks),
  {
    files: SRC,
    ignores: TESTS,
    rules: Object.fromEntries(GRADUATED.map((rule) => [rule, "warn"])),
  },
  {
    // Graduated too, in sources and tests: eslint.config.mjs holds its operator groups.
    files: [...SRC, ...TESTS],
    rules: { "no-mixed-operators": "warn" },
  },
  {
    files: SRC,
    ignores: TESTS,
    plugins: { lens },
    rules: {
      "lens/max-params": ["warn", 5],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "no-restricted-syntax": ["warn", ...anywhereInSrc, ...outsideCompositionRoots],
    },
  },
  {
    // A rule configured twice is replaced, not merged: roots get the same list without the root-only smell (wiring).
    files: ROOTS,
    ignores: TESTS,
    rules: { "no-restricted-syntax": ["warn", ...anywhereInSrc] },
  },
  {
    files: VIEW,
    ignores: [...TESTS, ...ROOTS],
    rules: {
      "no-restricted-syntax": ["warn", ...anywhereInSrc, ...outsideCompositionRoots, ...outsideThemes],
    },
  },
  {
    files: THEME_VIEWS,
    ignores: [...TESTS, ...ROOTS],
    rules: { "no-restricted-syntax": ["warn", ...anywhereInSrc, ...outsideCompositionRoots] },
  },
  {
    // Views inside the 4-tests root get the view checks; the folder stays a root for process.env and wiring.
    files: TEST_SESSION_VIEWS,
    ignores: TESTS,
    rules: {
      "no-restricted-syntax": ["warn", ...anywhereInSrc, ...outsideThemes],
    },
  },
  {
    files: TESTS,
    rules: { "no-restricted-syntax": ["warn", ...inTests] },
  },
];
