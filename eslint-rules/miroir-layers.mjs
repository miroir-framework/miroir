// ESLint rule: implementation imports flow downwards only between numbered layers (AGENTS.md, "Architecture").
// A file under packages/<pkg>/src/<N>_<layer>/ may not import an implementation from a layer numbered above N
// in the same package. Imports of 0_interfaces, type-only imports and the logger infrastructure are allowed.
import path from "node:path";

const LAYER_DIR = /^(\d)_/;
const ALLOWED_TARGETS = [/\/4_services\/MiroirLoggerFactory(\.js)?$/, /\/4_services\/LoggerContext(\.js)?$/];

function layerOf(srcRoot, absolutePath) {
  const relative = path.relative(srcRoot, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return undefined;
  const first = relative.split(path.sep)[0];
  const match = LAYER_DIR.exec(first);
  return match ? { name: first, level: Number(match[1]) } : undefined;
}

function isTypeOnly(node) {
  if (node.importKind === "type" || node.exportKind === "type") return true;
  const specifiers = node.specifiers ?? [];
  return (
    specifiers.length > 0 &&
    specifiers.every((s) => s.importKind === "type" || s.exportKind === "type")
  );
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Forbid implementation imports from a higher-numbered layer" },
    schema: [],
    messages: {
      upward:
        "Layer {{from}} must not import an implementation from layer {{to}} ('{{source}}'). Depend on an interface in 0_interfaces, use `import type`, or move the code down.",
    },
  },
  create(context) {
    const filename = context.filename;
    const match = /^(.*[\\/]packages[\\/][^\\/]+[\\/]src)[\\/]/.exec(filename);
    if (!match) return {};
    const srcRoot = match[1];
    const fromLayer = layerOf(srcRoot, filename);
    if (!fromLayer) return {};

    function check(node, sourceNode) {
      if (!sourceNode || typeof sourceNode.value !== "string") return;
      const source = sourceNode.value;
      if (!source.startsWith(".")) return;
      const target = path.resolve(path.dirname(filename), source);
      const toLayer = layerOf(srcRoot, target);
      if (!toLayer || toLayer.level === 0 || toLayer.level <= fromLayer.level) return;
      if (ALLOWED_TARGETS.some((allowed) => allowed.test(target.split(path.sep).join("/")))) return;
      context.report({
        node: sourceNode,
        messageId: "upward",
        data: { from: fromLayer.name, to: toLayer.name, source },
      });
    }

    return {
      ImportDeclaration(node) {
        if (!isTypeOnly(node)) check(node, node.source);
      },
      ExportNamedDeclaration(node) {
        if (node.source && !isTypeOnly(node)) check(node, node.source);
      },
      ExportAllDeclaration(node) {
        if (!isTypeOnly(node)) check(node, node.source);
      },
      ImportExpression(node) {
        if (node.source.type === "Literal") check(node, node.source);
      },
    };
  },
};
