// ESLint rule (#340): one logger per file, named after the file (docs/contributing/code-style.md, "Logging").
// A log preset selects a logger by its full name, `<cleanLevel>_<package>_<name>`: a name copied from another file makes
// the preset entry select the wrong logger, or none. The name is the third argument of getLoggerName; a string literal
// must be the file name, with or without its extension. A name computed at run time is not checked.
import path from "node:path";

const callsGetLoggerName = (callee) =>
  (callee.type === "Identifier" && callee.name === "getLoggerName") ||
  (callee.type === "MemberExpression" && !callee.computed && callee.property.name === "getLoggerName");

export default {
  meta: {
    type: "problem",
    docs: { description: "One logger per file, named after the file" },
    schema: [],
    messages: {
      misnamed: '[logger] Logger named "{{name}}" in {{file}}: name it "{{stem}}", after the file, or the log presets miss it.',
      second: "[logger] Second logger in this file: one logger per file, named after the file.",
    },
  },
  create(context) {
    const file = path.basename(context.filename);
    const stem = file.replace(/\.[^.]+$/, "");
    let loggers = 0;
    return {
      CallExpression(node) {
        if (!callsGetLoggerName(node.callee)) return;
        loggers += 1;
        if (loggers > 1) context.report({ node, messageId: "second" });
        const name = node.arguments[2];
        if (name?.type !== "Literal" || typeof name.value !== "string") return;
        if (name.value === stem || name.value === file) return;
        context.report({ node: name, messageId: "misnamed", data: { name: name.value, file, stem } });
      },
    };
  },
};
