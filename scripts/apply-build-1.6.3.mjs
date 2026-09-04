import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);

function replaceOnce(file, before, after, label, optional = false) {
  const source = read(file);
  if (source.includes(after)) return false;
  if (!source.includes(before)) {
    if (optional) return false;
    throw new Error(`[1.6.3] ${label}: trecho não encontrado em ${file}`);
  }
  write(file, source.replace(before, after));
  return true;
}

function transform(file, fn) {
  const source = read(file);
  const next = fn(source);
  if (next !== source) write(file, next);
}

// Versionamento / contratos / camada final.
transform("package.json", (source) => source
  .replace('"version": "1.6.2"', '"version": "1.6.3"')
  .replace('node scripts/verify-visual-contracts-1.6.2.mjs', 'node scripts/verify-visual-contracts-1.6.3.mjs'));

replaceOnce(
  "scr/main.tsx",
  'import "./styles/build-1.6.2.css";\n',
  'import "./styles/build-1.6.2.css";\nimport "./styles/build-1.6.3.css";\n',
  "import da camada 1.6.3",
);
transform("scr/main.tsx", (source) => source
  .replace("staleTime: 15_000,\n      refetchOnWindowFocus: true,", "staleTime: 30_000,\n      refetchOnWindowFocus: false,"));

// Login: resolve CPF/telefone usando a função canônica, incluindo a coluna
// legada `telefone` e valores historicamente salvos com máscara.
transform("supabase/functions/login-identifier-v157/index.ts", (source) => {
  if (source.includes('resolve_accqua_login_email_v1_6_3')) return source;
  const before = `      const { data, error } = await admin\n        .from("profiles")\n        .select("email")\n        .or(\`cpf.eq.\${normalized},phone.eq.\${normalized}\`)\n        .limit(2);\n\n      if (error) {\n        console.error("login-identifier-v157 profile lookup", error.code, error.message);\n        return json({ error: "unavailable", message: "O acesso está temporariamente indisponível. Tente novamente em instantes." }, 503);\n      }\n\n      if (!data || data.length !== 1 || !text(data[0]?.email)) {\n        return json({ error: "invalid_credentials", message: genericError }, 401);\n      }\n      email = text(data[0].email).toLowerCase();`;
  const after = `      const { data, error } = await admin.rpc("resolve_accqua_login_email_v1_6_3", {\n        p_identifier: normalized,\n      });\n\n      if (error) {\n        console.error("login-identifier-v157 profile lookup", error.code, error.message);\n        return json({ error: "unavailable", message: "O acesso está temporariamente indisponível. Tente novamente em instantes." }, 503);\n      }\n\n      email = text(data).toLowerCase();\n      if (!email) {\n        return json({ error: "invalid_credentials", message: genericError }, 401);\n      }`;
  if (!source.includes(before)) throw new Error("[1.6.3] bloco de login legado não encontrado");
  return source.replace(before, after);
});

// Perfil: nova seção de parceiros usa o mesmo Perfil real, sem criar rota paralela.
replaceOnce(
  "scr/pages/Profile.tsx",
  'import ProfileMenuItem from "../components/ProfileMenuItem";\n',
  'import ProfileMenuItem from "../components/ProfileMenuItem";\nimport ProfileTrainingPartners163 from "../components/ProfileTrainingPartners163";\n',
  "import parceiros",
);
replaceOnce(
  "scr/pages/Profile.tsx",
  `              </section>\n\n              <button type="button" className="profile-logout-button" onClick={() => setLogoutConfirmOpen(true)}>`,
  `              </section>\n\n              <ProfileTrainingPartners163 />\n\n              <button type="button" className="profile-logout-button" onClick={() => setLogoutConfirmOpen(true)}>`,
  "seção parceiros",
);

// Ranking: objetivo + badge por tempo no app, mantendo o total bruto de treinos
// separado da pontuação mensal de dias treinados.
transform("scr/lib/ranking.ts", (source) => {
  if (!source.includes("objective: string;")) {
    source = source.replace("  currentSplit: string;\n};", "  currentSplit: string;\n  objective: string;\n};");
  }
  if (!source.includes('get_accqua_ranking_profile_summary_v1_6_3')) {
    source = source.replace(
      `  const newestResponse = await supabase.rpc("get_accqua_ranking_profile_summary_v9_7", { p_student_id: studentId });\n  const response = newestResponse.error\n    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_6", { p_student_id: studentId })\n    : newestResponse;`,
      `  const v163 = await supabase.rpc("get_accqua_ranking_profile_summary_v1_6_3", { p_student_id: studentId });\n  const newestResponse = v163.error\n    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_7", { p_student_id: studentId })\n    : v163;\n  const response = newestResponse.error\n    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_6", { p_student_id: studentId })\n    : newestResponse;`,
    );
  }
  source = source.replace(
    `    currentSplit: t(raw.current_split) || "Não informado",\n  };`,
    `    currentSplit: t(raw.current_split) || "Não informado",\n    objective: t(raw.objective),\n  };`,
  );
  return source;
});

transform("scr/pages/Ranking.tsx", (source) => {
  if (!source.includes("function rankingAchievementV163")) {
    const marker = `function BackIcon() {`;
    const helper = `function rankingAchievementV163(memberSince: string) {\n  const start = new Date(memberSince);\n  if (Number.isNaN(start.getTime())) return null;\n  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));\n  const levels = [\n    { days: 365, label: "LENDÁRIO" },\n    { days: 180, label: "IMPARÁVEL" },\n    { days: 90, label: "CONSISTENTE" },\n    { days: 50, label: "INSANO" },\n    { days: 30, label: "NO RITMO" },\n  ];\n  return levels.find((level) => days >= level.days) ?? null;\n}\n\n`;
    if (!source.includes(marker)) throw new Error("[1.6.3] marker Ranking BackIcon ausente");
    source = source.replace(marker, helper + marker);
  }
  source = source.replace(
    `<article><span>Divisão atual</span><strong>{summary.currentSplit || "Não informada"}</strong></article>\n        </div>}`,
    `<article><span>Divisão atual</span><strong>{summary.currentSplit || "Não informada"}</strong></article>\n          <article className="ranking-profile-objective-v163"><span>Objetivo</span><strong>{summary.objective || "Não informado"}</strong></article>\n          {rankingAchievementV163(summary.memberSince) ? <span className="ranking-achievement-v163">★ {rankingAchievementV163(summary.memberSince)?.label}</span> : null}\n        </div>}`,
  );
  return source;
});

// Montar Treino: somente a etapa atual permanece montada. Isso elimina de raiz
// as sobreposições no mobile causadas por painéis antigos apenas escondidos via CSS.
transform("scr/pages/AdminWorkoutBuilder.tsx", (source) => {
  if (source.includes("admin-builder-stage-v163 is-programa")) return source;

  const programOpen = `        <section\n          ref={programSectionRef}\n          className="admin-builder-program-card admin-builder-anchor"\n        >`;
  const routineBoundary = `        </section>\n\n        <section\n          ref={routineSectionRef}\n          className="admin-builder-routines admin-builder-anchor"\n        >`;
  const selectedBoundary = `        </section>\n\n        <section ref={selectedSectionRef} className="admin-builder-selected admin-builder-anchor">`;
  const cardioBoundary = `        </section>\n\n        <section\n          ref={cardioSectionRef}\n          className="admin-builder-cardio admin-builder-anchor"\n        >`;
  const asideBoundary = `        </section>\n\n        <aside className="admin-builder-desktop-aside">`;

  if (![programOpen, routineBoundary, selectedBoundary, cardioBoundary, asideBoundary].every((token) => source.includes(token))) {
    throw new Error("[1.6.3] estrutura esperada do AdminWorkoutBuilder não encontrada");
  }

  source = source.replace(programOpen, `        {mobileStep === "programa" ? (\n        <div className="admin-builder-stage-v163 is-programa">\n${programOpen}`);
  source = source.replace(routineBoundary, `        </section>\n        </div>\n        ) : null}\n\n        {mobileStep === "rotina" ? (\n        <div className="admin-builder-stage-v163 is-rotina">\n        <section\n          ref={routineSectionRef}\n          className="admin-builder-routines admin-builder-anchor"\n        >`);
  source = source.replace(selectedBoundary, `        </section>\n        </div>\n        ) : null}\n\n        {mobileStep === "exercicios" ? (\n        <div className="admin-builder-stage-v163 is-exercicios">\n        <section ref={selectedSectionRef} className="admin-builder-selected admin-builder-anchor">`);
  source = source.replace(cardioBoundary, `        </section>\n        </div>\n        ) : null}\n\n        {mobileStep === "cardio" ? (\n        <div className="admin-builder-stage-v163 is-revisao">\n        <section\n          ref={cardioSectionRef}\n          className="admin-builder-cardio admin-builder-anchor"\n        >`);
  source = source.replace(asideBoundary, `        </section>\n        </div>\n        ) : null}\n\n        <aside className="admin-builder-desktop-aside">`);
  return source;
});

// Ao trocar de etapa, o novo painel começa no topo do shell; a transição visual
// fica na camada CSS 1.6.3 usando somente transform/opacity.
transform("scr/pages/AdminWorkoutBuilder.tsx", (source) => {
  if (source.includes("Build 1.6.3: estágio único")) return source;
  const marker = `  const activeRoutine =\n    routines[activeRoutineIndex] ?? routines[0] ?? createRoutines("FULL")[0];`;
  const effect = `  // Build 1.6.3: estágio único montado por vez.\n  useEffect(() => {\n    const shell = document.querySelector<HTMLElement>(".admin-builder-shell");\n    shell?.scrollTo({ top: 0, behavior: "smooth" });\n  }, [mobileStep]);\n\n`;
  if (!source.includes(marker)) throw new Error("[1.6.3] marker activeRoutine ausente");
  return source.replace(marker, effect + marker);
});

console.log("ACCQUA Sports — Build 1.6.3 source patch applied.");
