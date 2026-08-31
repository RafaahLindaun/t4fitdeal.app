import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(file, from, to, label) {
  const source = await readFile(file, "utf8");
  if (source.includes(to) && !source.includes(from)) {
    console.log(`skip ${label}: already applied`);
    return false;
  }
  if (!source.includes(from)) {
    throw new Error(`Build 1.4.6: pattern not found for ${label} in ${file}`);
  }
  await writeFile(file, source.replace(from, to));
  console.log(`applied ${label}`);
  return true;
}

let changed = 0;

changed += Number(await replaceOnce(
  "scr/pages/Profile.tsx",
  `  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;\n\n  const details = dashboard.details;`,
  `  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;\n  // Build 1.4.6: Perfil usa o mesmo loading global das demais rotas.\n  if (loadingDashboard) return <LoadingSplash />;\n\n  const details = dashboard.details;`,
  "profile-global-loading",
));

changed += Number(await replaceOnce(
  "scr/pages/Profile.tsx",
  `          {loadingDashboard ? (\n            <div className="accqua-profile-loading" role="status" aria-live="polite">\n              <img src="/accqua-logo-loading-oficial.png" alt="ACCQUA Sports Academia" />\n              <span />\n              <p>Carregando perfil</p>\n            </div>\n          ) : null}\n\n`,
  ``,
  "remove-profile-exclusive-loader",
));

changed += Number(await replaceOnce(
  "scr/pages/Profile.tsx",
  `    await reload();\n    setMessage("Foto de perfil atualizada.");`,
  `    await reload();\n    await queryClient.invalidateQueries({ queryKey: ["primary-sidebar-avatar", user.id] });\n    setMessage("Foto de perfil atualizada.");`,
  "refresh-sidebar-avatar",
));

changed += Number(await replaceOnce(
  "scr/pages/Ranking.tsx",
  `          <span className="ranking-header-balance" aria-hidden="true" />`,
  `          <button\n            type="button"\n            className="ranking-info-fab"\n            onClick={() => setInfoOpen(true)}\n            aria-label="Como funciona o ranking"\n          >\n            <InfoIcon />\n          </button>`,
  "ranking-info-in-header",
));

changed += Number(await replaceOnce(
  "scr/pages/Ranking.tsx",
  `\n      <button\n        type="button"\n        className="ranking-info-fab"\n        onClick={() => setInfoOpen(true)}\n        aria-label="Como funciona o ranking"\n      >\n        <InfoIcon />\n      </button>\n`,
  `\n`,
  "remove-ranking-floating-info",
));

console.log(`Build 1.4.6 UI fixes changed ${changed} block(s).`);
