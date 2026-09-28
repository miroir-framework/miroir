/**
 * Copies the React client build from miroir-standalone-app/dist to release/client/.
 * Run after `npm run build -w miroir-standalone-app`.
 * `--if-present` (used by build:release): a missing client build is a warning, not a failure,
 * for the CI jobs that build the server binary without the client.
 */
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '../../miroir-standalone-app/dist');
const dst = join(__dirname, '../release/client');
const ifPresent = process.argv.includes('--if-present');

if (!existsSync(src) && ifPresent) {
  console.warn(`[copy-client] Source not found: ${src}; the release has no web client.`);
  process.exit(0);
}
if (!existsSync(src)) {
  console.error(`[copy-client] Source not found: ${src}`);
  console.error(`[copy-client] Run "npm run build -w miroir-standalone-app" first.`);
  process.exit(1);
}

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log(`[copy-client] Copied React client build:`);
console.log(`  from: ${src}`);
console.log(`  to:   ${dst}`);
