const fs = require('node:fs');
const sourceFile = 'scripts/__apply-build-1.5.9.cjs';
let source = fs.readFileSync(sourceFile, 'utf8');
for (const label of ['156 forward contracts', '157 forward version', '157 forward contracts']) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`replaceOnce\\(\\n[\\s\\S]*?  '${escaped}',\\n\\);\\n`);
  const before = source;
  source = source.replace(pattern, '');
  if (source === before) throw new Error(`Could not remove obsolete patch: ${label}`);
}
for (const label of ['156 forward contracts', '157 forward version', '157 forward contracts']) {
  if (source.includes(`'${label}'`)) throw new Error(`Obsolete patch still present: ${label}`);
}
const temp = '/tmp/apply-build-1.5.9.cjs';
fs.writeFileSync(temp, source);
require(temp);
