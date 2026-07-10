import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AccquaBrand } from "../components/AccquaBrand";

const initialRegister = {
  full_name: "",
  email: "",
  password: "",
  cpf: "",
  phone: "",
  emergency_phone: "",
  birth_date: "",
  goal: "Hipertrofia",
  current_weight: undefined as number | undefined,
  height_cm: undefined as number | undefined,
};

export default function Login() {
  const { user, signIn, signInWithGoogle, signUpFirstAccess } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialRegister);

  const canRegister = useMemo(
    () => form.full_name && form.email && form.password && form.cpf && form.phone && form.emergency_phone,
    [form],
  );

  if (user) return <Navigate to="/home" replace />;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const result = await signUpFirstAccess({
      ...form,
      current_weight: form.current_weight ? Number(form.current_weight) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
    });
    setSaving(false);
    if (result.error) setError(result.error);
    if (result.success) {
      setSuccess(result.success);
      setRegisterOpen(false);
      setForm(initialRegister);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-hero">
          <AccquaBrand />
          <h1>Treino, dieta e evolução<br />do jeito certo.</h1>
          <p>
            O app da Accqua Sports só funciona com matrícula liberada e com o treino passado pelo professor.
          </p>
          <div className="hero-bullets">
            <span>Treinos liberados pelo professor</span>
            <span>Dieta liberada conforme o plano</span>
            <span>Ranking por treino concluído</span>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-head">
            <strong>Entrar no app</strong>
            <span>Use seu e-mail ou Google</span>
          </div>
          <form className="stack-14" onSubmit={handleLogin}>
            <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" />
            <input className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" type="password" />
            {error ? <div className="notice danger">{error}</div> : null}
            {success ? <div className="notice success">{success}</div> : null}
            <button className="primary-btn" type="submit">Entrar</button>
            <button className="secondary-btn" type="button" onClick={async () => { const result = await signInWithGoogle(); if (result.error) setError(result.error); }}>
              Entrar com Google
            </button>
            <button className="ghost-btn" type="button" onClick={() => setRegisterOpen((v) => !v)}>
              Primeiro acesso
            </button>
          </form>

          {registerOpen ? (
            <form className="register-grid" onSubmit={handleRegister}>
              <div className="section-mini-title">Primeiro acesso</div>
              <input className="field" placeholder="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input className="field" placeholder="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              <input className="field" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="field" placeholder="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <input className="field" placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="field" placeholder="Telefone de emergência" value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} />
              <input className="field" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              <select className="field" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                <option>Hipertrofia</option>
                <option>Emagrecimento</option>
                <option>Condicionamento</option>
                <option>Saúde</option>
              </select>
              <div className="register-grid two">
                <input className="field" placeholder="Peso atual (kg)" type="number" value={form.current_weight ?? ""} onChange={(e) => setForm({ ...form, current_weight: Number(e.target.value) })} />
                <input className="field" placeholder="Altura (cm)" type="number" value={form.height_cm ?? ""} onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })} />
              </div>
              <div className="notice soft">
                Depois do cadastro, a recepção ou o professor precisa liberar sua conta. Professores com e-mail @professor.com entram direto como equipe.
              </div>
              <button className="primary-btn" disabled={!canRegister || saving} type="submit">
                {saving ? "Enviando..." : "Enviar cadastro"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
