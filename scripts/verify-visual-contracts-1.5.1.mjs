import "./verify-visual-contracts-1.5.0.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function requireMatch(id, file, pattern, note) {
  if (!pattern.test(read(file))) {
    failures.push(`${id} — ${note} (${file})`);
    return;
  }
  passes.push(id);
}

// R — bottom navigation must disappear for every real modal, including manual sheets.
requireMatch(
  "R/global-modal-nav-hide",
  "scr/styles/build-1.5.1.css",
  /body:has\(\[aria-modal="true"\]\) \.accqua-main-layout-nav\s*\{[\s\S]*?visibility:\s*hidden\s*!important;[\s\S]*?pointer-events:\s*none\s*!important;/,
  "bottom navigation is no longer globally hidden while aria-modal content is open",
);
requireMatch(
  "R/responsive-dialog-stack",
  "scr/styles/build-1.5.1.css",
  /\.responsive-dialog-overlay\s*\{[\s\S]*?z-index:\s*10040\s*!important;[\s\S]*?\.responsive-dialog-drawer,[\s\S]*?z-index:\s*10041\s*!important;/,
  "ResponsiveDialog no longer sits above the bottom navigation layer",
);
requireMatch(
  "R/ranking-manual-sheet",
  "scr/styles/build-1.5.1.css",
  /\.ranking-sheet-backdrop\s*\{[\s\S]*?z-index:\s*10040\s*!important;[\s\S]*?\.ranking-sheet\s*\{[\s\S]*?z-index:\s*10041\s*!important;/,
  "manual ranking profile sheet lost its modal stack",
);

// Q — product image is straight/full bleed, discount anchored, reserve CTA wired and touchable.
requireMatch(
  "Q/image-straight",
  "scr/styles/build-1.5.1.css",
  /\.store-product-detail-main-image > img\s*\{[\s\S]*?object-fit:\s*cover\s*!important;[\s\S]*?transform:\s*none\s*!important;[\s\S]*?rotate:\s*0deg\s*!important;/,
  "store detail image can rotate or leave empty contain space again",
);
requireMatch(
  "Q/discount-anchor",
  "scr/styles/build-1.5.1.css",
  /\.store-product-detail-discount\s*\{[\s\S]*?position:\s*absolute\s*!important;[\s\S]*?top:\s*12px\s*!important;[\s\S]*?left:\s*12px\s*!important;[\s\S]*?z-index:\s*4\s*!important;/,
  "discount badge is no longer anchored inside the image wrapper",
);
requireMatch(
  "Q/mobile-sheet-scroll",
  "scr/styles/build-1.5.1.css",
  /\.store-product-detail-body,[\s\S]*?overflow-y:\s*auto\s*!important;[\s\S]*?padding-bottom:\s*max\(20px, env\(safe-area-inset-bottom\)\)\s*!important;/,
  "product sheet can clip the reserve CTA near the safe area",
);
requireMatch(
  "Q/reserve-handler",
  "scr/components/store/ProductDetailDialog.tsx",
  /onClick=\{\(event\) => \{[\s\S]*?event\.stopPropagation\(\);[\s\S]*?if \(!reserveDisabled\) onReserve\(product\);/,
  "reserve button is not explicitly wired to onReserve",
);
requireMatch(
  "Q/store-mutation",
  "scr/pages/Store.tsx",
  /onReserve=\{\(product\)=>reserveMutation\.mutate\(product\)\}/,
  "ProductDetailDialog reserve action no longer reaches the store mutation",
);
requireMatch(
  "Q/touch-target",
  "scr/styles/build-1.5.1.css",
  /\.store-product-detail-reserve\s*\{[\s\S]*?min-height:\s*60px\s*!important;[\s\S]*?pointer-events:\s*auto\s*!important;/,
  "reserve CTA lost its visible/touchable mobile target",
);

if (failures.length) {
  console.error("\nACCQUA Build 1.5.1 — contratos Q/R FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.5.1 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.5.1 — ${passes.length} contratos Q/R validados.`);
