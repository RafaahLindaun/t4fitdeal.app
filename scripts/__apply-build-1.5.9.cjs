const fs = require('node:fs');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, value) { fs.writeFileSync(file, value); }
function replaceOnce(file, from, to, label) {
  const source = read(file);
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match in ${file}, got ${count}`);
  write(file, source.replace(from, to));
}
function replaceRegexOnce(file, regex, to, label) {
  const source = read(file);
  const matches = source.match(regex);
  if (!matches) throw new Error(`${label}: pattern not found in ${file}`);
  write(file, source.replace(regex, to));
}

// Staff > Alunos: eliminate aggressive polling and keep the current roster mounted during explicit refreshes.
replaceOnce(
  'scr/pages/AdminArea.tsx',
  '  useMemo,\n  useState,',
  '  useMemo,\n  useRef,\n  useState,',
  'AdminArea useRef import',
);
replaceOnce(
  'scr/pages/AdminArea.tsx',
  '  const [studentsLoading, setStudentsLoading] = useState(true);\n  const [studentError, setStudentError] = useState("");',
  '  const [studentsLoading, setStudentsLoading] = useState(true);\n  const studentsHydratedRef = useRef(false);\n  const [studentError, setStudentError] = useState("");',
  'AdminArea hydrated ref',
);
replaceOnce(
  'scr/pages/AdminArea.tsx',
  '      setStudentsLoading(true);\n      setStudentError("");',
  '      if (!studentsHydratedRef.current) setStudentsLoading(true);\n      setStudentError("");',
  'AdminArea stable loading',
);
replaceOnce(
  'scr/pages/AdminArea.tsx',
  '      } finally {\n        setStudentsLoading(false);\n      }\n    }, 260);',
  '      } finally {\n        studentsHydratedRef.current = true;\n        setStudentsLoading(false);\n      }\n    }, 260);',
  'AdminArea hydration finish',
);
replaceOnce(
  'scr/pages/AdminArea.tsx',
  `  useEffect(() => {\n    if (!canManageStudents) return;\n\n    const refresh = () => setReloadKey((current) => current + 1);\n    const interval = window.setInterval(refresh, 15000);\n\n    const handleVisibility = () => {\n      if (document.visibilityState === "visible") refresh();\n    };\n\n    window.addEventListener("focus", refresh);\n    document.addEventListener("visibilitychange", handleVisibility);\n\n    return () => {\n      window.clearInterval(interval);\n      window.removeEventListener("focus", refresh);\n      document.removeEventListener("visibilitychange", handleVisibility);\n    };\n  }, [canManageStudents]);\n\n`,
  '',
  'AdminArea remove polling',
);
replaceOnce(
  'scr/pages/AdminArea.tsx',
  '            <section className="admin-area-search-wrap admin-dashboard-search-wrap">',
  '            <section className={clsx("admin-area-search-wrap admin-dashboard-search-wrap", dashboardView === "students" && "is-student-sticky")}>',
  'AdminArea sticky search class',
);
replaceOnce(
  'scr/pages/AdminArea.tsx',
  '                    {dashboardView === "library" ? <button type="button" className="admin-library-add" onClick={() => { resetExerciseDraft(); setExerciseDialogOpen(true); }} aria-label="Adicionar exercício">+</button> : null}',
  '                    {dashboardView === "library" ? (\n                      <button type="button" className="admin-library-add" onClick={() => { resetExerciseDraft(); setExerciseDialogOpen(true); }} aria-label="Adicionar exercício">+</button>\n                    ) : (\n                      <button type="button" className="admin-library-add admin-template-add-v159" onClick={() => navigate("/area-accqua/montar?modo=modelo")} aria-label="Criar novo modelo de treino" title="Criar novo modelo">+</button>\n                    )}',
  'AdminArea templates plus',
);

// Template mode uses the same canonical builder. A synthetic, valid UUID context keeps the existing editor untouched.
replaceOnce(
  'scr/lib/admin.ts',
  '  avatarUrl: string;\n};\n\nexport type ExerciseLibraryItem',
  '  avatarUrl: string;\n};\n\nexport const WORKOUT_TEMPLATE_STUDENT_ID = "00000000-0000-0000-0000-000000000159";\n\nexport type ExerciseLibraryItem',
  'admin template sentinel constant',
);
replaceOnce(
  'scr/lib/admin.ts',
  'export async function getWorkoutStudentById(\n  studentId: string,\n): Promise<WorkoutStudent | null> {\n  if (!isSupabaseConfigured) return null;\n',
  `export async function getWorkoutStudentById(\n  studentId: string,\n): Promise<WorkoutStudent | null> {\n  if (!isSupabaseConfigured) return null;\n\n  if (studentId === WORKOUT_TEMPLATE_STUDENT_ID) {\n    const { data: authData } = await supabase.auth.getUser();\n    const staffId = authData.user?.id ?? "";\n    return {\n      id: WORKOUT_TEMPLATE_STUDENT_ID,\n      fullName: "Modelo da equipe",\n      cpf: "",\n      rg: "",\n      registrationCode: "MODELO",\n      gympassNumber: "",\n      membershipValidUntil: "",\n      membershipPaymentDay: 0,\n      membershipLastPayment: "",\n      membershipConfirmedAt: "",\n      membershipNotes: "",\n      email: authData.user?.email ?? "",\n      phone: "",\n      emergencyPhone: "",\n      birthDate: "",\n      objective: "Modelo reutilizável",\n      role: "student",\n      status: "active",\n      linkedProfessorId: staffId,\n      linkedProfessorName: "Equipe ACCQUA",\n      linkedProfessorEmail: authData.user?.email ?? "",\n      hasActiveWorkout: false,\n      activeWorkoutCount: 0,\n      workoutUpdatedAt: "",\n      reviewAt: "",\n      programCode: "MODELO",\n      avatarUrl: "",\n    };\n  }\n`,
  'admin synthetic template student',
);
replaceOnce(
  'scr/lib/admin.ts',
  'export async function publishAdminProgram(\n  input: PublishAdminProgramInput,\n): Promise<void> {\n  if (!isSupabaseConfigured) {',
  `export async function publishAdminProgram(\n  input: PublishAdminProgramInput,\n): Promise<void> {\n  if (input.studentId === WORKOUT_TEMPLATE_STUDENT_ID) {\n    const modelName = input.programName.trim() || \`Modelo \${input.splitCode}\`;\n    await saveAdminProgramTemplate(input.staffId, {\n      name: modelName,\n      splitCode: input.splitCode,\n      payload: {\n        programName: modelName,\n        notes: input.notes,\n        reviewAt: input.reviewAt,\n        routines: input.routines,\n        cardio: input.cardio,\n      },\n    });\n    return;\n  }\n\n  if (!isSupabaseConfigured) {`,
  'admin publish model mode',
);

// Entry route for Staff > Modelos > +.
replaceOnce(
  'scr/pages/WorkoutBuilderEntry.tsx',
  '  getWorkoutStudentById,\n  loadAdminProgramTemplates,',
  '  getWorkoutStudentById,\n  loadAdminProgramTemplates,\n  WORKOUT_TEMPLATE_STUDENT_ID,',
  'entry sentinel import',
);
replaceOnce(
  'scr/pages/WorkoutBuilderEntry.tsx',
  '  const studentId = searchParams.get("student") ?? "";\n  const returnStudentId = searchParams.get("returnStudent") ?? studentId;',
  '  const studentId = searchParams.get("student") ?? "";\n  const templateMode = searchParams.get("modo") === "modelo";\n  const returnStudentId = searchParams.get("returnStudent") ?? studentId;',
  'entry template mode flag',
);
replaceOnce(
  'scr/pages/WorkoutBuilderEntry.tsx',
  '  useEffect(() => {\n    if (!user?.id || !canManage || !studentId) return;\n    let alive = true;',
  '  useEffect(() => {\n    if (!user?.id || !canManage) return;\n    if (templateMode) { setBusy(false); return; }\n    if (!studentId) return;\n    let alive = true;',
  'entry template skip load',
);
replaceOnce(
  'scr/pages/WorkoutBuilderEntry.tsx',
  '  }, [canManage, studentId, user?.id]);',
  '  }, [canManage, studentId, templateMode, user?.id]);',
  'entry effect dependencies',
);
replaceOnce(
  'scr/pages/WorkoutBuilderEntry.tsx',
  '  if (!canManage || landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;\n  if (!student) return <Navigate to="/area-accqua" replace />;',
  '  if (!canManage || landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;\n  if (templateMode) return <Navigate to={`/area-accqua/montar/editor?student=${encodeURIComponent(WORKOUT_TEMPLATE_STUDENT_ID)}&modo=modelo`} replace />;\n  if (!student) return <Navigate to="/area-accqua" replace />;',
  'entry route to common editor',
);

// Common editor only changes copy/return behavior; all editing state remains canonical.
replaceOnce(
  'scr/pages/AdminWorkoutBuilder.tsx',
  '  const studentId = searchParams.get("student") ?? "";\n  const returnStudentId =',
  '  const studentId = searchParams.get("student") ?? "";\n  const modelMode = searchParams.get("modo") === "modelo";\n  const returnStudentId =',
  'builder model mode flag',
);
replaceOnce(
  'scr/pages/AdminWorkoutBuilder.tsx',
  `  const returnToStudent = () => {\n    navigate(\n      returnStudentId\n        ? \`/area-accqua?student=\${returnStudentId}\`\n        : "/area-accqua",\n    );\n  };`,
  `  const returnToStudent = () => {\n    if (modelMode) {\n      navigate("/area-accqua?section=templates");\n      return;\n    }\n    navigate(\n      returnStudentId\n        ? \`/area-accqua?student=\${returnStudentId}\`\n        : "/area-accqua",\n    );\n  };`,
  'builder template return',
);
replaceOnce(
  'scr/pages/AdminWorkoutBuilder.tsx',
  '      setToast("Treino publicado para o aluno.");\n      window.setTimeout(returnToStudent, 900);',
  '      setToast(modelMode ? "Modelo salvo na biblioteca da equipe." : "Treino publicado para o aluno.");\n      window.setTimeout(returnToStudent, 900);',
  'builder model save feedback',
);

// Build 1.5.9 visual hardening.
write('scr/styles/build-1.5.9.css', `/* ACCQUA Sports — Build 1.5.9\n   Stable Staff roster + sticky controls + model creation entry. */\n\n.admin-area-pending.has-pending,\n.admin-area-pending.has-pending:hover,\n.admin-area-pending.has-pending:focus-visible {\n  color: var(--text-on-active, #fff) !important;\n  border-color: var(--border-active, #f2c230) !important;\n  background: var(--surface-active, #1e3a5f) !important;\n}\n.admin-area-pending.has-pending small { color: inherit !important; }\n\n.admin-profile-view .admin-student-summary-list { gap: 12px !important; }\n.admin-profile-view .admin-student-summary-list .profile-menu-item {\n  min-height: 44px;\n  border-radius: 16px !important;\n}\n.admin-template-add-v159 {\n  min-width: 40px;\n  min-height: 40px;\n  font-size: 22px !important;\n  line-height: 1 !important;\n}\n\n@media (min-width: 1024px) {\n  .admin-area-shell.is-dashboard .admin-dashboard-search-wrap.is-student-sticky {\n    position: sticky !important;\n    top: 0 !important;\n    z-index: 28 !important;\n    padding-top: 10px !important;\n    padding-bottom: 10px !important;\n    background: var(--surface-deep, #04162f) !important;\n    backdrop-filter: none !important;\n    -webkit-backdrop-filter: none !important;\n  }\n}\n\n@media (max-width: 1023.98px) {\n  .admin-profile-view .admin-student-summary-list {\n    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;\n    gap: 12px !important;\n  }\n  .admin-profile-view .admin-student-summary-list .profile-menu-item {\n    height: 84px !important;\n    min-height: 84px !important;\n    border-radius: 16px !important;\n  }\n}\n`);

// Load the new CSS last.
replaceOnce(
  'scr/main.tsx',
  'import "./styles/build-1.5.8.css";',
  'import "./styles/build-1.5.8.css";\nimport "./styles/build-1.5.9.css";',
  'main 1.5.9 css',
);

// Package + inherited contract chain remain forward compatible.
replaceOnce('package.json', '"version": "1.5.8"', '"version": "1.5.9"', 'package version');
replaceOnce('package.json', 'verify-visual-contracts-1.5.8.mjs', 'verify-visual-contracts-1.5.9.mjs', 'package contracts');

replaceOnce(
  'scripts/verify-visual-contracts-1.5.6.mjs',
  '/verify-visual-contracts-1\\.5\\.(?:6|7)\\.mjs/',
  '/verify-visual-contracts-1\\.5\\.(?:[6-9]|\\d{2,})\\.mjs/',
  '156 forward contracts',
);
replaceOnce(
  'scripts/verify-visual-contracts-1.5.7.mjs',
  '/"version":\\s*"1\\.5\\.7"/',
  '/"version":\\s*"1\\.5\\.(?:[7-9]|\\d{2,})"/',
  '157 forward version',
);
replaceOnce(
  'scripts/verify-visual-contracts-1.5.7.mjs',
  '/verify-visual-contracts-1\\.5\\.7\\.mjs/',
  '/verify-visual-contracts-1\\.5\\.(?:[7-9]|\\d{2,})\\.mjs/',
  '157 forward contracts',
);
replaceOnce(
  'scripts/verify-visual-contracts-1.5.8.mjs',
  '/"version":\\s*"1\\.5\\.8"/',
  '/"version":\\s*"1\\.5\\.(?:[8-9]|\\d{2,})"/',
  '158 forward version',
);
replaceOnce(
  'scripts/verify-visual-contracts-1.5.8.mjs',
  '/verify-visual-contracts-1\\.5\\.8\\.mjs/',
  '/verify-visual-contracts-1\\.5\\.(?:8|9|\\d{2,})\\.mjs/',
  '158 forward contracts',
);

write('scripts/verify-visual-contracts-1.5.9.mjs', `import "./verify-visual-contracts-1.5.8.mjs";\nimport fs from "node:fs";\nimport path from "node:path";\nimport { fileURLToPath } from "node:url";\n\nconst root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");\nconst failures = [];\nconst passes = [];\nconst read = (file) => fs.readFileSync(path.join(root, file), "utf8");\nconst requireMatch = (id, file, pattern, note) => pattern.test(read(file)) ? passes.push(id) : failures.push(\`\${id} — \${note} (\${file})\`);\nconst requireAll = (id, file, patterns, note) => patterns.every((pattern) => pattern.test(read(file))) ? passes.push(id) : failures.push(\`\${id} — \${note} (\${file})\`);\nconst requireAbsent = (id, file, pattern, note) => !pattern.test(read(file)) ? passes.push(id) : failures.push(\`\${id} — \${note} (\${file})\`);\n\nconst css = "scr/styles/build-1.5.9.css";\nconst area = "scr/pages/AdminArea.tsx";\nconst entry = "scr/pages/WorkoutBuilderEntry.tsx";\nconst builder = "scr/pages/AdminWorkoutBuilder.tsx";\nconst admin = "scr/lib/admin.ts";\n\nrequireMatch("159/version", "package.json", /"version":\\s*"1\\.5\\.9"/, "package não está em 1.5.9");\nrequireMatch("159/contracts", "package.json", /verify-visual-contracts-1\\.5\\.9\\.mjs/, "npm não executa contratos 1.5.9");\nrequireMatch("159/css-last", "scr/main.tsx", /build-1\\.5\\.8\\.css";\\s*\\nimport "\\.\\/styles\\/build-1\\.5\\.9\\.css";/, "camada 1.5.9 não é a última da cascata");\n\nrequireAll("159/roster-stable", area, [/studentsHydratedRef/, /if \\(!studentsHydratedRef\\.current\\) setStudentsLoading\\(true\\)/], "lista não preserva dados durante atualização explícita");\nrequireAbsent("159/no-roster-poll", area, /setInterval\\(refresh,\\s*15000\\)|addEventListener\\("focus",\\s*refresh\\)|visibilitychange/, "polling/focus antigo ainda desmonta a lista");\nrequireAll("159/sticky-search", area, [/is-student-sticky/, /admin-dashboard-search-wrap/], "busca/filtros não usam grupo sticky");\nrequireAll("159/sticky-opaque", css, [/is-student-sticky[\\s\\S]*?position:\\s*sticky/, /top:\\s*0/, /background:\\s*var\\(--surface-deep/], "grupo sticky não é opaco/ancorado");\nrequireAll("159/pending-active", css, [/admin-area-pending\\.has-pending/, /--surface-active/, /--text-on-active/, /--border-active/], "badge pendentes não usa tokens ativos");\nrequireAll("159/profile-grid", css, [/admin-student-summary-list[\\s\\S]*?gap:\\s*12px/, /profile-menu-item[\\s\\S]*?border-radius:\\s*16px/, /min-height:\\s*44px/, /height:\\s*84px/], "grid do perfil perdeu encaixe/touch target");\n\nrequireAll("159/template-plus", area, [/admin-template-add-v159/, /\\/area-accqua\\/montar\\?modo=modelo/, /Criar novo modelo de treino/], "Modelos não possui entrada + dedicada");\nrequireAll("159/template-entry", entry, [/templateMode/, /WORKOUT_TEMPLATE_STUDENT_ID/, /montar\\/editor\\?student=/, /modo=modelo/], "modo modelo não converge no editor comum");\nrequireAll("159/template-context", admin, [/WORKOUT_TEMPLATE_STUDENT_ID/, /fullName:\\s*"Modelo da equipe"/, /objective:\\s*"Modelo reutilizável"/], "editor não possui contexto seguro sem aluno real");\nrequireAll("159/template-save", admin, [/input\\.studentId === WORKOUT_TEMPLATE_STUDENT_ID/, /saveAdminProgramTemplate\\(input\\.staffId/, /programName:\\s*modelName/], "salvar modo modelo não grava na biblioteca existente");\nrequireAll("159/template-return", builder, [/modelMode/, /section=templates/, /Modelo salvo na biblioteca da equipe/], "editor não retorna para Modelos após salvar");\n\nif (failures.length) {\n  console.error("\\nACCQUA Build 1.5.9 — contratos FALHARAM:\\n");\n  failures.forEach((failure) => console.error(\` - \${failure}\`));\n  console.error(\`\\n\${failures.length} contrato(s) 1.5.9 quebrado(s).\`);\n  process.exit(1);\n}\nconsole.log(\`ACCQUA Build 1.5.9 — \${passes.length} contratos validados.\`);\n`);

console.log('Build 1.5.9 source patch applied successfully.');
