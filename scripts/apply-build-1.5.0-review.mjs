import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tsxPath = path.join(root, "scr/pages/AdminWorkoutBuilder.tsx");
const cssPath = path.join(root, "scr/pages/admin-workout-builder-v150.css");

let tsx = fs.readFileSync(tsxPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

const oldReadiness = '<section className="admin-builder-readiness">';
const newReadiness = '<section className={clsx("admin-builder-readiness", !nextReadinessIssue && "is-complete")}>';
if (!tsx.includes(oldReadiness) && !tsx.includes(newReadiness)) {
  throw new Error("Build 1.5.0 review: readiness section not found");
}
tsx = tsx.replace(oldReadiness, newReadiness);

const oldHidden = `  .admin-builder-context-bar,\n  .admin-builder-step-nav,\n  .admin-builder-mobile-step-controls,\n  .admin-builder-readiness {\n    display: none !important;\n  }`;
const newHidden = `  .admin-builder-context-bar,\n  .admin-builder-step-nav,\n  .admin-builder-mobile-step-controls {\n    display: none !important;\n  }\n\n  .admin-builder-readiness {\n    display: none !important;\n  }\n\n  .admin-builder-screen.is-step-cardio .admin-builder-readiness:not(.is-complete) {\n    display: block !important;\n    margin: 10px 16px 12px;\n    border-radius: 16px;\n    background: color-mix(in srgb, var(--surface-raised) 70%, var(--surface-deep));\n  }\n\n  .admin-builder-screen.is-step-cardio .admin-builder-readiness:not(.is-complete) .admin-builder-readiness-summary {\n    min-height: 52px;\n    padding: 10px 12px;\n  }`;
if (!css.includes(oldHidden) && !css.includes(newHidden)) {
  throw new Error("Build 1.5.0 review: mobile progress suppression block not found");
}
css = css.replace(oldHidden, newHidden);

fs.writeFileSync(tsxPath, tsx);
fs.writeFileSync(cssPath, css);
console.log("Build 1.5.0 review disclosure finalized.");
