const fs = require('node:fs');
const file = 'scripts/__apply-build-1.6.0.cjs';
let source = fs.readFileSync(file, 'utf8');

source = source.replace(
  'const end = line.indexOf("/,\n\n", start);',
  'const end = line.indexOf("/ ,".replace(" ", ""), start);',
);

const thumbMarker = 'width=112&height=112&resize=cover&quality=55';
const markerIndex = source.indexOf(thumbMarker);
if (markerIndex >= 0) {
  const returnStart = source.lastIndexOf('return ', markerIndex);
  const statementEnd = source.indexOf(';', markerIndex);
  if (returnStart >= 0 && statementEnd > markerIndex) {
    source = source.slice(0, returnStart) +
      'return rendered + separator + "width=112&height=112&resize=cover&quality=55";' +
      source.slice(statementEnd + 1);
  }
}

const drawerIndex = source.indexOf('drawer-template-');
if (drawerIndex >= 0) {
  const keyStart = source.lastIndexOf('key={', drawerIndex);
  const keyEnd = source.indexOf('} onClick=', drawerIndex);
  if (keyStart >= 0 && keyEnd > drawerIndex) {
    source = source.slice(0, keyStart) +
      'key={"drawer-template-" + template.id}' +
      source.slice(keyEnd + 1);
  }
}

fs.writeFileSync(file, source, 'utf8');
