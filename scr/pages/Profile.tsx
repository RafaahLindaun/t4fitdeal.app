import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, useMotionValueEvent, useReducedMotion, useSpring } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import ProfilePhotoViewer from "../components/ProfilePhotoViewer";
import { loadActiveWorkoutCardioPrescription } from "../lib/cardio";
import {
  changeMyPassword,
  loadProfileDashboard,
  savePersonalProfile,
  saveProfilePreferences,
  uploadProfileAvatar,
  type PersonalProfileInput,
  type ProfileActivity,
  type ProfileActivityKind,
  type ProfileDashboard,
  type ProfilePreferences,
} from "../lib/profile";
import { cacheFeedbackPreferences, performHaptic, playAccquaChime } from "../lib/appFeedback";
import { useTreinoStatus } from "../hooks/useTreinoStatus";
import { cancelMyReservation, loadMyReservations } from "../lib/store";
import "./profile.css";

type ProfileView =
  | "main"
  | "personal"
  | "history"
  | "workouts"
  | "classes"
  | "notifications"
  | "settings"
  | "security"
  | "support";

type IconName =
  | "arrow"
  | "user"
  | "history"
  | "dumbbell"
  | "calendar"
  | "bell"
  | "settings"
  | "lock"
  | "help"
  | "chevron"
  | "logout"
  | "trophy"
  | "flame"
  | "clock"
  | "check"
  | "shield"
  | "phone"
  | "mail"
  | "target"
  | "edit"
  | "cardio"
  | "star"
  | "home";

function ProfileIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, JSX.Element> = {
    arrow: <><path d="m15 18-6-6 6-6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.8 20c.8-4 3.2-6 7.2-6s6.4 2 7.2 6" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
    dumbbell: <><path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="M8 14h3M13 14h3M8 18h3" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 4.2 1.8c-1 .8-1.9 1.3-1.9 2.7" /><path d="M12 17h.01" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 4h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-5" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6" /></>,
    flame: <><path d="M12 22c4 0 7-3 7-7 0-5-4-8-6-12 0 4-3 5-4 8-1-1-2-2-2-4-2 3-3 5-3 8 0 4 4 7 8 7Z" /><path d="M10 18c0-2 2-3 2-5 2 2 3 3 3 5a3 3 0 0 1-5 0Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    phone: <><path d="M7 3h3l1.5 4-2 1.5a16 16 0 0 0 6 6l1.5-2L21 14v3c0 2-1 4-4 4C9 20 4 15 3 7c0-3 2-4 4-4Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    edit: <><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m13 7 4 4" /></>,
    cardio: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
    star: <><path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const viewTitles: Record<ProfileView, string> = {
  main: "Perfil",
  personal: "Dados pessoais",
  history: "Histórico",
  workouts: "Meus treinos",
  classes: "Minhas aulas",
  notifications: "Notificações",
  settings: "Configurações",
  security: "Segurança",
  support: "Ajuda e suporte",
};

const emptyDashboard: ProfileDashboard = {
  details: {
    id: "",
    email: "",
    fullName: "",
    cpf: "",
    phone: "",
    emergencyPhone: "",
    birthDate: "",
    objective: "",
    registrationCode: "",
    gympassNumber: "",
    avatarUrl: "",
    memberSince: "",
    showInRanking: true,
    role: "student",
    status: "active",
  },
  preferences: {
    workoutNotifications: true,
    classNotifications: true,
    activityReminders: true,
    newsNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true,
    classReminderMinutes: 120,
  },
  activities: [],
  classes: [],
  activeWorkout: null,
  rankingPoints: 0,
  totalWorkoutSessions: 0,
  totalCardioMinutes: 0,
  totalClasses: 0,
  totalCalories: 0,
};

function formatMemberSince(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Membro ACCQUA";
  return `Membro desde ${new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date)}`;
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatDuration(seconds: number) {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  return `${minutes} min`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function initials(name: string) {
  const pieces = name.trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return "AS";
  return `${pieces[0]?.[0] ?? ""}${pieces.length > 1 ? pieces.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function firstNameFromStaffEmail(email: string) {
  const localPart = email.trim().split("@")[0] ?? "";
  const firstPart = localPart.split(/[._\-+]+/).filter(Boolean)[0] ?? "";
  if (!firstPart) return "Equipe ACCQUA";
  return `${firstPart.charAt(0).toUpperCase()}${firstPart.slice(1).toLowerCase()}`;
}

function staffRoleLabel(role: string) {
  const normalized = role.trim().toLowerCase();
  if (normalized === "professor") return "Professor";
  if (normalized === "reception" || normalized === "recepcao") return "Recepção";
  if (normalized === "admin") return "Administração";
  return "Equipe ACCQUA";
}

function activityIcon(kind: ProfileActivityKind): IconName {
  if (kind === "cardio") return "cardio";
  if (kind === "class") return "calendar";
  return "dumbbell";
}

function activityLabel(kind: ProfileActivityKind) {
  if (kind === "cardio") return "Cardio";
  if (kind === "class") return "Aula";
  return "Treino";
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (["attended", "presente", "completed", "concluida", "concluída"].includes(normalized)) return "Concluída";
  if (["reserved", "booked", "agendada", "reservada", "reservado"].includes(normalized)) return "Agendada";
  if (["cancelled", "canceled", "cancelada", "cancelado"].includes(normalized)) return "Cancelada";
  if (["missed", "faltou", "ausente"].includes(normalized)) return "Ausente";
  return status || "Registrada";
}

function ActivityList({ activities }: { activities: ProfileActivity[] }) {
  if (!activities.length) {
    return (
      <div className="accqua-profile-empty">
        <span><ProfileIcon name="history" size={31} /></span>
        <strong>Nenhum registro ainda</strong>
        <p>Seus treinos, cardios e aulas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="accqua-profile-activity-list">
      {activities.map((activity) => (
        <article className="accqua-profile-activity" key={`${activity.kind}-${activity.id}`}>
          <span className={`activity-symbol is-${activity.kind}`}>
            <ProfileIcon name={activityIcon(activity.kind)} size={22} />
          </span>
          <div className="activity-copy">
            <div className="activity-heading">
              <strong>{activity.title || activityLabel(activity.kind)}</strong>
              {activity.validForRanking ? (
                <span className="activity-ranking" title="Contou para o ranking">
                  <ProfileIcon name="star" size={13} />
                </span>
              ) : null}
            </div>
            <span>{formatDate(activity.performedAt, true)}</span>
            <div className="activity-meta">
              {activity.durationSeconds > 0 ? <i>{formatDuration(activity.durationSeconds)}</i> : null}
              {activity.calories > 0 ? <i>{activity.calories} kcal</i> : null}
              {activity.kind === "workout" ? (
                <i>
                  {activity.completionPercentage >= 100
                    ? "Treino completo"
                    : `${Math.round(activity.completionPercentage)}% concluído`}
                </i>
              ) : null}
              {activity.kind === "class" ? <i>{statusLabel(activity.status)}</i> : null}
              {activity.kind === "class" && activity.instructorName ? <i>{activity.instructorName}</i> : null}
            </div>
          </div>
          <ProfileIcon name="chevron" size={18} />
        </article>
      ))}
    </div>
  );
}

function AnimatedProfileNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const spring = useSpring(0, { stiffness: 145, damping: 22, mass: 0.7 });
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(Math.max(0, Math.round(latest)));
  });

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(Math.max(0, Math.round(value)));
      return;
    }
    spring.set(Math.max(0, value));
  }, [reduceMotion, spring, value]);

  return <>{display.toLocaleString("pt-BR")}</>;
}

const profileStatsVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

const profileStatVariants = {
  hidden: { opacity: 0, y: 9, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.24 } },
};

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading, landingPath, signOut, refreshProfile } = useAuth();
  const treinoStatus = useTreinoStatus(user?.id ?? "", { periodo: "hoje" });
  const reservationsQuery = useQuery({ queryKey: ["my-reservations", user?.id], queryFn: () => loadMyReservations(user!.id), enabled: Boolean(user?.id), staleTime: 20_000 });
  const cancelReservationMutation = useMutation({ mutationFn: cancelMyReservation, onSuccess: async () => { setMessage("Reserva cancelada."); await queryClient.invalidateQueries({ queryKey: ["my-reservations", user?.id] }); }, onError: () => setMessage("Não foi possível cancelar esta reserva.") });
  const [view, setView] = useState<ProfileView>(() => {
    const query = new URLSearchParams(window.location.search).get("view");
    return query === "settings" ? "settings" : "main";
  });
  const [dashboard, setDashboard] = useState<ProfileDashboard>(emptyDashboard);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [message, setMessage] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | ProfileActivityKind>("all");
  const [saving, setSaving] = useState(false);
  const [personalForm, setPersonalForm] = useState<PersonalProfileInput>({
    fullName: "",
    phone: "",
    emergencyPhone: "",
    birthDate: "",
    objective: "",
    gympassNumber: "",
    showInRanking: true,
  });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmation: "" });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAvatarHint, setShowAvatarHint] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const reload = async () => {
    if (!user?.id) return;
    setLoadingDashboard(true);
    try {
      const next = await loadProfileDashboard(user.id, profile, user.created_at);
      setDashboard(next);
      cacheFeedbackPreferences(user.id, {
        soundEnabled: next.preferences.soundEnabled,
        vibrationEnabled: next.preferences.vibrationEnabled,
        classNotifications: next.preferences.classNotifications,
        classReminderMinutes: next.preferences.classReminderMinutes,
      });
      setPersonalForm({
        fullName: next.details.fullName,
        phone: next.details.phone,
        emergencyPhone: next.details.emergencyPhone,
        birthDate: next.details.birthDate ? next.details.birthDate.slice(0, 10) : "",
        objective: next.details.objective,
        gympassNumber: next.details.gympassNumber,
        showInRanking: next.details.showInRanking,
      });
    } catch {
      setMessage("Não foi possível atualizar o perfil agora.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [user?.id]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (loadingDashboard || dashboard.details.avatarUrl) {
      setShowAvatarHint(false);
      return;
    }
    const key = "accqua:profile-avatar-hint-seen";
    if (window.sessionStorage.getItem(key)) return;
    setShowAvatarHint(true);
    const timer = window.setTimeout(() => {
      setShowAvatarHint(false);
      window.sessionStorage.setItem(key, "1");
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [loadingDashboard, dashboard.details.avatarUrl]);

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLogoutConfirmOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [logoutConfirmOpen]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return dashboard.activities;
    return dashboard.activities.filter((item) => item.kind === historyFilter);
  }, [dashboard.activities, historyFilter]);

  const workoutHistory = useMemo(
    () => dashboard.activities.filter((item) => item.kind === "workout"),
    [dashboard.activities],
  );

  const upcomingClasses = useMemo(() => {
    const now = Date.now();
    return dashboard.classes.filter((item) => {
      const scheduled = new Date(item.performedAt).getTime();
      return scheduled >= now && !["cancelled", "canceled", "cancelada", "cancelado"].includes(item.status.toLowerCase());
    });
  }, [dashboard.classes]);

  const pastClasses = useMemo(() => {
    const now = Date.now();
    return dashboard.classes.filter((item) => new Date(item.performedAt).getTime() < now);
  }, [dashboard.classes]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;

  const details = dashboard.details;
  const active = details.status === "active" || profile?.status === "active";
  const resolvedRole = String(details.role || profile?.role || "student").toLowerCase();
  const isStaffProfile = ["professor", "reception", "recepcao", "admin"].includes(
    resolvedRole,
  );
  const profileDisplayName = isStaffProfile
    ? firstNameFromStaffEmail(details.email || user.email || "")
    : details.fullName || "Aluno ACCQUA";
  const profileStatusLabel = isStaffProfile
    ? staffRoleLabel(resolvedRole)
    : active
      ? "Matrícula ativa"
      : "Conta autorizada";
  const statsAreEmpty =
    !treinoStatus.isLoading &&
    (treinoStatus.data?.totalCompleted ?? 0) === 0 &&
    dashboard.totalCardioMinutes === 0 &&
    dashboard.totalClasses === 0 &&
    dashboard.rankingPoints === 0;

  const openView = (nextView: ProfileView) => {
    setView(nextView);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (view === "main") {
      navigate("/menu-teste");
      return;
    }
    setView("main");
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBottomNavigation = async (label: string) => {
    if (label === "Início") {
      window.sessionStorage.setItem("accqua:skip-next-menu-splash", "1");
      navigate("/menu-teste");
      return;
    }
    if (label === "Perfil") {
      setView("main");
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (label === "Aulas") {
      navigate("/aulas");
      return;
    }
    if (label === "Treino") {
      const cardio = await loadActiveWorkoutCardioPrescription(user.id);
      navigate(cardio?.timing === "before" ? "/cardio" : "/treino");
    }
  };



  const enableDeviceNotifications = async () => {
    if (!("Notification" in window)) {
      setMessage("Este navegador não oferece notificações do sistema.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setMessage(permission === "granted" ? "Notificações do celular ativadas." : "Permissão de notificação não concedida.");
    } catch {
      setMessage("Não foi possível solicitar a permissão neste navegador.");
    }
  };

  const chooseAvatar = () => avatarInputRef.current?.click();

  const changeAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user?.id) return;
    setUploadingAvatar(true);
    const result = await uploadProfileAvatar(user.id, file);
    setUploadingAvatar(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    await reload();
    setMessage("Foto de perfil atualizada.");
  };

  const savePersonal = async (event: FormEvent) => {
    event.preventDefault();
    if (!personalForm.fullName.trim()) {
      setMessage("Informe seu nome completo.");
      return;
    }
    setSaving(true);
    const result = await savePersonalProfile(personalForm);
    setSaving(false);
    if (result.error) {
      setMessage("Não foi possível salvar seus dados.");
      return;
    }
    await refreshProfile();
    await reload();
    setMessage("Dados pessoais atualizados.");
  };

  const updatePreferences = async (
    key: Exclude<keyof ProfilePreferences, "classReminderMinutes">,
    value: boolean,
  ) => {
    const next = { ...dashboard.preferences, [key]: value };
    setDashboard((current) => ({ ...current, preferences: next }));

    if (["workoutNotifications", "classNotifications", "activityReminders", "newsNotifications"].includes(key) && value && "Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // O navegador pode recusar o pedido sem comprometer as preferências internas.
      }
    }

    cacheFeedbackPreferences(user.id, { soundEnabled: next.soundEnabled, vibrationEnabled: next.vibrationEnabled });
    if (key === "soundEnabled" && value) playAccquaChime(user.id, "success");
    if (key === "vibrationEnabled" && value) performHaptic(user.id, [45, 25, 45]);

    const result = await saveProfilePreferences(user.id, next);
    setMessage(result.error ? "Não foi possível salvar a preferência." : "Preferência salva.");
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.password.length < 8) {
      setMessage("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (passwordForm.password !== passwordForm.confirmation) {
      setMessage("As senhas digitadas não são iguais.");
      return;
    }
    setSaving(true);
    const result = await changeMyPassword(passwordForm.password);
    setSaving(false);
    if (result.error) {
      setMessage("Não foi possível alterar a senha.");
      return;
    }
    setPasswordForm({ password: "", confirmation: "" });
    setMessage("Senha alterada com segurança.");
  };

  const logout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="accqua-profile-screen">
      <div className="accqua-profile-background" aria-hidden="true">
        <span className="profile-orbit orbit-a" />
        <span className="profile-orbit orbit-b" />
        <span className="profile-glow" />
      </div>

      <main className="accqua-profile-shell">
        <div className="accqua-profile-top">
          <PageHeader className="accqua-profile-header" ariaLabel="Cabeçalho do perfil"
            left={view === "main" ? <span className="profile-header-space"/> : <button type="button" onClick={goBack} aria-label="Voltar"><ProfileIcon name="arrow" size={25}/></button>}
            center={<div className="accqua-profile-brand"><AccquaLogo compact /></div>}
            right={<span className="profile-header-space"/>}
          />

          <div className="accqua-profile-title-row">
            <div>
              <span>CONTA ACCQUA</span>
              <h1>{viewTitles[view]}</h1>
            </div>
            <span className="profile-title-space" aria-hidden="true" />
          </div>
        </div>

        <section
          className={`accqua-profile-content ${view === "main" ? "is-main-view" : "is-subview"}`}
          ref={contentRef}
        >
          {loadingDashboard ? (
            <div className="accqua-profile-loading" role="status" aria-live="polite">
              <img src="/accqua-logo-loading-oficial.png" alt="ACCQUA Sports Academia" />
              <span />
              <p>Carregando perfil</p>
            </div>
          ) : null}

          {!loadingDashboard && view === "main" ? (
            <>
              <section className="profile-identity-card">
                <motion.div className="profile-avatar-wrap" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }}>
                  <motion.div
                    className={`profile-avatar ${details.avatarUrl ? "is-clickable" : ""}`}
                    role={details.avatarUrl ? "button" : undefined}
                    tabIndex={details.avatarUrl ? 0 : undefined}
                    aria-label={details.avatarUrl ? "Ampliar foto de perfil" : undefined}
                    onClick={() => details.avatarUrl && setPhotoViewerOpen(true)}
                    onKeyDown={(event) => {
                      if (details.avatarUrl && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        setPhotoViewerOpen(true);
                      }
                    }}
                  >
                    {details.avatarUrl ? <img src={details.avatarUrl} alt="Foto do perfil" /> : <strong>{initials(profileDisplayName)}</strong>}
                    <span className={active ? "is-active" : ""} />
                  </motion.div>
                  <motion.button className="profile-avatar-action" type="button" onClick={chooseAvatar} aria-label="Alterar foto de perfil" disabled={uploadingAvatar}
                    animate={showAvatarHint ? { scale: [1, 1.12, 1], boxShadow: ["0 8px 18px rgba(0,0,0,.24)", "0 0 0 8px rgba(255,209,40,.12)", "0 8px 18px rgba(0,0,0,.24)"] } : undefined}
                    transition={showAvatarHint ? { duration: 1.15, repeat: 2, repeatDelay: 0.35 } : undefined}
                    whileTap={{ scale: 0.92 }}>
                    {uploadingAvatar ? "…" : <ProfileIcon name="edit" size={15} />}
                  </motion.button>
                </motion.div>
                <div className="profile-identity-copy">
                  <h2>{profileDisplayName}</h2>
                  <p>{formatMemberSince(details.memberSince)}</p>
                  <div className="profile-identity-tags">
                    <span className={isStaffProfile ? "is-role" : "is-status"}><i />{profileStatusLabel}</span>
                    {!isStaffProfile && details.registrationCode ? <span>#{details.registrationCode}</span> : null}
                  </div>
                </div>
              </section>

              <motion.section className="profile-stats-grid" aria-label="Resumo do perfil" variants={profileStatsVariants} initial="hidden" animate="visible">
                <motion.article variants={profileStatVariants}><div className="profile-stat-value"><span><ProfileIcon name="dumbbell" /></span><strong>{treinoStatus.isLoading ? "…" : treinoStatus.isError ? "—" : <AnimatedProfileNumber value={treinoStatus.data?.totalCompleted ?? 0} />}</strong></div><p>Treinos</p></motion.article>
                <motion.article variants={profileStatVariants}><div className="profile-stat-value"><span><ProfileIcon name="cardio" /></span><strong><AnimatedProfileNumber value={dashboard.totalCardioMinutes} /></strong></div><p>Min. cardio</p></motion.article>
                <motion.article variants={profileStatVariants}><div className="profile-stat-value"><span><ProfileIcon name="calendar" /></span><strong><AnimatedProfileNumber value={dashboard.totalClasses} /></strong></div><p>Aulas</p></motion.article>
                <motion.article variants={profileStatVariants}><div className="profile-stat-value"><span><ProfileIcon name="trophy" /></span><strong><AnimatedProfileNumber value={dashboard.rankingPoints} /></strong></div><p>Pontos</p></motion.article>
              </motion.section>

              {statsAreEmpty ? (
                <section className="profile-zero-summary" aria-label="Comece seu histórico">
                  <span className="profile-zero-summary-icon"><ProfileIcon name="star" size={24} /></span>
                  <div>
                    <strong>Seu progresso começa no primeiro registro</strong>
                    <p>Treinos, cardio, aulas e pontos aparecem aqui assim que você começar a usar o app.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dashboard.activeWorkout ? openView("workouts") : void handleBottomNavigation("Início")}
                  >
                    {dashboard.activeWorkout ? "Ver meu treino" : "Ir para início"}
                  </button>
                </section>
              ) : null}

              {dashboard.activeWorkout ? (
                <button className="profile-current-workout" type="button" onClick={() => openView("workouts")}>
                  <span className="current-workout-icon"><ProfileIcon name="dumbbell" size={27} /></span>
                  <div><small>SEU TREINO ATUAL</small><strong>{dashboard.activeWorkout.programName}</strong><p>{dashboard.activeWorkout.splitType || "PERSONALIZADO"} · {dashboard.activeWorkout.routines} ficha{dashboard.activeWorkout.routines === 1 ? "" : "s"}</p></div>
                  <ProfileIcon name="chevron" size={20} />
                </button>
              ) : null}

              <section className="profile-menu-section is-account-menu">
                <h3>Minha conta</h3>
                <div className="profile-menu-card">
                  <ProfileMenuItem icon="user" title="Dados pessoais" subtitle="Nome, contato, CPF e objetivo" onClick={() => openView("personal")} />
                  <ProfileMenuItem icon="history" title="Histórico de registros" subtitle="Treinos, cardio e aulas" onClick={() => openView("history")} />
                  <ProfileMenuItem icon="dumbbell" title="Meus treinos" subtitle="Ficha atual e treinos concluídos" onClick={() => openView("workouts")} />
                  <ProfileMenuItem icon="calendar" title="Minhas aulas" subtitle="Agendadas e já realizadas" onClick={() => openView("classes")} />
                </div>
              </section>

              <section className="profile-menu-section is-preferences-menu">
                <h3>Preferências e privacidade</h3>
                <div className="profile-menu-card">
                  <ProfileMenuItem icon="bell" title="Notificações" subtitle="Lembretes e avisos do aplicativo" onClick={() => openView("notifications")} />
                  <ProfileMenuItem icon="settings" title="Configurações" subtitle="Ranking, som e vibração" onClick={() => openView("settings")} />
                  <ProfileMenuItem icon="lock" title="Segurança" subtitle="Senha e acesso à conta" onClick={() => openView("security")} />
                  <ProfileMenuItem icon="help" title="Ajuda e suporte" subtitle="Orientações e recepção" onClick={() => openView("support")} />
                </div>
              </section>

              <section className="profile-menu-section profile-reservations-section">
                <div className="profile-section-heading"><div><small>LOJA ACCQUA</small><h3>Minhas peças reservadas</h3></div>{(reservationsQuery.data?.length ?? 0) > 0 ? <strong>{reservationsQuery.data?.length}</strong> : null}</div>
                {reservationsQuery.isLoading ? <div className="profile-reservation-empty">Carregando reservas...</div> : (reservationsQuery.data?.length ?? 0) ? (
                  <div className="profile-reservation-list">{reservationsQuery.data?.map((reservation) => (
                    <article key={reservation.id}>
                      <div className="profile-reservation-thumb">{reservation.product?.imageUrl ? <img src={reservation.product.imageUrl} alt="" /> : <ProfileIcon name="star" size={20} />}</div>
                      <div><strong>{reservation.product?.name ?? "Produto ACCQUA"}</strong><span>{new Date(reservation.reservedAt).toLocaleDateString("pt-BR")} · {reservation.status}</span></div>
                      {reservation.status === "reservado" ? <button type="button" disabled={cancelReservationMutation.isPending} onClick={() => cancelReservationMutation.mutate(reservation.id)}>Cancelar</button> : <span className={`profile-reservation-status is-${reservation.status}`}>{reservation.status}</span>}
                    </article>
                  ))}</div>
                ) : <div className="profile-reservation-empty">Você ainda não reservou nenhum item. <button type="button" onClick={() => navigate("/loja")}>Abrir Loja</button></div>}
              </section>

              <button type="button" className="profile-logout-button" onClick={() => setLogoutConfirmOpen(true)}>
                <ProfileIcon name="logout" size={20} />
                Sair da conta
              </button>
            </>
          ) : null}

          {!loadingDashboard && view === "personal" ? (
            <form className="profile-form" onSubmit={savePersonal}>
              <section className="profile-detail-hero">
                <button type="button" className="profile-avatar is-small" onClick={chooseAvatar} aria-label="Alterar foto">{details.avatarUrl ? <img src={details.avatarUrl} alt="Foto do perfil" /> : initials(personalForm.fullName)}<i className="profile-avatar-camera"><ProfileIcon name="edit" size={13} /></i></button>
                <div><strong>{personalForm.fullName || "Seu perfil"}</strong><p>Atualize seus dados de contato e objetivo.</p></div>
              </section>

              <div className="profile-form-card">
                <label>Nome completo<input value={personalForm.fullName} onChange={(event) => setPersonalForm({ ...personalForm, fullName: event.target.value })} /></label>
                <label>E-mail<input value={details.email} disabled /></label>
                <label>CPF<input value={formatCpf(details.cpf)} disabled /></label>
                <label>Matrícula<input value={details.registrationCode || "Não informada"} disabled /></label>
                <label>Número do Gympass<input value={personalForm.gympassNumber} onChange={(event) => setPersonalForm({ ...personalForm, gympassNumber: event.target.value })} placeholder="Opcional" autoComplete="off" /></label>
                <label>Telefone<input inputMode="tel" value={formatPhone(personalForm.phone)} onChange={(event) => setPersonalForm({ ...personalForm, phone: event.target.value.replace(/\D/g, "") })} /></label>
                <label>Telefone de emergência<input inputMode="tel" value={formatPhone(personalForm.emergencyPhone)} onChange={(event) => setPersonalForm({ ...personalForm, emergencyPhone: event.target.value.replace(/\D/g, "") })} /></label>
                <label>Data de nascimento<input type="date" value={personalForm.birthDate} onChange={(event) => setPersonalForm({ ...personalForm, birthDate: event.target.value })} /></label>
                <label>Objetivo<select value={personalForm.objective} onChange={(event) => setPersonalForm({ ...personalForm, objective: event.target.value })}><option value="">Selecione</option><option>Hipertrofia</option><option>Emagrecimento</option><option>Condicionamento</option><option>Saúde e qualidade de vida</option><option>Reabilitação</option></select></label>
              </div>

              <button className="profile-primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar dados"}</button>
            </form>
          ) : null}

          {!loadingDashboard && view === "history" ? (
            <section className="profile-subview">
              <div className="profile-history-summary">
                <article><ProfileIcon name="clock" /><strong>{formatDuration(dashboard.activities.reduce((sum, item) => sum + item.durationSeconds, 0))}</strong><span>Tempo registrado</span></article>
                <article><ProfileIcon name="flame" /><strong>{dashboard.totalCalories.toLocaleString("pt-BR")}</strong><span>Calorias</span></article>
              </div>
              <div className="profile-filter-tabs">
                {(["all", "workout", "cardio", "class"] as const).map((filter) => (
                  <button type="button" className={historyFilter === filter ? "is-active" : ""} onClick={() => setHistoryFilter(filter)} key={filter}>
                    {filter === "all" ? "Tudo" : filter === "workout" ? "Treinos" : filter === "cardio" ? "Cardio" : "Aulas"}
                  </button>
                ))}
              </div>
              <ActivityList activities={filteredHistory} />
            </section>
          ) : null}

          {!loadingDashboard && view === "workouts" ? (
            <section className="profile-subview">
              {dashboard.activeWorkout ? (
                <article className="profile-active-plan">
                  <span><ProfileIcon name="dumbbell" size={29} /></span>
                  <div><small>PROGRAMA ATIVO</small><h2>{dashboard.activeWorkout.programName}</h2><p>Divisão {dashboard.activeWorkout.splitType || "personalizada"} · {dashboard.activeWorkout.routines} ficha{dashboard.activeWorkout.routines === 1 ? "" : "s"}</p>{dashboard.activeWorkout.reviewAt ? <i>Revisão em {formatDate(dashboard.activeWorkout.reviewAt)}</i> : null}</div>
                </article>
              ) : (
                <div className="accqua-profile-empty"><span><ProfileIcon name="dumbbell" size={31} /></span><strong>Nenhum treino ativo</strong><p>Quando seu professor publicar uma ficha, ela aparecerá aqui.</p></div>
              )}
              <div className="profile-section-heading"><div><small>REGISTROS</small><h3>Treinos concluídos</h3></div><strong>{workoutHistory.length}</strong></div>
              <ActivityList activities={workoutHistory} />
            </section>
          ) : null}

          {!loadingDashboard && view === "classes" ? (
            <section className="profile-subview">
              <div className="profile-section-heading"><div><small>AGENDA</small><h3>Próximas aulas</h3></div><strong>{upcomingClasses.length}</strong></div>
              <ActivityList activities={upcomingClasses} />
              <div className="profile-section-heading is-spaced"><div><small>HISTÓRICO</small><h3>Aulas realizadas</h3></div><strong>{pastClasses.length}</strong></div>
              <ActivityList activities={pastClasses} />
            </section>
          ) : null}

          {!loadingDashboard && view === "notifications" ? (
            <section className="profile-subview">
              <div className="profile-info-banner"><ProfileIcon name="bell" size={25} /><div><strong>Alertas do seu treino</strong><p>Escolha quais avisos deseja receber no aplicativo e no celular.</p></div></div>
              {notificationPermission !== "granted" && notificationPermission !== "unsupported" ? (
                <button className="profile-notification-permission" type="button" onClick={() => void enableDeviceNotifications()}>Ativar notificações do celular</button>
              ) : null}
              <div className="profile-toggle-card">
                <ProfileToggle title="Treinos e atualizações" subtitle="Nova ficha, alteração e lembrete de treino" checked={dashboard.preferences.workoutNotifications} onChange={(value) => void updatePreferences("workoutNotifications", value)} />
                <ProfileToggle title="Aulas e horários" subtitle="Reservas, mudanças e lembretes de aula" checked={dashboard.preferences.classNotifications} onChange={(value) => void updatePreferences("classNotifications", value)} />
                <label className="profile-reminder-select"><span><strong>Lembrete antes da aula</strong><small>Para aulas que você já reservou</small></span><select value={dashboard.preferences.classReminderMinutes} disabled={!dashboard.preferences.classNotifications} onChange={(event) => { const next = { ...dashboard.preferences, classReminderMinutes: Number(event.target.value) }; setDashboard((current) => ({ ...current, preferences: next })); cacheFeedbackPreferences(user.id, { classReminderMinutes: next.classReminderMinutes }); void saveProfilePreferences(user.id, next).then((result) => setMessage(result.error ? "Não foi possível salvar a preferência." : "Preferência salva.")); }}><option value={30}>30 min antes</option><option value={60}>1h antes</option><option value={120}>2h antes</option><option value={240}>4h antes</option></select></label>
                <ProfileToggle title="Lembrete de atividade" subtitle="Ajuda para manter sua frequência" checked={dashboard.preferences.activityReminders} onChange={(value) => void updatePreferences("activityReminders", value)} />
                <ProfileToggle title="Novidades da ACCQUA" subtitle="Comunicados importantes da academia" checked={dashboard.preferences.newsNotifications} onChange={(value) => void updatePreferences("newsNotifications", value)} />
              </div>
            </section>
          ) : null}

          {!loadingDashboard && view === "settings" ? (
            <section className="profile-subview">
              <div className="profile-toggle-card">
                <ProfileToggle title="Aparecer no ranking" subtitle="Mostra seu primeiro nome e foto" checked={personalForm.showInRanking} onChange={async (value) => { const next = { ...personalForm, showInRanking: value }; setPersonalForm(next); const result = await savePersonalProfile(next); setMessage(result.error ? "Não foi possível salvar." : "Configuração salva."); }} />
                <ProfileToggle title="Sons do aplicativo" subtitle="Avisos sonoros durante as atividades" checked={dashboard.preferences.soundEnabled} onChange={(value) => void updatePreferences("soundEnabled", value)} />
                <ProfileToggle title="Vibração" subtitle="Feedback sutil nos controles" checked={dashboard.preferences.vibrationEnabled} onChange={(value) => void updatePreferences("vibrationEnabled", value)} />
              </div>
              <div className="profile-settings-note"><ProfileIcon name="shield" size={23} /><div><strong>Privacidade protegida</strong><p>CPF, telefone e e-mail continuam privados. No ranking aparecem somente o primeiro nome e a foto escolhida.</p></div></div>
            </section>
          ) : null}

          {!loadingDashboard && view === "security" ? (
            <section className="profile-subview">
              <div className="profile-security-card"><span><ProfileIcon name="shield" size={31} /></span><div><strong>Sua conta está protegida</strong><p>Altere sua senha sempre que achar necessário.</p></div></div>
              <form className="profile-form" onSubmit={savePassword}>
                <div className="profile-form-card">
                  <label>Nova senha<input type="password" autoComplete="new-password" value={passwordForm.password} onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })} placeholder="Mínimo de 8 caracteres" /></label>
                  <label>Confirmar nova senha<input type="password" autoComplete="new-password" value={passwordForm.confirmation} onChange={(event) => setPasswordForm({ ...passwordForm, confirmation: event.target.value })} placeholder="Digite novamente" /></label>
                </div>
                <button className="profile-primary-button" type="submit" disabled={saving}>{saving ? "Alterando..." : "Alterar senha"}</button>
              </form>
            </section>
          ) : null}

          {!loadingDashboard && view === "support" ? (
            <section className="profile-subview">
              <div className="profile-support-hero"><span><ProfileIcon name="help" size={34} /></span><h2>Como podemos ajudar?</h2><p>Encontre orientações rápidas ou fale com a recepção da academia.</p></div>
              <div className="profile-menu-card">
                <a className="profile-menu-item" href="tel:+551147181730"><span className="profile-menu-icon"><ProfileIcon name="phone" size={22} /></span><div><strong>Ligar para a recepção</strong><p>(11) 4718-1730</p></div><ProfileIcon name="chevron" size={19} /></a>
                <button className="profile-menu-item" type="button" onClick={() => setMessage("Leve esta tela até a recepção para receber ajuda.")}><span className="profile-menu-icon"><ProfileIcon name="user" size={22} /></span><div><strong>Atendimento presencial</strong><p>Ajuda com cadastro, acesso e matrícula</p></div><ProfileIcon name="chevron" size={19} /></button>
                <button className="profile-menu-item" type="button" onClick={() => setMessage("Atualize a página e tente novamente. Se continuar, fale com a recepção.")}><span className="profile-menu-icon"><ProfileIcon name="settings" size={22} /></span><div><strong>Problemas no aplicativo</strong><p>Orientações para acesso e carregamento</p></div><ProfileIcon name="chevron" size={19} /></button>
              </div>
            </section>
          ) : null}
        </section>

        <input ref={avatarInputRef} className="profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void changeAvatar(event)} />
      </main>

      {logoutConfirmOpen ? (
        <div className="profile-logout-backdrop" role="presentation">
          <section className="profile-logout-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-logout-title">
            <span className="profile-logout-dialog-icon"><ProfileIcon name="logout" size={25} /></span>
            <div>
              <h2 id="profile-logout-title">Sair da conta?</h2>
              <p>Você precisará entrar novamente com seu e-mail e senha para acessar o aplicativo.</p>
            </div>
            <div className="profile-logout-dialog-actions">
              <button type="button" autoFocus onClick={() => setLogoutConfirmOpen(false)} disabled={loggingOut}>Cancelar</button>
              <button type="button" className="is-danger" onClick={() => void logout()} disabled={loggingOut}>
                {loggingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <ProfilePhotoViewer
        open={photoViewerOpen}
        imageUrl={details.avatarUrl}
        name={profileDisplayName}
        onClose={() => setPhotoViewerOpen(false)}
      />
      {message ? <div className="accqua-profile-toast" role="status">{message}</div> : null}
    </div>
  );
}

function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <motion.button className="profile-menu-item" type="button" onClick={onClick} whileHover={{ backgroundColor: "rgba(255,255,255,.035)" }} whileTap={{ scale: 0.98 }}>
      <span className="profile-menu-icon"><ProfileIcon name={icon} size={22} /></span>
      <div><strong>{title}</strong><p>{subtitle}</p></div>
      <ProfileIcon name="chevron" size={19} />
    </motion.button>
  );
}

function ProfileToggle({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="profile-toggle-row">
      <div><strong>{title}</strong><p>{subtitle}</p></div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="profile-toggle-control"><i /></span>
    </label>
  );
}
