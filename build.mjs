/**
 * Build the self-contained browser module.
 *
 * The module loader hands a single browser artifact to the page, so every
 * src/css/**\/*.css file is concatenated (filename order, one directory per
 * injected stylesheet) and inlined into client.js. Files under
 * src/css/dialects/ become a `dialect -> css` map instead: the client appends
 * the one that matches the running shell structure.
 *
 *   node build.mjs           regenerate client.js
 *   node build.mjs --check   fail when client.js is stale
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

async function cssDir(rel) {
  const dir = join(root, 'src/css', rel);
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
    .map((entry) => entry.name)
    .sort();
}

async function readParts(rel) {
  const parts = [];
  for (const name of await cssDir(rel)) {
    const text = await readFile(join(root, 'src/css', rel, name), 'utf8');
    parts.push(text.replace(/\n+$/u, ''));
  }
  return parts.join('\n\n');
}

/** A CSS body lives inside a JS template literal: escape what would end it. */
const escapeForTemplate = (text) => text.replace(/\\/gu, '\\\\').replace(/`/gu, '\\`').replace(/\$\{/gu, '\\${');

const skin = escapeForTemplate(await readParts('skin'));
const ui = escapeForTemplate(await readParts('ui'));
const islandsCss = escapeForTemplate(await readParts('islands'));

/** Islands 结构层方言：与主皮肤的方言同源，只是另一份样式表。 */
const islandsDialects = {};
for (const name of await cssDir('islands-variants')) {
  const text = await readFile(join(root, 'src/css/islands-variants', name), 'utf8');
  islandsDialects[name.replace(/\.css$/u, '')] = text.replace(/\n+$/u, '');
}

const dialects = {};
for (const name of await cssDir('dialects')) {
  const text = await readFile(join(root, 'src/css/dialects', name), 'utf8');
  dialects[name.replace(/\.css$/u, '')] = text.replace(/\n+$/u, '');
}

const islandsLayer = await readFile(join(root, 'src/js/islands.js'), 'utf8');

const template = await readFile(join(root, 'src/client.template.js'), 'utf8');
for (const marker of [
  '__SONE_CSS__',
  '__SONE_UI_CSS__',
  '__SONE_DIALECTS__',
  '__SONE_ISLANDS_CSS__',
  '__SONE_ISLANDS_CSS_VARIANTS__',
  '__SONE_ISLANDS_LAYER__',
]) {
  if (!template.includes(marker)) throw new Error(`src/client.template.js lost its ${marker} placeholder`);
}

const built = template
  .replace('__SONE_ISLANDS_LAYER__', () => islandsLayer.trim())
  .replace('__SONE_ISLANDS_CSS_VARIANTS__', () => JSON.stringify(islandsDialects, null, '\t'))
  .replace('__SONE_ISLANDS_CSS__', () => islandsCss)
  .replace('__SONE_DIALECTS__', () => JSON.stringify(dialects, null, '\t'))
  .replace('__SONE_CSS__', () => skin)
  .replace('__SONE_UI_CSS__', () => ui);

const summary = `${skin.length} + ${ui.length} + ${islandsCss.length} css bytes, ${Object.keys(dialects).length} dialect(s), islands layer ${islandsLayer.length}b`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = await readFile(join(root, 'client.js'), 'utf8');
  } catch {
    /* reported through the same stale-build message */
  }
  if (current !== built) {
    console.error(`client.js is stale (${summary}); run \`node build.mjs\` and commit the result.`);
    process.exitCode = 1;
  } else {
    console.log(`client.js is up to date (${summary}).`);
  }
} else {
  await writeFile(join(root, 'client.js'), built, 'utf8');
  console.log(`client.js rebuilt (${summary}).`);
}
