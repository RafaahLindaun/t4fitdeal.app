import { readFile, writeFile } from "node:fs/promises";

const file = "scr/pages/TestMenu.tsx";
let source = await readFile(file, "utf8");

function replaceOnce(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Build 1.4.7 patch não encontrou: ${label}`);
  source = source.replace(from, to);
}

replaceOnce(
  'import CheckInButton from "../components/home/CheckInButton";\n',
  'import CheckInButton from "../components/home/CheckInButton";\nimport NotificationsSheet from "../components/home/NotificationsSheet";\n',
  "import NotificationsSheet",
);

replaceOnce(
  '  const [qrSessionId, setQrSessionId] = useState<string | null>(null);\n',
  '  const [qrSessionId, setQrSessionId] = useState<string | null>(null);\n  const [notificationsOpen, setNotificationsOpen] = useState(false);\n',
  "estado notificationsOpen",
);

replaceOnce(
`  const openNotifications = async () => {
    const firstAlert = workoutAlerts[0];
    if (canManageStudents && firstAlert) {
      await markWorkoutRequiredAlertRead(firstAlert.id);
      navigate(\`/area-accqua?student=\${firstAlert.studentId}\`);
      return;
    }

    if (unreadNotifications > 0) {
      setMessage(\`\${unreadNotifications} notificaç\${unreadNotifications === 1 ? "ão não lida" : "ões não lidas"}.\`);
      return;
    }

    if (canManageStudents) {
      const permission = await requestStaffNotificationPermission();
      if (permission === "granted") setMessage("Alertas da ACCQUA ativados no celular.");
      else if (permission === "denied") setMessage("As notificações estão bloqueadas no navegador.");
      else setMessage("Você não possui novas notificações.");
      return;
    }

    setMessage("Você não possui novas notificações.");
  };
`,
`  const openNotifications = async () => {
    setNotificationsOpen(true);
    if (canManageStudents) void requestStaffNotificationPermission();
  };
`,
  "openNotifications",
);

replaceOnce(
`      <WorkoutQrDialog
        open={qrOpen}
`,
`      <NotificationsSheet
        userId={user.id}
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        staffAlerts={workoutAlerts}
        onStaffAlertClick={async (alert) => {
          await markWorkoutRequiredAlertRead(alert.id);
          setWorkoutAlerts((current) => current.filter((item) => item.id !== alert.id));
          setNotificationsOpen(false);
          navigate(\`/area-accqua?student=\${alert.studentId}\`);
        }}
      />

      <WorkoutQrDialog
        open={qrOpen}
`,
  "render NotificationsSheet",
);

await writeFile(file, source);
console.log("Build 1.4.7 Home notifications patch aplicado.");
