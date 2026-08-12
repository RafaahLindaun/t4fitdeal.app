import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import { useAuth } from "../auth/AuthProvider";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, loading, landingPath, completeGoogleProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    fullName: String(user?.user_metadata?.full_name ?? ""),
    cpf: "",
    phone: "",
    emergencyPhone: "",
    birthDate: "",
    objective: "Hipertrofia",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/completar-cadastro") return <Navigate to={landingPath} replace />;

  const returnToLogin = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await completeGoogleProfile(form);
    setBusy(false);
    setMessage(result.error ?? result.message ?? "");
  };

  return (
    <div className="state-screen complete-profile-screen">
      <main className="complete-card">
        <button
          className="complete-profile-exit"
          type="button"
          onClick={() => void returnToLogin()}
        >
          <span aria-hidden="true">←</span>
          Entrar de outra forma
        </button>
        <AccquaLogo />
        <h1>Complete seu cadastro</h1>
        <p>O Google confirmou seu e-mail. Agora faltam os dados da academia.</p>
        <form className="register-form" onSubmit={save}>
          <label>Nome completo<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>CPF<input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></label>
          <label>Telefone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Telefone de emergência<input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} /></label>
          <label>Nascimento<input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></label>
          <label>Objetivo<select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}><option>Hipertrofia</option><option>Emagrecimento</option><option>Condicionamento</option><option>Saúde e qualidade de vida</option></select></label>
          {message ? <div className="register-note">{message}</div> : null}
          <button className="login-primary-button" disabled={busy} type="submit">{busy ? "Salvando..." : "Salvar dados"}</button>
        </form>
      </main>
    </div>
  );
}
