import { readFile, writeFile } from "node:fs/promises";

const file = "scr/pages/AdminArea.tsx";
let source = await readFile(file, "utf8");
let changed = 0;

function replaceOnce(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Build 1.4.8.3: trecho não encontrado (${label})`);
  source = source.replace(from, to);
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

const pendingStart = source.indexOf('            <button\n              type="button"\n              className={clsx("admin-area-pending"');
if (pendingStart >= 0) {
  const pendingEndMarker = '            </button>\n          </header>';
  const pendingEnd = source.indexOf(pendingEndMarker, pendingStart);
  if (pendingEnd < 0) throw new Error("Build 1.4.8.3: fim do badge de pendências não encontrado");
  const replacement = `            {!selectedStudent ? (\n              <button\n                type="button"\n                className={clsx("admin-area-pending", pendingCount > 0 && "has-pending")}\n                onClick={() => selectPrimarySection("approvals")}\n                aria-label={\`${pendingCount} cadastros pendentes. Mostrar aprovações.\`}\n                title="Ver aprovações pendentes"\n              >\n                {pendingCount}\n                <small>pendentes</small>\n              </button>\n            ) : null}\n          </header>`;
  source = source.slice(0, pendingStart) + replacement + source.slice(pendingEnd + pendingEndMarker.length);
  changed += 1;
}

replaceOnce(
`            <div className="admin-student-quick-status" aria-label="Resumo rápido do aluno">\n              <span className={selectedJourneyDoneCount === 4 ? "is-success" : "is-warning"}>{selectedJourneyDoneCount}/4 etapas</span>\n              <span className={\`is-${selectedMembershipHealth}\`}>{selectedMembershipHealth === "ativa" ? "Matrícula ativa" : selectedMembershipHealth === "vencendo" ? "Matrícula vencendo" : "Matrícula inativa"}</span>\n              <span className={selectedStatus === "active" ? "is-success" : selectedStatus === "blocked" ? "is-danger" : "is-warning"}>{selectedStatus === "active" ? "Acesso autorizado" : selectedStatus === "blocked" ? "Acesso bloqueado" : "Acesso pendente"}</span>\n              <span className="is-neutral">{studentActivitiesLoading ? "Registros…" : \`${studentActivities.length} registro${studentActivities.length === 1 ? "" : "s"}\`}</span>\n            </div>`,
`            <div className="admin-student-quick-status" aria-label="Resumo rápido do aluno">\n              <StatusBadge variant={selectedJourneyDoneCount === 4 ? "success" : "warning"}>\n                {selectedJourneyDoneCount}/4 etapas\n              </StatusBadge>\n              <StatusBadge\n                variant={selectedMembershipHealth === "ativa" ? "success" : selectedMembershipHealth === "vencendo" ? "warning" : "danger"}\n              >\n                {selectedMembershipHealth === "ativa" ? "Matrícula ativa" : selectedMembershipHealth === "vencendo" ? "Matrícula vencendo" : "Matrícula inativa"}\n              </StatusBadge>\n              <StatusBadge variant={selectedStatus === "active" ? "success" : selectedStatus === "blocked" ? "danger" : "warning"}>\n                {selectedStatus === "active" ? "Acesso autorizado" : selectedStatus === "blocked" ? "Acesso bloqueado" : "Acesso pendente"}\n              </StatusBadge>\n              <StatusBadge variant="neutral">\n                {studentActivitiesLoading ? "Registros…" : \`${studentActivities.length} registro${studentActivities.length === 1 ? "" : "s"}\`}\n              </StatusBadge>\n            </div>`,
  "semantic status badges",
);

const quickActionStart = source.indexOf('              <button\n                type="button"\n                className="admin-training-action is-quick-action"');
if (quickActionStart >= 0) {
  const completeActionMarker = '\n\n              <button\n                type="button"\n                className={clsx("admin-training-action", "is-complete-action"';
  const quickActionEnd = source.indexOf(completeActionMarker, quickActionStart);
  if (quickActionEnd < 0) throw new Error("Build 1.4.8.3: fim da ação de treino rápido não encontrado");

  const quickPopover = `              <Popover.Root\n                open={quickOpen}\n                onOpenChange={(open) => {\n                  if (!open && !saving) setQuickOpen(false);\n                }}\n              >\n                <Popover.Anchor asChild>\n                  <button\n                    type="button"\n                    className="admin-training-action is-quick-action"\n                    aria-haspopup="dialog"\n                    aria-expanded={quickOpen}\n                    onClick={() => selectedStatus === "active" ? void openQuickTraining() : setStudentDetailView("access")}\n                  >\n                    <span className="is-quick"><AdminBoltIcon /></span>\n                    <div>\n                      <strong>Montar treino rápido</strong>\n                      <small>{selectedStatus === "active" ? "Publique um modelo salvo em poucos passos." : "Autorize o acesso do aluno para liberar esta ação."}</small>\n                    </div>\n                    <AdminChevronIcon />\n                  </button>\n                </Popover.Anchor>\n\n                <Popover.Portal>\n                  <Popover.Content\n                    className="admin-quick-popover-v1483"\n                    side="bottom"\n                    align="start"\n                    sideOffset={8}\n                    collisionPadding={16}\n                    avoidCollisions\n                    onEscapeKeyDown={() => { if (!saving) setQuickOpen(false); }}\n                  >\n                    <header>\n                      <div>\n                        <small>MONTAR TREINO RÁPIDO</small>\n                        <h2>{selectedStudent.fullName}</h2>\n                        <p>Escolha um treino que você já salvou com nome.</p>\n                      </div>\n                      <button type="button" onClick={() => setQuickOpen(false)} disabled={saving} aria-label="Fechar treino rápido">\n                        <AdminCloseIcon />\n                      </button>\n                    </header>\n\n                    {quickTemplatesLoading ? (\n                      <div className="admin-quick-template-loading">\n                        <span className="admin-area-spinner" />\n                        <p>Carregando seus treinos salvos...</p>\n                      </div>\n                    ) : !quickTemplates.length ? (\n                      <div className="admin-quick-template-empty">\n                        <span><AdminBoltIcon size={27} /></span>\n                        <strong>Nenhum treino rápido salvo</strong>\n                        <p>Essa biblioteca fica vazia até você montar um treino completo e tocar em “Salvar modelo”.</p>\n                        <button\n                          type="button"\n                          onClick={() => {\n                            setQuickOpen(false);\n                            void openCompleteTraining();\n                          }}\n                        >\n                          <AdminSparkIcon />\n                          Criar primeiro modelo\n                        </button>\n                      </div>\n                    ) : (\n                      <>\n                        <div className="admin-quick-template-list">\n                          {quickTemplates.map((template) => {\n                            const exerciseCount = template.payload.routines.reduce(\n                              (total, routine) => total + routine.exercises.length,\n                              0,\n                            );\n                            const selected = template.id === selectedQuickTemplateId;\n                            return (\n                              <button\n                                type="button"\n                                key={template.id}\n                                className={selected ? "is-active" : ""}\n                                aria-pressed={selected}\n                                onClick={() => setSelectedQuickTemplateId(template.id)}\n                              >\n                                <span><AdminDumbbellIcon /></span>\n                                <div>\n                                  <strong>{template.name}</strong>\n                                  <small>\n                                    {template.splitCode} · {template.payload.routines.length} rotina\n                                    {template.payload.routines.length === 1 ? "" : "s"} · {exerciseCount} exercício\n                                    {exerciseCount === 1 ? "" : "s"}\n                                  </small>\n                                </div>\n                                {selected ? <AdminCheckIcon /> : <AdminChevronIcon />}\n                              </button>\n                            );\n                          })}\n                        </div>\n\n                        <div className="admin-quick-template-note">\n                          <AdminBoltIcon size={21} />\n                          <p>O modelo será copiado para este aluno e continuará salvo para ser usado novamente.</p>\n                        </div>\n\n                        <button\n                          type="button"\n                          className="admin-quick-publish"\n                          onClick={() => void publishQuick()}\n                          disabled={saving || !selectedQuickTemplateId}\n                        >\n                          <AdminCheckIcon />\n                          {saving ? "Publicando..." : "Publicar treino salvo"}\n                        </button>\n                      </>\n                    )}\n                    <Popover.Arrow className="admin-quick-popover-arrow-v1483" width={18} height={9} />\n                  </Popover.Content>\n                </Popover.Portal>\n              </Popover.Root>`;

  source = source.slice(0, quickActionStart) + quickPopover + source.slice(quickActionEnd);
  changed += 1;
}

const legacyQuickStart = source.indexOf('      {quickOpen && selectedStudent ? (\n        <div\n          className="admin-sheet-backdrop"');
if (legacyQuickStart >= 0) {
  const legacyQuickEndMarker = '\n\n      <ResponsiveDialog open={exerciseDialogOpen}';
  const legacyQuickEnd = source.indexOf(legacyQuickEndMarker, legacyQuickStart);
  if (legacyQuickEnd < 0) throw new Error("Build 1.4.8.3: fim do sheet legado não encontrado");
  source = source.slice(0, legacyQuickStart) + legacyQuickEndMarker + source.slice(legacyQuickEnd + legacyQuickEndMarker.length);
  changed += 1;
}

await writeFile(file, source);
console.log(`Build 1.4.8.3: ${changed} transformação(ões) aplicada(s).`);
