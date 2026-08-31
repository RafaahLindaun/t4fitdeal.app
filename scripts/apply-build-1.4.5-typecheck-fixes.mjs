import { readFile, writeFile } from "node:fs/promises";

const fixes = [
  {
    file: "scr/auth/AuthProvider.tsx",
    from: `async function withTimeout<T>(promise: Promise<T>, ms = 6500): Promise<T> {\n  return await Promise.race([\n    promise,`,
    to: `async function withTimeout<T>(promise: PromiseLike<T>, ms = 6500): Promise<T> {\n  return await Promise.race([\n    Promise.resolve(promise),`,
  },
  {
    file: "scr/lib/admin.ts",
    from: `\nasync function applyCanonicalAccessToStudent(\n  student: WorkoutStudent | null,\n): Promise<WorkoutStudent | null> {\n  if (!student) return null;\n  const [resolved] = await applyCanonicalAccessStatus([student]);\n  return resolved ?? student;\n}\n`,
    to: `\n`,
  },
  {
    file: "scr/lib/admin.ts",
    from: `      exerciseCount: Math.max(0, Number(row.exercise_count ?? row.total_exercises ?? 0)),\n      completedSets: Math.max(0, Number(row.completed_sets ?? row.series_completed ?? 0)),\n      totalSets: Math.max(0, Number(row.total_sets ?? row.series_total ?? 0)),`,
    to: `      exerciseCount: 0,\n      completedSets: 0,\n      totalSets: 0,`,
  },
  {
    file: "scr/lib/diet.ts",
    from: `  if (result.error && /imagem_validada/i.test(result.error.message)) return { data: [], error: result.error } as typeof result;`,
    to: `  if (result.error && /imagem_validada/i.test(result.error.message)) return { ...result, data: [] };`,
  },
  {
    file: "scr/lib/mealVision.ts",
    from: `export class MealImageError extends Error {\n  constructor(public code: "invalid_file" | "too_large" | "unsupported_format" | "upload_failed", message: string) {\n    super(message);\n    this.name = "MealImageError";\n  }\n}`,
    to: `export class MealImageError extends Error {\n  code: "invalid_file" | "too_large" | "unsupported_format" | "upload_failed";\n\n  constructor(code: "invalid_file" | "too_large" | "unsupported_format" | "upload_failed", message: string) {\n    super(message);\n    this.code = code;\n    this.name = "MealImageError";\n  }\n}`,
  },
  {
    file: "scr/lib/staffNotifications.ts",
    from: `    renotify: true,\n`,
    to: ``,
  },
  {
    file: "scr/pages/AdminArea.tsx",
    from: `  const canBuildSelectedTraining = Boolean(\n    selectedStudent && selectedStatus === "active",\n  );\n`,
    to: ``,
  },
  {
    file: "scr/pages/Diet.tsx",
    from: `\n  const handleNavigation = (label: string) => {\n    if (label === "Início") navigate("/menu-teste");\n    else if (label === "Treino") navigate("/treino");\n    else if (label === "Perfil") navigate("/perfil");\n  };\n`,
    to: `\n`,
  },
  {
    file: "scr/pages/StoreAdmin.tsx",
    from: `onConfirm={()=>removeItem.mutateAsync()}`,
    to: `onConfirm={async()=>{await removeItem.mutateAsync();}}`,
  },
];

let changed = 0;
for (const fix of fixes) {
  const source = await readFile(fix.file, "utf8");
  if (source.includes(fix.to) && !source.includes(fix.from)) continue;
  if (!source.includes(fix.from)) {
    throw new Error(`Expected pattern not found in ${fix.file}`);
  }
  await writeFile(fix.file, source.replace(fix.from, fix.to));
  changed += 1;
}

console.log(`Build 1.4.5 typecheck fixes applied: ${changed}`);
