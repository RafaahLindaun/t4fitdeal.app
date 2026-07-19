import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import {
  BuilderBackIcon,
  BuilderCheckIcon,
  BuilderCloseIcon,
  BuilderDumbbellIcon,
  BuilderLockIcon,
  BuilderRefreshIcon,
  BuilderSearchIcon,
  BuilderShieldIcon,
  BuilderStudentIcon,
} from "../components/WorkoutBuilderIcons";
import {
  formatStudentDocument,
  searchWorkoutStudents,
  updateStudentAppAccess,
  type StudentAccessStatus,
  type WorkoutStudent,
} from "../lib/workoutBuilder";
import "./workout-builder.css";
import "./access-authorization.css";

type AccessFilter = "pending" | "all" | "active" | "blocked";

function normalizeStatus(status: string): StudentAccessStatus {
  const value = status.trim().toLowerCase();

  if (value === "active" || value === "ativo") return "active";
  if (value === "blocked" || value === "bloqueado") return "blocked";
  if (value === "inactive" || value === "inativo") return "inactive";
  return "pending";
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AL"
  );
}

function statusLabel(status: StudentAccessStatus) {
  if (status === "active") return "Acesso liberado";
  if (status === "blocked") return "Acesso bloqueado";
  if (status === "inactive") return "Acesso inativo";
  return "Aguardando liberação";
}

export default function AccessAuthorization() {
  const navigate = useNavigate();
  const { user, profile, loading, isTeam, landingPath } = useAuth();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccessFilter>("pending");
  const [students, setStudents] = useState<WorkoutStudent[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [actionStudent, setActionStudent] = useState<WorkoutStudent | null>(null);
  const [actionStatus, setActionStatus] = useState<StudentAccessStatus>("active");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const staffLabel =
    profile?.role === "reception"
      ? "RECEPÇÃO"
      : profile?.role === "admin"
        ? "ADMINISTRAÇÃO"
        : "PROFESSOR";

  useEffect(() => {
    if (!user || !isTeam) return;

    const timer = window.setTimeout(async () => {
      setListLoading(true);
      setError("");

      try {
        setStudents(await searchWorkoutStudents(query));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar os cadastros.",
        );
      } finally {
        setListLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [isTeam, query, reloadKey, user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredStudents = useMemo(() => {
    const statusOrder: Record<StudentAccessStatus, number> = {
      pending: 0,
      inactive: 1,
      blocked: 2,
      active: 3,
    };

    return students
      .filter((student) => {
        const status = normalizeStatus(student.status);
        if (filter === "all") return true;
        if (filter === "pending") return status === "pending" || status === "inactive";
        return status === filter;
      })
      .sort((a, b) => {
        const statusDifference =
          statusOrder[normalizeStatus(a.status)] -
          statusOrder[normalizeStatus(b.status)];

        if (statusDifference !== 0) return statusDifference;
        return a.fullName.localeCompare(b.fullName, "pt-BR");
      });
  }, [filter, students]);

  const pendingCount = useMemo(
    () =>
      students.filter((student) => {
        const status = normalizeStatus(student.status);
        return status === "pending" || status === "inactive";
      }).length,
    [students],
  );

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }
  if (!isTeam) return <Navigate to="/menu-teste" replace />;

  const requestAction = (
    student: WorkoutStudent,
    nextStatus: StudentAccessStatus,
  ) => {
    setActionStudent(student);
    setActionStatus(nextStatus);
  };

  const confirmAction = async () => {
    if (!actionStudent) return;

    setSaving(true);

    try {
      const nextStatus = await updateStudentAppAccess(
        actionStudent.id,
        actionStatus,
      );

      setStudents((current) =>
        current.map((student) =>
          student.id === actionStudent.id
            ? { ...student, status: nextStatus }
            : student,
        ),
      );

      setToast(
        nextStatus === "active"
          ? `Entrada liberada para ${actionStudent.fullName.split(/\s+/)[0]}.`
          : `Acesso de ${actionStudent.fullName.split(/\s+/)[0]} foi bloqueado.`,
      );
      setActionStudent(null);
    } catch (actionError) {
      setToast(
        actionError instanceof Error
          ? actionError.message
          : "Não foi possível atualizar o acesso.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="builder-screen access-screen">
      <div className="builder-background" aria-hidden="true">
        <span className="builder-background-glow" />
        <span className="builder-background-grid" />
      </div>

      <main className="builder-shell access-shell">
        <header className="builder-header">
          <button
            type="button"
            className="builder-icon-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar ao menu"
          >
            <BuilderBackIcon />
          </button>

          <div className="builder-brand">
            <AccquaLogo compact />
            <div>
              <span>{staffLabel}</span>
              <strong>Controle de acesso</strong>
            </div>
          </div>

          <button
            type="button"
            className="builder-icon-button access-refresh-button"
            onClick={() => setReloadKey((current) => current + 1)}
            aria-label="Atualizar cadastros"
          >
            <BuilderRefreshIcon />
          </button>
        </header>

        <nav className="builder-mode-switch" aria-label="Funções da equipe">
          <button
            type="button"
            onClick={() => navigate("/montar-treino")}
          >
            <BuilderDumbbellIcon size={19} />
            Montar treino
          </button>
          <button type="button" className="is-active">
            <BuilderShieldIcon size={19} />
            Autorizar entrada
          </button>
        </nav>

        <section className="access-intro-card">
          <span className="access-intro-icon">
            <BuilderShieldIcon size={27} />
          </span>
          <div>
            <small>LIBERAÇÃO DO APLICATIVO</small>
            <h1>{pendingCount} cadastro{pendingCount === 1 ? "" : "s"} aguardando</h1>
            <p>
              Alunos não autorizados continuam na tela de espera. Ao liberar,
              o menu será aberto no próximo acesso ou atualização do aplicativo.
            </p>
          </div>
        </section>

        <section className="access-search-section">
          <label className="access-search-field">
            <BuilderSearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, sobrenome, CPF, RG ou matrícula"
              autoComplete="off"
              inputMode="search"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")}>
                <BuilderCloseIcon size={18} />
              </button>
            ) : null}
          </label>

          <div className="access-filters" aria-label="Filtrar cadastros">
            {[
              { key: "pending", label: "Pendentes" },
              { key: "all", label: "Todos" },
              { key: "active", label: "Liberados" },
              { key: "blocked", label: "Bloqueados" },
            ].map((item) => (
              <button
                type="button"
                key={item.key}
                className={filter === item.key ? "is-active" : ""}
                onClick={() => setFilter(item.key as AccessFilter)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="access-list" aria-live="polite">
          {listLoading ? (
            <div className="access-list-state">
              <span className="builder-spinner" />
              <p>Buscando cadastros...</p>
            </div>
          ) : null}

          {!listLoading && error ? (
            <div className="access-list-state is-error">
              <BuilderLockIcon size={27} />
              <strong>Não foi possível abrir a lista</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!listLoading && !error && !filteredStudents.length ? (
            <div className="access-list-state">
              <BuilderCheckIcon size={29} />
              <strong>Nenhum cadastro neste filtro</strong>
              <p>Use a busca ou selecione outra situação de acesso.</p>
            </div>
          ) : null}

          {!listLoading &&
            !error &&
            filteredStudents.map((student) => {
              const status = normalizeStatus(student.status);
              const canAuthorize = status !== "active";

              return (
                <article className="access-student-card" key={student.id}>
                  <div className="access-student-main">
                    <span className="access-student-avatar">
                      {initials(student.fullName)}
                    </span>

                    <div className="access-student-copy">
                      <div>
                        <strong>{student.fullName}</strong>
                        <span className={`access-status is-${status}`}>
                          {statusLabel(status)}
                        </span>
                      </div>

                      <p>
                        {student.registrationCode
                          ? `Matrícula ${student.registrationCode}`
                          : student.email || "Cadastro sem matrícula"}
                      </p>

                      <small>
                        CPF {formatStudentDocument(student.cpf)}
                        {student.rg ? ` · RG ${student.rg}` : ""}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      canAuthorize
                        ? "access-action-button is-authorize"
                        : "access-action-button is-block"
                    }
                    onClick={() =>
                      requestAction(
                        student,
                        canAuthorize ? "active" : "blocked",
                      )
                    }
                  >
                    {canAuthorize ? (
                      <BuilderCheckIcon size={20} />
                    ) : (
                      <BuilderLockIcon size={19} />
                    )}
                    {canAuthorize ? "Autorizar entrada" : "Bloquear acesso"}
                  </button>
                </article>
              );
            })}
        </section>
      </main>

      {actionStudent ? (
        <div
          className="access-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setActionStudent(null);
            }
          }}
        >
          <section
            className="access-confirm-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-confirm-title"
          >
            <span className="access-confirm-handle" />
            <span
              className={`access-confirm-icon ${
                actionStatus === "active" ? "is-authorize" : "is-block"
              }`}
            >
              {actionStatus === "active" ? (
                <BuilderShieldIcon size={29} />
              ) : (
                <BuilderLockIcon size={28} />
              )}
            </span>

            <small>
              {actionStatus === "active" ? "LIBERAR APLICATIVO" : "BLOQUEAR APLICATIVO"}
            </small>
            <h2 id="access-confirm-title">{actionStudent.fullName}</h2>
            <p>
              {actionStatus === "active"
                ? "A pessoa poderá sair da tela de espera e entrar normalmente no aplicativo."
                : "A pessoa voltará para a tela de acesso bloqueado e não abrirá o menu."}
            </p>

            <div className="access-confirm-actions">
              <button
                type="button"
                onClick={() => setActionStudent(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={
                  actionStatus === "active" ? "is-authorize" : "is-block"
                }
                onClick={() => void confirmAction()}
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : actionStatus === "active"
                    ? "Confirmar liberação"
                    : "Confirmar bloqueio"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className="access-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
