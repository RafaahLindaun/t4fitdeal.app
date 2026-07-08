import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const RECEPTION_URL = "https://wa.me/551147181730?text=Olá,%20preciso%20de%20ajuda%20para%20acessar%20o%20app%20Accqua%20Sports.";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading || !user || !profile) return;
    const from = (location.state as { from?: string } | null)?.from;
    navigate(profile.status === "active" || profile.role !== "student" ? from || "/home" : "/aguardando", { replace: true });
  }, [loading, user, profile, navigate, location.state]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no arquivo .env antes de entrar.");
      return;
    }
    if (!email.includes("@") || !password) {
      setMessage("Informe um e-mail válido e sua senha.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (error) setMessage("E-mail ou senha incorretos. Tente novamente ou fale com a recepção.");
  }

  async function signInGoogle() {
    setMessage("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
    setBusy(false);
    if (error) setMessage("Não foi possível entrar com Google agora.");
  }

  return (
    <div className="auth-page">
      <div className="auth-glow one"/><div className="auth-glow two"/>
      <div className="status-bar"><strong>9:41</strong><span>▮▮▮  Wi‑Fi  ▱</span></div>
      <section className="login-panel">
        <Logo />
        <div className="login-heading">
          <h1>Bem-vindo ao app<br/>da <em>Accqua Sports</em></h1>
          <p>Treinos, evolução, aulas e orientações<br/>em um só lugar.</p>
        </div>
        <div className="login-access card">
          <span><Icon name="unlock" size={30}/></span>
          <div><strong>Acesso exclusivo para alunos matriculados</strong><p>Seu acesso é liberado após a confirmação da recepção.</p></div>
        </div>
        <form className="auth-form" onSubmit={signIn}>
          <label className="auth-input"><Icon name="mail"/><input type="email" autoComplete="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)}/></label>
          <label className="auth-input"><Icon name="lock"/><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}/><button type="button" onClick={() => setShowPassword(!showPassword)}><Icon name={showPassword ? "eyeOff" : "eye"}/></button></label>
          {message && <div className="form-message error">{message}</div>}
          <button className="button primary large" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</button>
          <button className="button google" type="button" onClick={signInGoogle} disabled={busy}><span className="google-g">G</span> Entrar com Google</button>
          <Link className="button outline large" to="/primeiro-acesso">Primeiro acesso</Link>
        </form>
        <div className="login-benefits-title"><i/><span>No app, você pode:</span><i/></div>
        <div className="login-benefits">
          <div><Icon name="dumbbell"/><strong>Treino</strong><small>Treinos passados pelo professor.</small></div>
          <div><Icon name="apple"/><strong>Dieta</strong><small>Análise premium personalizada.</small></div>
          <div><Icon name="calendar"/><strong>Aulas</strong><small>Horários coletivos atualizados.</small></div>
          <div><Icon name="trophy"/><strong>Ranking</strong><small>Treinos válidos do mês.</small></div>
        </div>
        <p className="login-help"><Icon name="message"/> Problemas para acessar? <a href={RECEPTION_URL} target="_blank" rel="noreferrer">Fale com a recepção.</a></p>
      </section>
    </div>
  );
}
