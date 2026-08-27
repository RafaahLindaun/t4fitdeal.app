import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { toast as notify } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import ProfilePhotoViewer from "../components/ProfilePhotoViewer";
import ResponsiveDialog from "../components/ResponsiveDialog";
import StorageImageUploadGrid, { type StorageImageValue } from "../components/StorageImageUploadGrid";
import SwipeableListItem from "../components/SwipeableListItem";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import EmptyState from "../components/EmptyState";
import StudentMembershipEditor from "../components/StudentMembershipEditor";
import {
  AdminBackIcon,
  AdminBoltIcon,
  AdminCheckIcon,
  AdminChevronIcon,
  AdminCloseIcon,
  AdminDumbbellIcon,
  AdminEditIcon,
  AdminLinkIcon,
  AdminLockIcon,
  AdminPeopleIcon,
  AdminSearchIcon,
  AdminShieldIcon,
  AdminSparkIcon,
  AdminUserIcon,
  AdminWarningIcon,
} from "../components/AdminIcons";
import {
  calculateStudentAge,
  createExerciseLibraryItem,
  deleteExerciseLibraryItem,
  formatStudentDocument,
  getWorkoutStudentById,
  deleteWorkoutStudentAccount,
  loadAdminProgramTemplates,
  loadExerciseLibrary,
  loadStudentActivityHistory,
  markStudentWorkoutAlertsRead,
  publishAdminProgram,
  removeStudentProfessorLink,
  searchWorkoutStudents,
  setStudentProfessorLink,
  setWorkoutStudentAccess,
  updateWorkoutStudentProfile,
  type AdminProgramTemplate,
  type ExerciseLibraryItem,
  type StudentActivitySummary,
  type StudentProfileUpdate,
  type WorkoutStudent,
} from "../lib/admin";
import {
  requestStaffNotificationPermission,
  WORKOUT_ALERTS_REFRESH_EVENT,
} from "../lib/staffNotifications";
import "./admin-entry.css";
import "./admin-area.css";
import "./professor-v10.css";
import "./admin-dashboard-v11.css";

type AdminDashboardView = "students" | "library" | "templates";
type AdminPrimarySection = "students" | "alerts" | "approvals" | "classes" | "library" | "templates" | "store";

type StudentFilter =
  | "attention"
  | "all"
  | "pending"
  | "mine"
  | "unlinked"
  | "no-workout"
  | "active"
  | "blocked";
function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase();
  if (status === "active" || status === "ativo" || status === "approved") return "active";
  if (status === "blocked" || status === "bloqueado") return "blocked";
  if (status === "inactive" || status === "inativo") return "inactive";
  return "pending";
}

function studentInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AL"
  );
}

function statusLabel(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "active") return "Autorizado";
  if (normalized === "blocked") return "Bloqueado";
  if (normalized === "inactive") return "Inativo";
  return "Aguardando autorização";
}

function formatStudentActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStudentActivityDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return `${minutes} min`;
}

function studentToForm(student: WorkoutStudent): StudentProfileUpdate {
  return {
    fullName: student.fullName,
    cpf: student.cpf,
    rg: student.rg,
    registrationCode: student.registrationCode,
    gympassNumber: student.gympassNumber,
    email: student.email,
    phone: student.phone,
    emergencyPhone: student.emergencyPhone,
    birthDate: student.birthDate.slice(0, 10),
    objective: student.objective,
  };
}

export default function AdminArea() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStudentId = searchParams.get("student") ?? "";
  const requestedSection = searchParams.get("section") ?? "";
  const { user, profile, loading, landingPath } = useAuth();

  const [query, setQuery] = useState("");
  const [resourceQuery, setResourceQuery] = useState("");
  const [dashboardView, setDashboardView] = useState<AdminDashboardView>("students");
  const [filter, setFilter] = useState<StudentFilter>("attention");
  const [students, setStudents] = useState<WorkoutStudent[]>([]);
  const [libraryItems, setLibraryItems] = useState<ExerciseLibraryItem[]>([]);
  const [resourceTemplates, setResourceTemplates] = useState<AdminProgramTemplate[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<WorkoutStudent | null>(null);
  const [studentActivities, setStudentActivities] = useState<StudentActivitySummary[]>([]);
  const [studentActivitiesLoading, setStudentActivitiesLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<StudentProfileUpdate | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTemplates, setQuickTemplates] = useState<AdminProgramTemplate[]>([]);
  const [quickTemplatesLoading, setQuickTemplatesLoading] = useState(false);
  const [selectedQuickTemplateId, setSelectedQuickTemplateId] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessSaving, setAccessSaving] = useState<
    "active" | "blocked" | null
  >(null);
  const [toast, setToast] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [photoViewer, setPhotoViewer] = useState<{ url: string; name: string } | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [exerciseSaving, setExerciseSaving] = useState(false);
  const [exerciseDelete, setExerciseDelete] = useState<ExerciseLibraryItem | null>(null);
  const [exerciseMedia, setExerciseMedia] = useState<StorageImageValue[]>([]);
  const [exerciseDraft, setExerciseDraft] = useState({ name: "", muscleGroup: "", equipment: "", defaultSets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, beginnerTip: "" });

  const canManageStudents =
    profile?.role === "professor" ||
    profile?.role === "reception" ||
    profile?.role === "admin";
  const canApproveAccess =
    profile?.role === "professor" ||
    profile?.role === "reception" ||
    profile?.role === "admin";
  const staffLabel =
    profile?.role === "admin"
      ? "ADMINISTRAÇÃO"
      : profile?.role === "reception"
        ? "RECEPÇÃO"
        : "PROFESSOR";

  useEffect(() => {
    if (!user || !canManageStudents) return;

    const timer = window.setTimeout(async () => {
      setStudentsLoading(true);
      setStudentError("");

      try {
        setStudents(await searchWorkoutStudents(query));
      } catch (error) {
        setStudentError(
          error instanceof Error
            ? error.message
            : "Não foi possível consultar os alunos.",
        );
      } finally {
        setStudentsLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [canManageStudents, query, reloadKey, user?.id]);

  useEffect(() => {
    if (requestedSection === "library") { setDashboardView("library"); return; }
    if (requestedSection === "templates") { setDashboardView("templates"); return; }
    setDashboardView("students");
    if (requestedSection === "alerts") setFilter("attention");
    else if (requestedSection === "approvals") setFilter("pending");
    else setFilter("all");
  }, [requestedSection]);

  useEffect(() => {
    if (!user || !canManageStudents || dashboardView === "students") return;

    let cancelled = false;
    setResourceLoading(true);
    setResourceError("");

    const loadResource =
      dashboardView === "library"
        ? loadExerciseLibrary().then((items) => {
            if (!cancelled) setLibraryItems(items);
          })
        : loadAdminProgramTemplates(user.id).then((templates) => {
            if (!cancelled) setResourceTemplates(templates);
          });

    void loadResource
      .catch((error) => {
        if (!cancelled) {
          setResourceError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar esta seção.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setResourceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canManageStudents, dashboardView, user?.id]);

  useEffect(() => {
    if (!canManageStudents) return;

    const refresh = () => setReloadKey((current) => current + 1);
    const interval = window.setInterval(refresh, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [canManageStudents]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!toast) return;
    notify(toast, { id: "accqua-professor-feedback" });
  }, [toast]);

  useEffect(() => {
    if (!requestedStudentId || selectedStudent?.id === requestedStudentId) {
      return;
    }

    const listedStudent = students.find(
      (student) => student.id === requestedStudentId,
    );

    if (listedStudent) {
      setSelectedStudent(listedStudent);
      if (normalizeStatus(listedStudent.status) === "active" && !listedStudent.hasActiveWorkout) {
        void markStudentWorkoutAlertsRead(listedStudent.id);
      }
      return;
    }

    let cancelled = false;
    void getWorkoutStudentById(requestedStudentId).then((student) => {
      if (!cancelled && student) {
        setSelectedStudent(student);
        if (normalizeStatus(student.status) === "active" && !student.hasActiveWorkout) {
          void markStudentWorkoutAlertsRead(student.id);
        }
        setStudents((current) =>
          current.some((item) => item.id === student.id)
            ? current.map((item) =>
                item.id === student.id ? student : item,
              )
            : [student, ...current],
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [requestedStudentId, selectedStudent?.id, students]);

  useEffect(() => {
    if (!selectedStudent?.id || !canManageStudents) {
      setStudentActivities([]);
      return;
    }

    let cancelled = false;
    setStudentActivitiesLoading(true);
    void loadStudentActivityHistory(selectedStudent.id)
      .then((activities) => {
        if (!cancelled) setStudentActivities(activities);
      })
      .catch(() => {
        if (!cancelled) setStudentActivities([]);
      })
      .finally(() => {
        if (!cancelled) setStudentActivitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canManageStudents, reloadKey, selectedStudent?.id]);

  const studentNeedsAttention = (student: WorkoutStudent) => {
    const status = normalizeStatus(student.status);

    return (
      status === "pending" ||
      status === "inactive" ||
      (status === "active" &&
        (!student.linkedProfessorId || !student.hasActiveWorkout))
    );
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const status = normalizeStatus(student.status);

      if (filter === "all") return true;
      if (filter === "attention") return studentNeedsAttention(student);
      if (filter === "pending") {
        return status === "pending" || status === "inactive";
      }
      if (filter === "mine") {
        return Boolean(user?.id) && student.linkedProfessorId === user?.id;
      }
      if (filter === "unlinked") {
        return status === "active" && !student.linkedProfessorId;
      }
      if (filter === "no-workout") {
        return status === "active" && !student.hasActiveWorkout;
      }

      return status === filter;
    });
  }, [filter, students, user?.id]);

  const dashboardCounts = useMemo(() => {
    const pending = students.filter((student) => {
      const status = normalizeStatus(student.status);
      return status === "pending" || status === "inactive";
    }).length;

    const unlinked = students.filter(
      (student) =>
        normalizeStatus(student.status) === "active" &&
        !student.linkedProfessorId,
    ).length;

    const noWorkout = students.filter(
      (student) =>
        normalizeStatus(student.status) === "active" &&
        !student.hasActiveWorkout,
    ).length;

    const mine = students.filter(
      (student) =>
        Boolean(user?.id) &&
        student.linkedProfessorId === user?.id,
    ).length;

    return {
      attention: students.filter(studentNeedsAttention).length,
      pending,
      unlinked,
      noWorkout,
      mine,
    };
  }, [students, user?.id]);

  const pendingCount = dashboardCounts.pending;

  const filteredLibraryItems = useMemo(() => {
    const normalized = resourceQuery.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return libraryItems;
    return libraryItems.filter((item) =>
      [item.name, item.muscleGroup, item.equipment, item.category]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [libraryItems, resourceQuery]);

  const filteredResourceTemplates = useMemo(() => {
    const normalized = resourceQuery.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return resourceTemplates;
    return resourceTemplates.filter((template) =>
      [template.name, template.splitCode]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [resourceQuery, resourceTemplates]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }
  if (!canManageStudents) return <Navigate to="/menu-teste" replace />;

  const openStudent = (student: WorkoutStudent) => {
    setSelectedStudent(student);
    setSearchParams({ student: student.id }, { replace: true });
    if (normalizeStatus(student.status) === "active" && !student.hasActiveWorkout) {
      void markStudentWorkoutAlertsRead(student.id);
    }
  };

  const closeStudent = () => {
    setSelectedStudent(null);
    setStudentActivities([]);
    setSearchParams({}, { replace: true });
  };

  const refreshStudent = (updated: WorkoutStudent) => {
    setSelectedStudent(updated);
    setSearchParams({ student: updated.id }, { replace: true });
    setStudents((current) =>
      current.some((student) => student.id === updated.id)
        ? current.map((student) =>
            student.id === updated.id ? updated : student,
          )
        : [updated, ...current],
    );
  };

  const linkSelectedStudent = async () => {
    if (!selectedStudent || !user?.id || linkSaving) return;
    setLinkSaving(true);

    try {
      const linkedStudent = await setStudentProfessorLink(
        selectedStudent.id,
        user.id,
      );
      refreshStudent(linkedStudent);
      setReloadKey((current) => current + 1);
      setToast("Aluno vinculado à sua conta.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o vínculo.",
      );
    } finally {
      setLinkSaving(false);
    }
  };

  const unlinkSelectedStudent = async () => {
    if (!selectedStudent || linkSaving) return;

    if (
      !window.confirm(
        "Remover o professor principal deste aluno?",
      )
    ) {
      return;
    }

    setLinkSaving(true);

    try {
      const unlinkedStudent = await removeStudentProfessorLink(
        selectedStudent.id,
      );
      refreshStudent(unlinkedStudent);
      setReloadKey((current) => current + 1);
      setToast("Vínculo removido.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o vínculo.",
      );
    } finally {
      setLinkSaving(false);
    }
  };

  const prepareSelectedStudentForTraining = async () => {
    if (!selectedStudent || !user?.id) return false;

    if (selectedStudent.linkedProfessorId === user.id) return true;

    setLinkSaving(true);

    try {
      const linkedStudent = await setStudentProfessorLink(
        selectedStudent.id,
        user.id,
      );
      refreshStudent(linkedStudent);
      setReloadKey((current) => current + 1);
      return true;
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível vincular o aluno à conta logada.",
      );
      return false;
    } finally {
      setLinkSaving(false);
    }
  };

  const openQuickTraining = async () => {
    if (!(await prepareSelectedStudentForTraining()) || !user?.id) return;

    setQuickOpen(true);
    setQuickTemplatesLoading(true);
    setSelectedQuickTemplateId("");

    try {
      const savedTemplates = await loadAdminProgramTemplates(user.id);
      setQuickTemplates(savedTemplates);
      setSelectedQuickTemplateId(savedTemplates[0]?.id ?? "");
    } catch (error) {
      setQuickTemplates([]);
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os treinos rápidos.",
      );
    } finally {
      setQuickTemplatesLoading(false);
    }
  };

  const openCompleteTraining = async () => {
    if (!selectedStudent) return;
    if (!(await prepareSelectedStudentForTraining())) return;

    navigate(
      `/area-accqua/montar?student=${selectedStudent.id}&returnStudent=${selectedStudent.id}`,
    );
  };

  const authorizeStudent = async () => {
    if (!selectedStudent || accessSaving) return;
    if (!canApproveAccess) {
      setToast("Somente professor, administração ou recepção pode liberar a entrada no aplicativo.");
      return;
    }
    const notificationPermission = requestStaffNotificationPermission();
    setAccessSaving("active");

    try {
      const accessResult = await setWorkoutStudentAccess(
        selectedStudent.id,
        "active",
      );

      let authorizedStudent: WorkoutStudent = {
        ...selectedStudent,
        status: accessResult.status,
      };
      let linkNotice = "";

      refreshStudent(authorizedStudent);

      if (user?.id && authorizedStudent.linkedProfessorId !== user.id) {
        try {
          authorizedStudent = await setStudentProfessorLink(
            authorizedStudent.id,
            user.id,
          );
          refreshStudent(authorizedStudent);
          linkNotice = " O aluno também foi vinculado à sua conta.";
        } catch {
          linkNotice =
            " O acesso foi liberado; toque em Vincular a mim antes de montar o treino.";
        }
      }

      setFilter("all");
      setReloadKey((current) => current + 1);

      setToast(
        accessResult.alreadyAuthorized
          ? `Aluno previamente autorizado.${linkNotice}`
          : `Aluno autorizado e acesso liberado.${linkNotice}`,
      );

      void notificationPermission.finally(() => {
        window.dispatchEvent(new Event(WORKOUT_ALERTS_REFRESH_EVENT));
      });

      void getWorkoutStudentById(selectedStudent.id).then(
        (refreshedStudent) => {
          if (refreshedStudent) {
            refreshStudent(refreshedStudent);
          }
        },
      );
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível autorizar o cadastro.",
      );
    } finally {
      setAccessSaving(null);
    }
  };

  const blockStudent = async () => {
    if (!selectedStudent || accessSaving) return;
    if (!canApproveAccess) {
      setToast("Somente professor, administração ou recepção pode bloquear o acesso.");
      return;
    }
    setAccessSaving("blocked");

    try {
      const accessResult = await setWorkoutStudentAccess(
        selectedStudent.id,
        "blocked",
      );

      refreshStudent({
        ...selectedStudent,
        status: accessResult.status,
      });
      setReloadKey((current) => current + 1);
      setToast("Acesso do aluno bloqueado.");

      void getWorkoutStudentById(selectedStudent.id).then(
        (refreshedStudent) => {
          if (refreshedStudent) {
            refreshStudent(refreshedStudent);
          }
        },
      );
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível bloquear o acesso.",
      );
    } finally {
      setAccessSaving(null);
    }
  };

  const deleteSelectedStudent = async () => {
    if (!selectedStudent || deleteSaving) return;

    if (deleteConfirmation.trim().toUpperCase() !== "APAGAR") {
      setToast('Digite "APAGAR" para confirmar.');
      return;
    }

    setDeleteSaving(true);

    try {
      await deleteWorkoutStudentAccount(
        selectedStudent.id,
        deleteConfirmation.trim().toUpperCase(),
      );
      const deletedId = selectedStudent.id;
      setStudents((current) =>
        current.filter((student) => student.id !== deletedId),
      );
      setDeleteOpen(false);
      setDeleteConfirmation("");
      setSelectedStudent(null);
      setSearchParams({}, { replace: true });
      setToast("Conta apagada definitivamente.");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível apagar a conta.",
      );
    } finally {
      setDeleteSaving(false);
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStudent || !editForm || saving) return;
    setSaving(true);

    try {
      const updated = await updateWorkoutStudentProfile(
        selectedStudent.id,
        editForm,
      );
      refreshStudent(updated);
      setEditing(false);
      setToast("Perfil do aluno atualizado.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
      );
    } finally {
      setSaving(false);
    }
  };

  const publishQuick = async () => {
    if (!selectedStudent || !user || saving) return;

    const template = quickTemplates.find(
      (item) => item.id === selectedQuickTemplateId,
    );

    if (!template) {
      setToast("Selecione um treino salvo para publicar.");
      return;
    }

    setSaving(true);

    try {
      await publishAdminProgram({
        studentId: selectedStudent.id,
        staffId: user.id,
        programName:
          template.payload.programName.trim() || template.name,
        splitCode: template.splitCode,
        notes: template.payload.notes,
        reviewAt: template.payload.reviewAt,
        routines: template.payload.routines,
        cardio: template.payload.cardio,
      });

      const refreshedStudent = await getWorkoutStudentById(
        selectedStudent.id,
      );

      if (refreshedStudent) refreshStudent(refreshedStudent);

      setQuickOpen(false);
      setReloadKey((current) => current + 1);
      setToast(`Modelo “${template.name}” publicado para o aluno.`);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar o treino salvo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetExerciseDraft = () => {
    setExerciseDraft({ name: "", muscleGroup: "", equipment: "", defaultSets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, beginnerTip: "" });
    setExerciseMedia([]);
  };

  const saveLibraryExercise = async (event: FormEvent) => {
    event.preventDefault();
    if (!exerciseDraft.name.trim()) { setToast("Informe o nome do exercício."); return; }
    setExerciseSaving(true);
    try {
      const created = await createExerciseLibraryItem({
        name: exerciseDraft.name,
        muscleGroup: exerciseDraft.muscleGroup,
        equipment: exerciseDraft.equipment,
        mediaUrl: exerciseMedia[0]?.url ?? "",
        beginnerTip: exerciseDraft.beginnerTip,
        defaultSets: exerciseDraft.defaultSets,
        defaultRepsMin: exerciseDraft.repsMin,
        defaultRepsMax: exerciseDraft.repsMax,
        defaultRestSeconds: exerciseDraft.restSeconds,
      });
      setLibraryItems((current) => [...current, created].sort((a,b) => `${a.muscleGroup}-${a.name}`.localeCompare(`${b.muscleGroup}-${b.name}`, "pt-BR")));
      setExerciseDialogOpen(false);
      resetExerciseDraft();
      setToast("Exercício adicionado à Biblioteca.");
    } catch (error) { setToast(error instanceof Error ? error.message : "Não foi possível criar o exercício."); }
    finally { setExerciseSaving(false); }
  };

  const confirmDeleteExercise = async () => {
    if (!exerciseDelete) return;
    setExerciseSaving(true);
    try {
      const result = await deleteExerciseLibraryItem(exerciseDelete.id);
      setLibraryItems((current) => current.filter((item) => item.id !== exerciseDelete.id));
      setToast(result.action === "deleted" ? "Exercício excluído." : `Exercício retirado da Biblioteca; ${result.dependencies} vínculo(s) histórico(s) foram preservados.`);
      setExerciseDelete(null);
    } catch (error) { setToast(error instanceof Error ? error.message : "Não foi possível excluir o exercício."); }
    finally { setExerciseSaving(false); }
  };

  const selectedStatus = selectedStudent
    ? normalizeStatus(selectedStudent.status)
    : "pending";
  const selectedAge = selectedStudent
    ? calculateStudentAge(selectedStudent.birthDate)
    : null;
  const selectedProfileComplete = Boolean(
    selectedStudent?.fullName &&
      selectedStudent?.email &&
      selectedStudent?.birthDate,
  );
  const selectedLinkedToCurrentProfessor = Boolean(
    selectedStudent?.linkedProfessorId &&
      selectedStudent.linkedProfessorId === user?.id,
  );
  const selectedHasProfessor = Boolean(
    selectedStudent?.linkedProfessorId,
  );
  const canBuildSelectedTraining = Boolean(
    selectedStudent && selectedStatus === "active",
  );

  const selectPrimarySection = (section: AdminPrimarySection) => {
    if (section === "store") {
      navigate("/area-accqua/loja");
      return;
    }
    if (section === "classes") {
      navigate("/area-accqua/aulas");
      return;
    }
    if (section === "library" || section === "templates") {
      setResourceLoading(true);
      setResourceError("");
      setDashboardView(section);
      return;
    }

    setDashboardView("students");
    if (section === "alerts") {
      setFilter("attention");
      return;
    }
    if (section === "approvals") {
      setFilter("pending");
      return;
    }
    setFilter("all");
  };

  const selectedFilterLabel =
    ({
      attention: "Precisam de atenção",
      mine: "Meus alunos",
      pending: "Pendentes",
      unlinked: "Sem professor",
      "no-workout": "Sem treino",
      active: "Autorizados",
      blocked: "Bloqueados",
      all: "Todos os alunos",
    } satisfies Record<StudentFilter, string>)[filter];

  return (
    <div className="admin-area-screen">
      <div className="admin-area-background" aria-hidden="true">
        <span />
        <i />
      </div>

      <main className={clsx("admin-area-shell", !selectedStudent && "is-dashboard")}>
        <div className="admin-area-content">
          <header className={clsx("admin-area-header", !selectedStudent && "is-dashboard-header")}>
            <button
              type="button"
              className="admin-area-top-button"
              onClick={() =>
                selectedStudent
                  ? closeStudent()
                  : navigate("/menu-teste")
              }
              aria-label="Voltar"
            >
              <AdminBackIcon />
            </button>

            <div className="admin-area-brand admin-v10-brand">
              <span className="admin-area-brand-copy">
                <small>{staffLabel}</small>
                <strong>{selectedStudent ? "Administração" : "Área Accqua Sports"}</strong>
              </span>
            </div>

            <button
              type="button"
              className={clsx("admin-area-pending", pendingCount > 0 && "has-pending")}
              onClick={() => {
                if (selectedStudent) {
                  setReloadKey((current) => current + 1);
                  return;
                }
                selectPrimarySection("approvals");
              }}
              aria-label={
                selectedStudent
                  ? "Atualizar lista de cadastros"
                  : `${pendingCount} cadastros pendentes. Mostrar aprovações.`
              }
              title={selectedStudent ? "Atualizar cadastros" : "Ver aprovações pendentes"}
            >
              {pendingCount}
              <small>pendentes</small>
            </button>
          </header>

        {!selectedStudent ? (
          <>
            <section className="admin-area-intro">
              <span>
                <AdminPeopleIcon size={29} />
              </span>
              <div>
                <small>{staffLabel} · ADMINISTRAÇÃO DE ALUNOS</small>
                <h1>Área Accqua Sports</h1>
                <p>Alunos e montagem de treinos</p>
              </div>
            </section>


            <section className="admin-work-queue admin-dashboard-statbar" aria-label="Resumo operacional">
              <div className="admin-work-queue-grid">
                <button
                  type="button"
                  className={clsx(
                    "accqua-pressable admin-dashboard-stat",
                    dashboardCounts.pending > 0 ? "has-value is-urgent" : "is-zero",
                    dashboardView === "students" && filter === "pending" && "is-active",
                  )}
                  aria-pressed={dashboardView === "students" && filter === "pending"}
                  onClick={() => {
                    setDashboardView("students");
                    setFilter("pending");
                  }}
                >
                  <span className="admin-dashboard-stat-icon"><AdminShieldIcon size={21} /></span>
                  <span className="admin-dashboard-stat-copy">
                    <strong>{dashboardCounts.pending}</strong>
                    <small>Aguardando autorização</small>
                  </span>
                  {dashboardCounts.pending > 0 ? <b>Requer ação</b> : <b>Nenhuma aprovação</b>}
                </button>

                <button
                  type="button"
                  className={clsx(
                    "accqua-pressable admin-dashboard-stat",
                    dashboardCounts.unlinked > 0 ? "has-value" : "is-zero",
                    dashboardView === "students" && filter === "unlinked" && "is-active",
                  )}
                  aria-pressed={dashboardView === "students" && filter === "unlinked"}
                  onClick={() => {
                    setDashboardView("students");
                    setFilter("unlinked");
                  }}
                >
                  <span className="admin-dashboard-stat-icon"><AdminLinkIcon size={21} /></span>
                  <span className="admin-dashboard-stat-copy">
                    <strong>{dashboardCounts.unlinked}</strong>
                    <small>Sem professor</small>
                  </span>
                  {dashboardCounts.unlinked > 0 ? <b>Revisar</b> : <b>Todos vinculados</b>}
                </button>

                <button
                  type="button"
                  className={clsx(
                    "accqua-pressable admin-dashboard-stat",
                    dashboardCounts.noWorkout > 0 ? "has-value" : "is-zero",
                    dashboardView === "students" && filter === "no-workout" && "is-active",
                  )}
                  aria-pressed={dashboardView === "students" && filter === "no-workout"}
                  onClick={() => {
                    setDashboardView("students");
                    setFilter("no-workout");
                  }}
                >
                  <span className="admin-dashboard-stat-icon"><AdminDumbbellIcon size={21} /></span>
                  <span className="admin-dashboard-stat-copy">
                    <strong>{dashboardCounts.noWorkout}</strong>
                    <small>Sem treino publicado</small>
                  </span>
                  {dashboardCounts.noWorkout > 0 ? <b>Revisar</b> : <b>Todos com treino</b>}
                </button>

                <button
                  type="button"
                  className={clsx(
                    "accqua-pressable admin-dashboard-stat is-neutral",
                    dashboardView === "students" && filter === "mine" && "is-active",
                  )}
                  aria-pressed={dashboardView === "students" && filter === "mine"}
                  onClick={() => {
                    setDashboardView("students");
                    setFilter("mine");
                  }}
                >
                  <span className="admin-dashboard-stat-icon"><AdminUserIcon size={21} /></span>
                  <span className="admin-dashboard-stat-copy">
                    <strong>{dashboardCounts.mine}</strong>
                    <small>Meus alunos</small>
                  </span>
                  <b>Carteira</b>
                </button>
              </div>
            </section>

            <section className="admin-area-search-wrap admin-dashboard-search-wrap">
              <label className="admin-area-search">
                <AdminSearchIcon />
                <input
                  value={dashboardView === "students" ? query : resourceQuery}
                  onChange={(event) => {
                    if (dashboardView === "students") {
                      setQuery(event.target.value);
                    } else {
                      setResourceQuery(event.target.value);
                    }
                  }}
                  placeholder={
                    dashboardView === "students"
                      ? "Nome, CPF, RG, matrícula, telefone ou e-mail"
                      : dashboardView === "library"
                        ? "Buscar exercício, grupo muscular ou equipamento"
                        : "Buscar modelo por nome ou divisão"
                  }
                  inputMode="search"
                  autoComplete="off"
                />
                {(dashboardView === "students" ? query : resourceQuery) ? (
                  <button
                    type="button"
                    onClick={() =>
                      dashboardView === "students" ? setQuery("") : setResourceQuery("")
                    }
                    aria-label="Limpar busca"
                  >
                    <AdminCloseIcon size={18} />
                  </button>
                ) : (
                  <span />
                )}
              </label>

              {dashboardView === "students" ? (
                <div className="admin-area-filters">
                  {[
                    ["attention", "Atenção"],
                    ...(profile?.role === "professor"
                      ? [["mine", "Meus alunos"]]
                      : []),
                    ["pending", "Pendentes"],
                    ["unlinked", "Sem professor"],
                    ["no-workout", "Sem treino"],
                    ["active", "Autorizados"],
                    ["blocked", "Bloqueados"],
                    ["all", "Todos"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      className={clsx("accqua-pressable", filter === value && "is-active")}
                      aria-pressed={filter === value}
                      onClick={(event) => {
                        setDashboardView("students");
                        setFilter(value as StudentFilter);
                        event.currentTarget.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                          inline: "center",
                        });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            {dashboardView === "students" ? (
              <>
                <section className="admin-dashboard-roster-heading">
                  <div>
                    <small>ALUNOS</small>
                    <h2>{selectedFilterLabel}</h2>
                  </div>
                  <span>{filteredStudents.length} exibido{filteredStudents.length === 1 ? "" : "s"}</span>
                </section>

                <section className="admin-area-list admin-dashboard-roster" aria-live="polite">
                  {studentsLoading ? (
                    <div className="admin-area-state">
                      <span className="admin-area-spinner" />
                      <p>Buscando alunos...</p>
                    </div>
                  ) : null}

                  {!studentsLoading && studentError ? (
                    <div className="admin-area-state is-error">
                      <AdminLockIcon size={28} />
                      <strong>Não foi possível carregar</strong>
                      <p>{studentError}</p>
                    </div>
                  ) : null}

                  {!studentsLoading && !studentError && !filteredStudents.length ? (
                    <div className="admin-area-state">
                      <AdminSearchIcon size={29} />
                      <strong>Nenhum aluno encontrado</strong>
                      <p>Altere a busca ou selecione outro filtro.</p>
                    </div>
                  ) : null}

                  {!studentsLoading &&
                    !studentError &&
                    filteredStudents.map((student) => {
                      const age = calculateStudentAge(student.birthDate);
                      const status = normalizeStatus(student.status);

                      return (
                        <button
                          type="button"
                          className={clsx(
                            "admin-student-card accqua-pressable",
                            status === "active" && !student.hasActiveWorkout && "is-workout-required",
                          )}
                          key={student.id}
                          onClick={() => openStudent(student)}
                        >
                          <span
                            className={`admin-student-avatar ${student.avatarUrl ? "has-photo" : ""}`}
                            onClick={(event) => {
                              if (!student.avatarUrl) return;
                              event.stopPropagation();
                              setPhotoViewer({ url: student.avatarUrl, name: student.fullName });
                            }}
                            aria-label={student.avatarUrl ? `Ampliar foto de ${student.fullName}` : undefined}
                          >
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt={`Foto de ${student.fullName}`} />
                            ) : (
                              studentInitials(student.fullName)
                            )}
                          </span>

                          <span className="admin-student-copy">
                            <span className="admin-student-card-title">
                              <strong>{student.fullName}</strong>
                              <em className={`is-${status}`}>
                                {status === "pending" || status === "inactive" ? (
                                  <span className="admin-status-exclamation" aria-hidden="true">!</span>
                                ) : null}
                                {statusLabel(student.status)}
                              </em>
                            </span>
                            <small className="admin-student-meta">
                              {age !== null ? `${age} anos` : "Idade não informada"}
                              {" · "}
                              {student.registrationCode
                                ? `Matrícula ${student.registrationCode}`
                                : `CPF ${formatStudentDocument(student.cpf)}`}
                            </small>
                            <b className="admin-student-objective">
                              {student.objective || "Objetivo não informado"}
                            </b>

                            <span className="admin-student-flags">
                              <i className={student.linkedProfessorId ? "is-linked" : "is-unlinked"}>
                                <AdminLinkIcon size={14} />
                                {student.linkedProfessorName || "Sem professor"}
                              </i>
                              <i className={student.hasActiveWorkout ? "is-workout" : "is-no-workout"}>
                                <AdminDumbbellIcon size={14} />
                                {student.hasActiveWorkout
                                  ? student.programCode || "Treino publicado"
                                  : "Sem treino"}
                              </i>
                            </span>
                          </span>

                          <AdminChevronIcon />
                        </button>
                      );
                    })}
                </section>
              </>
            ) : (
              <section className="admin-dashboard-resource" aria-live="polite">
                <header>
                  <div>
                    <small>{dashboardView === "library" ? "BIBLIOTECA DA EQUIPE" : "MODELOS SALVOS"}</small>
                    <h2>{dashboardView === "library" ? "Exercícios disponíveis" : "Modelos de treino"}</h2>
                  </div>
                  <div className="admin-dashboard-resource-head-actions">
                    <span>{dashboardView === "library" ? filteredLibraryItems.length : filteredResourceTemplates.length}</span>
                    {dashboardView === "library" ? <button type="button" className="admin-library-add" onClick={() => { resetExerciseDraft(); setExerciseDialogOpen(true); }} aria-label="Adicionar exercício">+</button> : null}
                  </div>
                </header>

                {resourceLoading ? (
                  <div className="admin-area-state">
                    <span className="admin-area-spinner" />
                    <p>Carregando seção...</p>
                  </div>
                ) : null}

                {!resourceLoading && resourceError ? (
                  <div className="admin-area-state is-error">
                    <AdminWarningIcon size={28} />
                    <strong>Não foi possível carregar</strong>
                    <p>{resourceError}</p>
                  </div>
                ) : null}

                {!resourceLoading && !resourceError && dashboardView === "library" ? (
                  filteredLibraryItems.length ? (
                    <div className="admin-dashboard-resource-grid">
                      {filteredLibraryItems.map((item) => (
                        <SwipeableListItem key={item.id} onDelete={() => setExerciseDelete(item)} deleteLabel="Excluir exercício">
                          <article className="admin-dashboard-resource-card">
                            <span className="admin-library-media">{item.mediaUrl ? <img src={item.mediaUrl} alt="" loading="lazy" /> : <AdminDumbbellIcon size={22} />}</span>
                            <div>
                              <strong>{item.name}</strong>
                              <small>{item.muscleGroup} · {item.equipment || "Sem equipamento"}</small>
                            </div>
                            <b>{item.defaultSets} × {item.defaultRepsMin === item.defaultRepsMax ? item.defaultRepsMin : `${item.defaultRepsMin}–${item.defaultRepsMax}`}</b>
                          </article>
                        </SwipeableListItem>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<AdminSearchIcon size={27} />} title="Nenhum exercício encontrado" description="Altere a busca ou use + para cadastrar um novo exercício." />
                  )
                ) : null}

                {!resourceLoading && !resourceError && dashboardView === "templates" ? (
                  filteredResourceTemplates.length ? (
                    <div className="admin-dashboard-resource-grid">
                      {filteredResourceTemplates.map((template) => {
                        const exerciseCount = template.payload.routines.reduce(
                          (total, routine) => total + routine.exercises.length,
                          0,
                        );
                        return (
                          <article className="admin-dashboard-resource-card" key={template.id}>
                            <span><AdminSparkIcon size={22} /></span>
                            <div>
                              <strong>{template.name}</strong>
                              <small>{template.payload.routines.length} rotina{template.payload.routines.length === 1 ? "" : "s"} · {exerciseCount} exercício{exerciseCount === 1 ? "" : "s"}</small>
                            </div>
                            <b>{template.splitCode}</b>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="admin-area-state">
                      <AdminSparkIcon size={29} />
                      <strong>Nenhum modelo encontrado</strong>
                      <p>Os modelos salvos no montador aparecerão aqui.</p>
                    </div>
                  )
                ) : null}
              </section>
            )}
          </>
        ) : (
          <section className="admin-profile-view">
            <article className="admin-profile-hero">
              <span
                className={`admin-profile-avatar ${selectedStudent.avatarUrl ? "has-photo" : ""}`}
                onClick={() => selectedStudent.avatarUrl && setPhotoViewer({ url: selectedStudent.avatarUrl, name: selectedStudent.fullName })}
                aria-label={selectedStudent.avatarUrl ? `Ampliar foto de ${selectedStudent.fullName}` : undefined}
              >
                {selectedStudent.avatarUrl ? (
                  <img src={selectedStudent.avatarUrl} alt={`Foto de ${selectedStudent.fullName}`} />
                ) : (
                  studentInitials(selectedStudent.fullName)
                )}
              </span>

              <div>
                <small>PERFIL DO ALUNO</small>
                <h1>{selectedStudent.fullName}</h1>
                <p>
                  {selectedAge !== null
                    ? `${selectedAge} anos`
                    : "Idade não informada"}
                  {" · "}
                  {selectedStudent.registrationCode
                    ? `Matrícula ${selectedStudent.registrationCode}`
                    : `CPF ${formatStudentDocument(selectedStudent.cpf)}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditForm(studentToForm(selectedStudent));
                  setEditing(true);
                }}
                aria-label="Editar perfil"
              >
                <AdminEditIcon />
              </button>
            </article>

            <article className="admin-student-journey">
              <header>
                <div>
                  <small>JORNADA DO ALUNO</small>
                  <h2>Próximos passos</h2>
                </div>
                <span>
                  {[
                    selectedProfileComplete,
                    selectedStatus === "active",
                    selectedHasProfessor,
                    Boolean(selectedStudent.hasActiveWorkout),
                  ].filter(Boolean).length}
                  /4
                </span>
              </header>

              <div>
                {[
                  {
                    label: "Cadastro",
                    detail: selectedProfileComplete
                      ? "Dados principais preenchidos"
                      : "Complete os dados do perfil",
                    done: selectedProfileComplete,
                    icon: <AdminUserIcon size={18} />,
                  },
                  {
                    label: "Acesso",
                    detail:
                      selectedStatus === "active"
                        ? "Entrada liberada no aplicativo"
                        : "Autorize o cadastro",
                    done: selectedStatus === "active",
                    icon: <AdminShieldIcon size={18} />,
                  },
                  {
                    label: "Professor",
                    detail: selectedHasProfessor
                      ? selectedStudent.linkedProfessorName
                      : "Defina o professor principal",
                    done: selectedHasProfessor,
                    icon: <AdminLinkIcon size={18} />,
                  },
                  {
                    label: "Treino",
                    detail: selectedStudent.hasActiveWorkout
                      ? selectedStudent.programCode ||
                        "Programa publicado"
                      : "Monte e publique o programa",
                    done: selectedStudent.hasActiveWorkout,
                    icon: <AdminDumbbellIcon size={18} />,
                  },
                ].map((step) => (
                  <span
                    key={step.label}
                    className={step.done ? "is-done" : "is-pending"}
                  >
                    <i>{step.icon}</i>
                    <b>{step.label}</b>
                    <small>{step.detail}</small>
                    {step.done ? (
                      <AdminCheckIcon size={16} />
                    ) : (
                      <AdminChevronIcon size={16} />
                    )}
                  </span>
                ))}
              </div>
            </article>

            <article className="admin-student-history-card">
              <header>
                <div>
                  <small>REGISTROS DO ALUNO</small>
                  <h2>Atividades recentes</h2>
                </div>
                <span>{studentActivities.length}</span>
              </header>

              {studentActivitiesLoading ? (
                <p className="admin-student-history-state">Carregando registros...</p>
              ) : studentActivities.length ? (
                <div className="admin-student-history-list">
                  {studentActivities.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="admin-student-history-item">
                      <i className={`is-${activity.kind}`}>
                        {activity.kind === "cardio" ? (
                          <AdminBoltIcon size={17} />
                        ) : (
                          <AdminDumbbellIcon size={17} />
                        )}
                      </i>
                      <span>
                        <strong>{activity.title || (activity.kind === "cardio" ? "Cardio" : "Treino")}</strong>
                        <small>
                          {formatStudentActivityDate(activity.performedAt)} · {formatStudentActivityDuration(activity.durationSeconds)}
                          {activity.kind === "workout" && activity.completionPercentage > 0
                            ? ` · ${Math.round(activity.completionPercentage)}%`
                            : ""}
                        </small>
                      </span>
                      {activity.validForRanking ? (
                        <b title="Contou para o ranking"><AdminCheckIcon size={14} /></b>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-student-history-state">
                  Nenhum treino ou cardio concluído foi registrado ainda.
                </p>
              )}
            </article>

            <article className="admin-access-card">
              <span
                className={`admin-access-icon is-${selectedStatus}`}
              >
                {selectedStatus === "active" ? (
                  <AdminShieldIcon size={27} />
                ) : selectedStatus === "pending" || selectedStatus === "inactive" ? (
                  <strong className="admin-access-exclamation" aria-hidden="true">
                    !
                  </strong>
                ) : (
                  <AdminLockIcon size={26} />
                )}
              </span>

              <div>
                <small>ACESSO AO APLICATIVO</small>
                <strong>{statusLabel(selectedStudent.status)}</strong>
                <p>
                  {selectedStatus === "active"
                    ? "O aluno consegue entrar normalmente no aplicativo."
                    : "O aluno permanece na tela de espera até a autorização."}
                </p>
              </div>

              {canApproveAccess ? (
                selectedStatus === "active" ? (
                  <button
                    type="button"
                    className="admin-access-action is-block"
                    onClick={() => void blockStudent()}
                    disabled={Boolean(accessSaving)}
                  >
                    <AdminLockIcon size={18} />
                    <span>
                      {accessSaving === "blocked"
                        ? "Bloqueando..."
                        : "Bloquear acesso"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-access-action is-authorize"
                    onClick={() => void authorizeStudent()}
                    disabled={Boolean(accessSaving)}
                  >
                    <AdminCheckIcon size={19} />
                    <span>
                      {accessSaving === "active"
                        ? "Autorizando..."
                        : "Autorizar cadastro"}
                    </span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className="admin-access-action"
                  disabled
                  title="A liberação de entrada é permitida para professor, administração e recepção."
                >
                  <AdminLockIcon size={18} />
                  <span>Liberação pela equipe ACCQUA</span>
                </button>
              )}
            </article>

            <StudentMembershipEditor
              studentId={selectedStudent.id}
              validUntil={selectedStudent.membershipValidUntil}
              paymentDay={selectedStudent.membershipPaymentDay}
              lastPayment={selectedStudent.membershipLastPayment}
              confirmedAt={selectedStudent.membershipConfirmedAt}
              notes={selectedStudent.membershipNotes}
              onSaved={async () => {
                const refreshedStudent = await getWorkoutStudentById(selectedStudent.id);
                if (refreshedStudent) refreshStudent(refreshedStudent);
                setReloadKey((current) => current + 1);
              }}
            />

            <article className="admin-coach-card">
              <span className="admin-coach-card-icon">
                <AdminLinkIcon size={26} />
              </span>

              <div className="admin-coach-card-copy">
                <small>RESPONSÁVEL PELO ALUNO</small>
                <strong>
                  {selectedLinkedToCurrentProfessor
                    ? "Vinculado à sua conta"
                    : selectedStudent.linkedProfessorName ||
                      "Nenhum responsável definido"}
                </strong>
                <p>
                  {selectedLinkedToCurrentProfessor
                    ? "Você pode montar, atualizar e publicar o treino deste aluno."
                    : selectedStudent.linkedProfessorId
                      ? "Outro membro da equipe está responsável. Toque abaixo para assumir o vínculo."
                      : "O vínculo é simples: o aluno fica ligado à conta que está logada."}
                </p>
              </div>

              <div className="admin-coach-card-controls is-professor">
                {selectedLinkedToCurrentProfessor ? (
                  <>
                    <span className="admin-coach-confirmed">
                      <AdminCheckIcon size={17} />
                      Vinculado a você
                    </span>
                    <button
                      type="button"
                      className="is-unlink"
                      onClick={() => void unlinkSelectedStudent()}
                      disabled={linkSaving}
                    >
                      Remover vínculo
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="is-link"
                    onClick={() => void linkSelectedStudent()}
                    disabled={!user?.id || linkSaving}
                  >
                    <AdminLinkIcon size={18} />
                    {linkSaving
                      ? "Vinculando..."
                      : selectedStudent.linkedProfessorId
                        ? "Vincular a mim"
                        : "Vincular a mim"}
                  </button>
                )}
              </div>
            </article>

            <article className="admin-profile-data">
              <header>
                <div>
                  <small>DADOS CADASTRAIS</small>
                  <h2>Informações do aluno</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditForm(studentToForm(selectedStudent));
                    setEditing(true);
                  }}
                >
                  Editar
                </button>
              </header>

              <div className="admin-profile-grid">
                <span>
                  <small>E-mail</small>
                  <strong>{selectedStudent.email || "Não informado"}</strong>
                </span>
                <span>
                  <small>Telefone</small>
                  <strong>{selectedStudent.phone || "Não informado"}</strong>
                </span>
                <span>
                  <small>CPF</small>
                  <strong>
                    {formatStudentDocument(selectedStudent.cpf) ||
                      "Não informado"}
                  </strong>
                </span>
                <span>
                  <small>RG</small>
                  <strong>{selectedStudent.rg || "Não informado"}</strong>
                </span>
                <span>
                  <small>Gympass</small>
                  <strong>{selectedStudent.gympassNumber || "Não informado"}</strong>
                </span>
                <span>
                  <small>Matrícula válida até</small>
                  <strong>{selectedStudent.membershipValidUntil ? new Date(`${selectedStudent.membershipValidUntil}T12:00:00`).toLocaleDateString("pt-BR") : "Não informada"}</strong>
                </span>
                <span>
                  <small>Nascimento</small>
                  <strong>
                    {selectedStudent.birthDate
                      ? new Date(
                          `${selectedStudent.birthDate.slice(0, 10)}T12:00:00`,
                        ).toLocaleDateString("pt-BR")
                      : "Não informado"}
                  </strong>
                </span>
                <span>
                  <small>Objetivo</small>
                  <strong>
                    {selectedStudent.objective || "Não informado"}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                className="admin-profile-delete-account"
                onClick={() => {
                  setDeleteConfirmation("");
                  setDeleteOpen(true);
                }}
              >
                <AdminCloseIcon size={17} />
                Apagar conta definitivamente
              </button>
            </article>

            {canBuildSelectedTraining ? (
              <article className="admin-training-card">
                <header>
                  <div>
                    <small>TREINO DO ALUNO</small>
                    <h2>Monte o treino do aluno</h2>
                    <p>
                      Comece pela divisão, escolha exercícios com GIF e salve as orientações específicas.
                    </p>
                  </div>
                  <AdminDumbbellIcon size={29} />
                </header>

                {selectedStudent.hasActiveWorkout ? (
                  <div className="admin-current-program">
                    <AdminCheckIcon size={19} />
                    <div>
                      <strong>
                        {selectedStudent.programCode ||
                          "Programa ativo"}
                      </strong>
                      <small>
                        Última atualização{" "}
                        {selectedStudent.workoutUpdatedAt
                          ? new Date(
                              selectedStudent.workoutUpdatedAt,
                            ).toLocaleDateString("pt-BR")
                          : "não informada"}
                      </small>
                    </div>
                    <span>
                      {selectedStudent.activeWorkoutCount} rotina
                      {selectedStudent.activeWorkoutCount === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                ) : null}

                <div className="admin-training-actions">
                  <button
                    type="button"
                    className="admin-training-action is-quick-action"
                    onClick={() => void openQuickTraining()}
                  >
                    <span className="is-quick">
                      <AdminBoltIcon />
                    </span>
                    <div>
                      <strong>Montar treino rápido</strong>
                      <small>
                        Use um treino nomeado que você já salvou para publicar em poucos passos.
                      </small>
                    </div>
                    <AdminChevronIcon />
                  </button>

                  <button
                    type="button"
                    className={[
                      "admin-training-action",
                      "is-complete-action",
                      !selectedStudent.hasActiveWorkout
                        ? "is-build-urgent"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => void openCompleteTraining()}
                  >
                    <span className="is-complete">
                      <AdminSparkIcon />
                    </span>
                    <div>
                      <strong>Montar treino agora</strong>
                      <small>
                        Divisão AB até ABCDEF, modelos prontos, GIFs, séries, repetições e observações.
                      </small>
                    </div>
                    <AdminChevronIcon />
                  </button>
                </div>
              </article>
            ) : selectedStatus !== "active" ? (
              <article className="admin-training-locked">
                <AdminLockIcon size={26} />
                <div>
                  <strong>Autorize o cadastro primeiro</strong>
                  <p>
                    Depois da liberação, vincule o aluno à conta logada e monte o treino.
                  </p>
                </div>
              </article>
            ) : !selectedHasProfessor ? (
              <article className="admin-training-locked is-link-required">
                <AdminLinkIcon size={26} />
                <div>
                  <strong>Vincule o aluno à sua conta</strong>
                  <p>
                    Toque em “Vincular a mim” para liberar a montagem do treino.
                  </p>
                </div>
              </article>
            ) : (
              <article className="admin-training-locked is-other-professor">
                <AdminWarningIcon size={26} />
                <div>
                  <strong>
                    Aluno vinculado a {selectedStudent.linkedProfessorName}
                  </strong>
                  <p>
                    Toque em “Vincular a mim” para assumir o aluno e montar o treino.
                  </p>
                </div>
              </article>
            )}
          </section>
        )}
        </div>
      </main>

      {deleteOpen && selectedStudent ? (
        <div
          className="admin-sheet-backdrop is-danger-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteSaving) {
              setDeleteOpen(false);
              setDeleteConfirmation("");
            }
          }}
        >
          <section className="admin-delete-account-sheet">
            <span className="admin-sheet-handle" />
            <header>
              <span>
                <AdminWarningIcon size={26} />
              </span>
              <div>
                <small>EXCLUSÃO DEFINITIVA</small>
                <h2>Apagar a conta de {selectedStudent.fullName}?</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmation("");
                }}
                disabled={deleteSaving}
              >
                <AdminCloseIcon />
              </button>
            </header>

            <p>
              Essa ação remove o login, o perfil e os dados ligados ao aluno.
              Não será possível recuperar a conta depois.
            </p>

            <label>
              <span>Digite APAGAR para confirmar</span>
              <input
                value={deleteConfirmation}
                onChange={(event) =>
                  setDeleteConfirmation(event.target.value.toUpperCase())
                }
                placeholder="APAGAR"
                autoComplete="off"
              />
            </label>

            <div>
              <button
                type="button"
                className="is-cancel"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmation("");
                }}
                disabled={deleteSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="is-delete"
                onClick={() => void deleteSelectedStudent()}
                disabled={
                  deleteSaving || deleteConfirmation.trim() !== "APAGAR"
                }
              >
                {deleteSaving ? "Apagando..." : "Apagar definitivamente"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editing && editForm && selectedStudent ? (
        <div
          className="admin-sheet-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setEditing(false);
            }
          }}
        >
          <form className="admin-edit-sheet" onSubmit={submitEdit}>
            <span className="admin-sheet-handle" />

            <header>
              <div>
                <small>EDITAR PERFIL</small>
                <h2>{selectedStudent.fullName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <AdminCloseIcon />
              </button>
            </header>

            <div className="admin-edit-fields">
              <label className="is-wide">
                <span>Nome completo</span>
                <input
                  value={editForm.fullName}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      fullName: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                <span>Data de nascimento</span>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      birthDate: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <span>Matrícula</span>
                <input
                  value={editForm.registrationCode}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      registrationCode: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <span>Número do Gympass</span>
                <input
                  value={editForm.gympassNumber}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      gympassNumber: event.target.value,
                    })
                  }
                  placeholder="Opcional"
                />
              </label>

              <label>
                <span>CPF</span>
                <input
                  value={editForm.cpf}
                  inputMode="numeric"
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      cpf: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <span>RG</span>
                <input
                  value={editForm.rg}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      rg: event.target.value,
                    })
                  }
                />
              </label>

              <label className="is-wide">
                <span>E-mail</span>
                <input
                  type="email"
                  value={editForm.email}
                  readOnly
                  aria-readonly="true"
                  title="O e-mail de acesso não é alterado nesta tela."
                />
              </label>

              <label>
                <span>Telefone</span>
                <input
                  value={editForm.phone}
                  inputMode="tel"
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      phone: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <span>Telefone de emergência</span>
                <input
                  value={editForm.emergencyPhone}
                  inputMode="tel"
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      emergencyPhone: event.target.value,
                    })
                  }
                />
              </label>

              <label className="is-wide">
                <span>Objetivo</span>
                <textarea
                  value={editForm.objective}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      objective: event.target.value,
                    })
                  }
                  placeholder="Ex.: hipertrofia, emagrecimento, condicionamento..."
                />
              </label>
            </div>

            <button
              type="submit"
              className="admin-edit-save"
              disabled={saving}
            >
              <AdminCheckIcon />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      ) : null}

      {quickOpen && selectedStudent ? (
        <div
          className="admin-sheet-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setQuickOpen(false);
            }
          }}
        >
          <section className="admin-quick-sheet is-template-library">
            <span className="admin-sheet-handle" />

            <header>
              <div>
                <small>MONTAR TREINO RÁPIDO</small>
                <h2>{selectedStudent.fullName}</h2>
                <p>Escolha um treino que você já salvou com nome.</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                disabled={saving}
              >
                <AdminCloseIcon />
              </button>
            </header>

            {quickTemplatesLoading ? (
              <div className="admin-quick-template-loading">
                <span className="admin-area-spinner" />
                <p>Carregando seus treinos salvos...</p>
              </div>
            ) : !quickTemplates.length ? (
              <div className="admin-quick-template-empty">
                <span>
                  <AdminBoltIcon size={27} />
                </span>
                <strong>Nenhum treino rápido salvo</strong>
                <p>
                  Essa biblioteca fica vazia até você montar um treino completo e tocar em “Salvar modelo”.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    void openCompleteTraining();
                  }}
                >
                  <AdminSparkIcon />
                  Criar primeiro modelo
                </button>
              </div>
            ) : (
              <>
                <div className="admin-quick-template-list">
                  {quickTemplates.map((template) => {
                    const exerciseCount = template.payload.routines.reduce(
                      (total, routine) => total + routine.exercises.length,
                      0,
                    );
                    const selected = template.id === selectedQuickTemplateId;

                    return (
                      <button
                        type="button"
                        key={template.id}
                        className={selected ? "is-active" : ""}
                        aria-pressed={selected}
                        onClick={() => setSelectedQuickTemplateId(template.id)}
                      >
                        <span>
                          <AdminDumbbellIcon />
                        </span>
                        <div>
                          <strong>{template.name}</strong>
                          <small>
                            {template.splitCode} · {template.payload.routines.length} rotina
                            {template.payload.routines.length === 1 ? "" : "s"} · {exerciseCount} exercício
                            {exerciseCount === 1 ? "" : "s"}
                          </small>
                        </div>
                        {selected ? <AdminCheckIcon /> : <AdminChevronIcon />}
                      </button>
                    );
                  })}
                </div>

                <div className="admin-quick-template-note">
                  <AdminBoltIcon size={21} />
                  <p>O modelo será copiado para este aluno e continuará salvo para ser usado novamente.</p>
                </div>

                <button
                  type="button"
                  className="admin-quick-publish"
                  onClick={() => void publishQuick()}
                  disabled={saving || !selectedQuickTemplateId}
                >
                  <AdminCheckIcon />
                  {saving ? "Publicando..." : "Publicar treino salvo"}
                </button>
              </>
            )}
          </section>
        </div>
      ) : null}

      <ResponsiveDialog open={exerciseDialogOpen} onOpenChange={(open) => { setExerciseDialogOpen(open); if (!open) resetExerciseDraft(); }} title="Novo exercício" description="Cadastre o exercício e envie o GIF diretamente para o Storage da ACCQUA.">
        <form className="admin-library-form" onSubmit={saveLibraryExercise}>
          <label>Nome<input required value={exerciseDraft.name} onChange={(e)=>setExerciseDraft({...exerciseDraft,name:e.target.value})} /></label>
          <div className="admin-library-form-grid"><label>Grupo muscular<input value={exerciseDraft.muscleGroup} onChange={(e)=>setExerciseDraft({...exerciseDraft,muscleGroup:e.target.value})} /></label><label>Equipamento<input value={exerciseDraft.equipment} onChange={(e)=>setExerciseDraft({...exerciseDraft,equipment:e.target.value})} /></label></div>
          <div className="admin-library-form-grid is-three"><label>Séries<input type="number" min="1" value={exerciseDraft.defaultSets} onChange={(e)=>setExerciseDraft({...exerciseDraft,defaultSets:Number(e.target.value)})} /></label><label>Reps mín.<input type="number" min="1" value={exerciseDraft.repsMin} onChange={(e)=>setExerciseDraft({...exerciseDraft,repsMin:Number(e.target.value)})} /></label><label>Reps máx.<input type="number" min="1" value={exerciseDraft.repsMax} onChange={(e)=>setExerciseDraft({...exerciseDraft,repsMax:Number(e.target.value)})} /></label></div>
          <label>Descanso padrão (s)<input type="number" min="15" value={exerciseDraft.restSeconds} onChange={(e)=>setExerciseDraft({...exerciseDraft,restSeconds:Number(e.target.value)})} /></label>
          <label>Dica de execução<textarea rows={3} value={exerciseDraft.beginnerTip} onChange={(e)=>setExerciseDraft({...exerciseDraft,beginnerTip:e.target.value})} /></label>
          <StorageImageUploadGrid bucket="exercicios-gifs" folder={`library/${user?.id ?? "staff"}`} value={exerciseMedia} onChange={setExerciseMedia} maxFiles={1} multiple={false} label="GIF ou imagem do exercício" />
          <button type="submit" className="admin-library-save" disabled={exerciseSaving}>{exerciseSaving ? "Salvando..." : "Adicionar exercício"}</button>
        </form>
      </ResponsiveDialog>
      <ConfirmDeleteDialog open={Boolean(exerciseDelete)} onOpenChange={(open)=>{if(!open)setExerciseDelete(null)}} title="Remover exercício da Biblioteca?" description={`“${exerciseDelete?.name ?? "Exercício"}” será excluído se não estiver em uso. Se houver ficha ou modelo vinculado, ele será apenas desativado e os treinos existentes serão preservados.`} onConfirm={confirmDeleteExercise} busy={exerciseSaving} />

      <ProfilePhotoViewer
        open={Boolean(photoViewer)}
        imageUrl={photoViewer?.url ?? ""}
        name={photoViewer?.name ?? "Perfil"}
        onClose={() => setPhotoViewer(null)}
      />

    </div>
  );
}
