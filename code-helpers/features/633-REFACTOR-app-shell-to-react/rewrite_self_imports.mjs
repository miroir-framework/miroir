// #633: rewrite `from "miroir-react"` imports of modules moved into packages/miroir-react/src into relative
// imports of the module that declares each symbol. A package must not import its own entry (entry cycle, and
// tsup would resolve it to dist). JS rather than Python: it needs the TypeScript checker to follow re-exports.
//
// Usage: node code-helpers/features/633-REFACTOR-app-shell-to-react/rewrite_self_imports.mjs <file under
//        packages/miroir-react/src> [...] [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const pkgSrc = path.join(repo, "packages/miroir-react/src");
const indexFile = path.join(pkgSrc, "index.ts");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const files = args.filter((a) => a !== "--dry-run").map((f) => path.resolve(f));
if (files.length === 0) {
  console.error("usage: rewrite_self_imports.mjs <file> [...] [--dry-run]");
  process.exit(2);
}

const options = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: false,
  skipLibCheck: true,
  noEmit: true,
  baseUrl: repo,
  paths: { "miroir-react": [path.relative(repo, indexFile)] },
};
const program = ts.createProgram([indexFile, ...files], options);
const checker = program.getTypeChecker();

function declaringFile(symbol) {
  let target = symbol;
  while (target.flags & ts.SymbolFlags.Alias) target = checker.getAliasedSymbol(target);
  const decl = target.declarations?.[0];
  return decl?.getSourceFile().fileName;
}

function specifierFor(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, "/");
  rel = rel.replace(/\.tsx?$/, ".js");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

let failures = 0;
for (const file of files) {
  const source = program.getSourceFile(file);
  if (!source) {
    console.error(`not in program: ${file}`);
    failures++;
    continue;
  }
  const edits = [];
  for (const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt) || stmt.moduleSpecifier.text !== "miroir-react") continue;
    const clause = stmt.importClause;
    const bindings = clause?.namedBindings;
    if (!clause || clause.name || !bindings || !ts.isNamedImports(bindings)) {
      console.error(`${file}: unsupported import form: ${stmt.getText()}`);
      failures++;
      continue;
    }
    const groups = new Map();
    for (const element of bindings.elements) {
      const symbol = checker.getSymbolAtLocation(element.name);
      const target = symbol && declaringFile(symbol);
      if (!target || !target.startsWith(pkgSrc)) {
        console.error(`${file}: cannot resolve ${element.getText()} (${target})`);
        failures++;
        continue;
      }
      const spec = specifierFor(file, target);
      const typeOnly = clause.isTypeOnly || element.isTypeOnly;
      const name = element.getText().replace(/^type\s+/, "");
      if (!groups.has(spec)) groups.set(spec, []);
      groups.get(spec).push({ name, typeOnly });
    }
    const lines = [...groups.entries()].map(([spec, names]) => {
      const allTypes = names.every((n) => n.typeOnly);
      const list = names.map((n) => (n.typeOnly && !allTypes ? `type ${n.name}` : n.name)).join(", ");
      return `import ${allTypes ? "type " : ""}{ ${list} } from "${spec}";`;
    });
    edits.push({ start: stmt.getStart(source), end: stmt.getEnd(), text: lines.join("\n") });
  }
  if (edits.length === 0) continue;
  let text = source.getFullText();
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }
  console.log(`${path.relative(repo, file)}: ${edits.length} import(s) rewritten`);
  if (!dryRun) fs.writeFileSync(file, text);
}
process.exit(failures ? 1 : 0);
