/**
 * Copies the React client build from miroir-standalone-app/dist to dist/client/.
 * Run after `npm run build -w miroir-standalone-app`.
 */
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '../../miroir-standalone-app/dist');
const dst = join(__dirname, '../release/client');

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
