const fs = require('node:fs');
const sourceFile = 'scripts/__apply-build-1.5.9.cjs';
let source = fs.readFileSync(sourceFile, 'utf8');
source = source.replace(/replaceOnce\(\n  'scripts\/verify-visual-contracts-1\.5\.6\.mjs',[\s\S]*?  '156 forward contracts',\n\);\n/, '');
if (source.includes("'156 forward contracts'")) {
  throw new Error('Could not remove obsolete 1.5.6 contract patch');
}
const temp = '/tmp/apply-build-1.5.9.cjs';
fs.writeFileSync(temp, source);
require(temp);
