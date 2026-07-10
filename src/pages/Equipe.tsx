import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { addWorkoutExercise, createWorkoutPlan, getClasses, getProducts, getStudentsForTeam, getStudentWorkout, upsertClass, upsertProduct } from "../lib/data";
import type { ClassItem, ProductItem, Profile, WorkoutExercise } from "../types";

export default function Equipe() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"alunos" | "treinos" | "loja" | "aulas">("alunos");
  const [students, setStudents] = useState<Profile[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [studentExercises, setStudentExercises] = useState<WorkoutExercise[]>([]);
  const [newProduct, setNewProduct] = useState({ title: "", category: "" });
  const [newClass, setNewClass] = useState({ title: "", category: "Coletiva", weekday: "Segunda", time_label: "18:00", gympass_plan: "Basic+" });
  const [newExercise, setNewExercise] = useState({ name: "", sets: 4, reps_min: 8, reps_max: 12, load_label: "20kg", rest_seconds: 60 });

  useEffect(() => {
    if (!profile) return;
    getStudentsForTeam(profile).then(setStudents);
    getProducts().then(setProducts);
    getClasses().then(setClasses);
  }, [profile]);

  useEffect(() => {
    if (!selected) return;
    getStudentWorkout(selected.id).then((result) => setStudentExercises(result.exercises));
  }, [selected]);

  const filtered = useMemo(() => students.filter((item) => item.full_name.toLowerCase().includes(query.toLowerCase())), [students, query]);

  const assignWorkout = async () => {
    if (!selected || !profile) return;
    const { data } = await createWorkoutPlan({ student_id: selected.id, professor_id: profile.id, name: `Treino ${new Date().toLocaleDateString('pt-BR')}`, version: 1, is_active: true });
    if (data?.id && newExercise.name) {
      await addWorkoutExercise({ plan_id: data.id, position: 1, ...newExercise });
      alert("Treino criado e exercício base adicionado.");
      const result = await getStudentWorkout(selected.id);
      setStudentExercises(result.exercises);
    }
  };

  const saveProduct = async () => {
    await upsertProduct({ id: `local-${Date.now()}`, title: newProduct.title, category: newProduct.category, active: true });
    setProducts((prev) => [...prev, { id: `local-${Date.now()}`, title: newProduct.title, category: newProduct.category, active: true }]);
    setNewProduct({ title: "", category: "" });
  };

  const saveClass = async () => {
    await upsertClass({ id: `class-${Date.now()}`, ...newClass, active: true });
    setClasses((prev) => [...prev, { id: `class-${Date.now()}`, ...newClass, active: true }]);
    setNewClass({ title: "", category: "Coletiva", weekday: "Segunda", time_label: "18:00", gympass_plan: "Basic+" });
  };

  return (
    <AppShell title="Área da equipe" subtitle="Professores, recepção e admin controlam o app por aqui.">
      <Panel>
        <div className="switch-row">
          {(["alunos", "treinos", "loja", "aulas"] as const).map((item) => <button key={item} className={`tab-chip ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}
        </div>
      </Panel>

      {tab === "alunos" ? (
        <Panel>
          <SectionTitle title="Todos os alunos" hint="Pesquise, abra e acompanhe seus alunos." />
          <input className="field" placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="teacher-list top-space">
            {filtered.map((item) => <button key={item.id} className={`teacher-card button-reset ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelected(item)}><div className="teacher-avatar">{item.full_name.charAt(0)}</div><div><strong>{item.full_name}</strong><p>{item.goal || 'Sem objetivo'}</p></div></button>)}
          </div>
        </Panel>
      ) : null}

      {tab === "treinos" ? (
        <>
          <Panel>
            <SectionTitle title="Criar ou editar treino" hint="Selecione um aluno na aba alunos e depois monte o treino." />
            <p className="muted">Aluno selecionado: <strong>{selected?.full_name || 'Nenhum'}</strong></p>
            <div className="register-grid two top-space">
              <input className="field" placeholder="Exercício" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
              <input className="field" placeholder="Carga" value={newExercise.load_label} onChange={(e) => setNewExercise({ ...newExercise, load_label: e.target.value })} />
            </div>
            <div className="register-grid two top-space">
              <input className="field" type="number" placeholder="Séries" value={newExercise.sets} onChange={(e) => setNewExercise({ ...newExercise, sets: Number(e.target.value) })} />
              <input className="field" type="number" placeholder="Descanso (s)" value={newExercise.rest_seconds} onChange={(e) => setNewExercise({ ...newExercise, rest_seconds: Number(e.target.value) })} />
            </div>
            <div className="register-grid two top-space">
              <input className="field" type="number" placeholder="Reps mín" value={newExercise.reps_min} onChange={(e) => setNewExercise({ ...newExercise, reps_min: Number(e.target.value) })} />
              <input className="field" type="number" placeholder="Reps máx" value={newExercise.reps_max} onChange={(e) => setNewExercise({ ...newExercise, reps_max: Number(e.target.value) })} />
            </div>
            <button className="primary-btn full-width top-space" onClick={assignWorkout}>Criar treino com exercício base</button>
          </Panel>
          <Panel>
            <SectionTitle title="Sugestões de exercícios" hint="Use o + no seu fluxo real; aqui já deixei a base pronta." />
            <div className="chip-grid"><span className="chip active">Supino reto</span><span className="chip">Puxada alta</span><span className="chip">Leg press</span><span className="chip">Extensora</span><span className="chip">Agachamento guiado</span></div>
            <div className="teacher-list top-space">{studentExercises.map((item) => <div key={item.id} className="menu-card"><span>{item.name}</span><small>{item.sets} séries • {item.reps_min} a {item.reps_max} reps • {item.load_label}</small></div>)}</div>
          </Panel>
        </>
      ) : null}

      {tab === "loja" ? (
        <Panel>
          <SectionTitle title="Itens da loja" hint="A recepção controla o catálogo visual do app." />
          <div className="register-grid two">
            <input className="field" placeholder="Nome do item" value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} />
            <input className="field" placeholder="Categoria" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
          </div>
          <button className="primary-btn full-width top-space" onClick={saveProduct}>Adicionar item</button>
          <div className="teacher-list top-space">{products.map((item) => <div key={item.id} className="menu-card"><span>{item.title}</span><small>{item.category}</small></div>)}</div>
        </Panel>
      ) : null}

      {tab === "aulas" ? (
        <Panel>
          <SectionTitle title="Aulas e horários" hint="A recepção pode colocar, tirar e ajustar os horários." />
          <div className="register-grid two">
            <input className="field" placeholder="Título" value={newClass.title} onChange={(e) => setNewClass({ ...newClass, title: e.target.value })} />
            <input className="field" placeholder="Categoria" value={newClass.category} onChange={(e) => setNewClass({ ...newClass, category: e.target.value })} />
            <input className="field" placeholder="Dia" value={newClass.weekday} onChange={(e) => setNewClass({ ...newClass, weekday: e.target.value })} />
            <input className="field" placeholder="Horário" value={newClass.time_label} onChange={(e) => setNewClass({ ...newClass, time_label: e.target.value })} />
            <input className="field" placeholder="Plano Gympass" value={newClass.gympass_plan} onChange={(e) => setNewClass({ ...newClass, gympass_plan: e.target.value })} />
          </div>
          <button className="primary-btn full-width top-space" onClick={saveClass}>Adicionar aula</button>
          <div className="teacher-list top-space">{classes.map((item) => <div key={item.id} className="menu-card"><span>{item.title}</span><small>{item.category} • {item.weekday} • {item.time_label} • {item.gympass_plan}</small></div>)}</div>
        </Panel>
      ) : null}
    </AppShell>
  );
}
