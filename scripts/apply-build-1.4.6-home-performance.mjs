import { readFile, writeFile } from "node:fs/promises";

const file = "scr/pages/TestMenu.tsx";
let source = await readFile(file, "utf8");

const replacements = [
  [
`  const [showSplash, setShowSplash] = useState(() => {
    const skipNextSplash = window.sessionStorage.getItem("accqua:skip-next-menu-splash");
    if (skipNextSplash === "1") {
      window.sessionStorage.removeItem("accqua:skip-next-menu-splash");
      return false;
    }
    return true;
  });
`,
``
  ],
  [
`    enabled: Boolean(user?.id),
    refetchInterval: 30_000,
`,
`    enabled: Boolean(user?.id),
`
  ],
  [
`    enabled: Boolean(user?.id),
    refetchInterval: 45_000,
`,
`    enabled: Boolean(user?.id),
`
  ],
  [
`  useEffect(() => {
    if (!showSplash) return;
    const timer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => window.clearTimeout(timer);
  }, [showSplash]);

`,
``
  ],
  [
`      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions" }, invalidateHome)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_set_logs" }, invalidateHome)
`,
`      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions", filter: \`student_id=eq.\${user.id}\` }, invalidateHome)
`
  ],
  [
`  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (showSplash) return <LoadingSplash />;
`,
`  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
`
  ],
];

let changed = 0;
for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    if (to && source.includes(to)) continue;
    throw new Error(`Build 1.4.6 Home patch pattern not found:\n${from.slice(0, 100)}`);
  }
  source = source.replace(from, to);
  changed += 1;
}

await writeFile(file, source);
console.log(`Build 1.4.6 Home performance fixes: ${changed}`);
