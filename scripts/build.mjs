/**
 * Builds the installable package in place.
 *
 * The host loads `panel/index.html` + `panel/main.js` straight from the folder,
 * so the bundle has to live next to the sources in `panel/`. `src/` stays the
 * only place I edit.
 *
 *  - panel/main.js   IIFE bundle, @openchamber/sdk inlined (no globals exist)
 *  - panel/index.html copied verbatim
 *
 * `service/main.js` is hand-written ESM and is shipped as-is by the host.
 */
import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'panel');

await mkdir(out, { recursive: true });

const started = Date.now();
const result = await build({
  entryPoints: [path.join(root, 'src/panel/main.js')],
  outfile: path.join(out, 'main.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110', 'firefox115', 'safari16'],
  minify: process.argv.includes('--minify'),
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'warning',
  metafile: true,
});

await copyFile(path.join(root, 'src/panel/index.html'), path.join(out, 'index.html'));

const bytes = Object.values(result.metafile.outputs)[0]?.bytes ?? 0;
console.log(`panel/main.js  ${(bytes / 1024).toFixed(1)} kB  (${Date.now() - started} ms)`);
console.log('panel/index.html copied');
console.log('ready to install from this folder');
