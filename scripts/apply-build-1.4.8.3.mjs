import { readFile, writeFile } from "node:fs/promises";

const file = "scr/pages/AdminArea.tsx";
let source = await readFile(file, "utf8");
let changed = 0;

function replaceOnce(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error("Build 1.4.8.3: trecho não encontrado (" + label + ")");
  source = source.replace(from, to);
  changed += 1;
}

function replaceBetween(startMarker, endMarker, replacement, label) {
  if (source.includes(replacement)) return;
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error("Build 1.4.8.3: início não encontrado (" + label + ")");
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error("Build 1.4.8.3: fim não encontrado (" + label + ")");
  source = source.slice(0, start) + replacement + source.slice(end);
  changed += 1;
}

replaceOnce(
  'import clsx from "clsx";\n',
  'import clsx from "clsx";\nimport * as Popover from "@radix-ui/react-popover";\n',
  "import Radix Popover",
);

replaceOnce(
  'import StudentMembershipEditor from "../components/StudentMembershipEditor";\n',
  'import StudentMembershipEditor from "../components/StudentMembershipEditor";\nimport StatusBadge from "../components/StatusBadge";\n',
  "import StatusBadge",
);

replaceOnce(
  'import "./admin-dashboard-v11.css";\n',
  'import "./admin-dashboard-v11.css";\nimport "./admin-area-v1483.css";\n',
  "import Build 1.4.8.3 CSS",
);

replaceBetween(
  '            <button\n              type="button"\n              className={clsx("admin-area-pending"',
  '          </header>',
`            {!selectedStudent ? (
              <button
                type="button"
                className={clsx("admin-area-pending", pendingCount > 0 && "has-pending")}
                onClick={() => selectPrimarySection("approvals")}
                aria-label={String(pendingCount) + " cadastros pendentes. Mostrar aprovações."}
                title="Ver aprovações pendentes"
              >
                {pendingCount}
                <small>pendentes</small>
              </button>
            ) : null}
`,
  "remover pendências do perfil individual",
);

replaceBetween(
  '            <div className="admin-student-quick-status" aria-label="Resumo rápido do aluno">',
  '            <section className="admin-student-action-tiles" aria-label="Ações de treino">',
`            <div className="admin-student-quick-status" aria-label="Resumo rápido do aluno">
              <StatusBadge variant={selectedJourneyDoneCount === 4 ? "success" : "warning"}>
                {selectedJourneyDoneCount}/4 etapas
              </StatusBadge>
              <StatusBadge
                variant={selectedMembershipHealth === "ativa" ? "success" : selectedMembershipHealth === "vencendo" ? "warning" : "danger"}
              >
                {selectedMembershipHealth === "ativa" ? "Matrícula ativa" : selectedMembershipHealth === "vencendo" ? "Matrícula vencendo" : "Matrícula inativa"}
              </StatusBadge>
              <StatusBadge variant={selectedStatus === "active" ? "success" : selectedStatus === "blocked" ? "danger" : "warning"}>
                {selectedStatus === "active" ? "Acesso autorizado" : selectedStatus === "blocked" ? "Acesso bloqueado" : "Acesso pendente"}
              </StatusBadge>
              <StatusBadge variant="neutral">
                {studentActivitiesLoading ? "Registros…" : studentActivities.length + " registro" + (studentActivities.length === 1 ? "" : "s")}
              </StatusBadge>
            </div>

`,
  "StatusBadge no perfil",
);

replaceBetween(
  '              <button\n                type="button"\n                className="admin-training-action is-quick-action"',
  '\n\n              <button\n                type="button"\n                className={clsx("admin-training-action", "is-complete-action"',
`              <Popover.Root
                open={quickOpen}
                onOpenChange={(open) => {
                  if (!open && !saving) setQuickOpen(false);
                }}
              >
                <Popover.Anchor asChild>
                  <button
                    type="button"
                    className="admin-training-action is-quick-action"
                    aria-haspopup="dialog"
                    aria-expanded={quickOpen}
                    onClick={() => selectedStatus === "active" ? void openQuickTraining() : setStudentDetailView("access")}
                  >
                    <span className="is-quick"><AdminBoltIcon /></span>
                    <div>
                      <strong>Montar treino rápido</strong>
                      <small>{selectedStatus === "active" ? "Publique um modelo salvo em poucos passos." : "Autorize o acesso do aluno para liberar esta ação."}</small>
                    </div>
                    <AdminChevronIcon />
                  </button>
                </Popover.Anchor>

                <Popover.Portal>
                  <Popover.Content
                    className="admin-quick-popover-v1483"
                    side="bottom"
                    align="start"
                    sideOffset={8}
                    collisionPadding={16}
                    avoidCollisions
                    onEscapeKeyDown={() => { if (!saving) setQuickOpen(false); }}
                  >
                    <header>
                      <div>
                        <small>MONTAR TREINO RÁPIDO</small>
                        <h2>{selectedStudent.fullName}</h2>
                        <p>Escolha um treino que você já salvou com nome.</p>
                      </div>
                      <button type="button" onClick={() => setQuickOpen(false)} disabled={saving} aria-label="Fechar treino rápido">
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
                        <span><AdminBoltIcon size={27} /></span>
                        <strong>Nenhum treino rápido salvo</strong>
                        <p>Essa biblioteca fica vazia até você montar um treino completo e tocar em “Salvar modelo”.</p>
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
                                <span><AdminDumbbellIcon /></span>
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
                    <Popover.Arrow className="admin-quick-popover-arrow-v1483" width={18} height={9} />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>`,
  "Radix Popover em treino rápido",
);

const legacyQuickStart = source.indexOf('      {quickOpen && selectedStudent ? (\n        <div\n          className="admin-sheet-backdrop"');
if (legacyQuickStart >= 0) {
  const nextDialog = source.indexOf('      <ResponsiveDialog open={exerciseDialogOpen}', legacyQuickStart);
  if (nextDialog < 0) throw new Error("Build 1.4.8.3: diálogo seguinte ao sheet legado não encontrado");
  source = source.slice(0, legacyQuickStart) + source.slice(nextDialog);
  changed += 1;
}

await writeFile(file, source);
console.log("Build 1.4.8.3: " + changed + " transformação(ões) aplicada(s).");
