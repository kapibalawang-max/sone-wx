// The settings card prints SKIN_VERSION; package.json is what the host reads.
// They must never drift, or the badge lies about which build is loaded.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(root + '/package.json', 'utf8'));
const src = fs.readFileSync(root + '/client.js', 'utf8');
const m = src.match(/const SKIN_VERSION = "([^"]+)";/);
let fail = 0;
if (!m) { console.log('FAIL SKIN_VERSION missing'); fail++; }
else if (m[1] !== pkg.version) { console.log(`FAIL client ${m[1]} != package ${pkg.version}`); fail++; }
const readme = fs.readFileSync(root + '/README.md', 'utf8');
if (!readme.includes('v' + pkg.version)) { console.log('FAIL README has no entry for v' + pkg.version); fail++; }
console.log(fail ? `version-test FAIL ${fail}` : `version-test OK (v${pkg.version})`);
process.exit(fail ? 1 : 0);
