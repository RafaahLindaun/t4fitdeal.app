const fs = require('node:fs');
const file = 'scripts/__apply-build-1.6.0.cjs';
let source = fs.readFileSync(file, 'utf8');
source = source.replace('const end = line.indexOf("/,\n\n", start);', 'const end = line.indexOf("/ ,".replace(" ", ""), start);');
fs.writeFileSync(file, source, 'utf8');
