import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import Logo from "../components/Logo";
import { Screen } from "../components/Layout";

export default function Login() {
  return (
    <Screen className="login-screen">
      <Logo />
      <div className="login-title">Bem-vindo ao app<br />da <span className="yellow">Accqua Sports</span></div>
      <p className="login-sub">Treinos, evolução, aulas e orientações em um só lugar.</p>
      <section className="glass-card status-card login-card">
        <span className="status-icon"><Icon name="lock" size={32} /></span>
        <div><strong>Acesso exclusivo para alunos matriculados</strong><p>Seu acesso é liberado de acordo com sua matrícula ativa na academia.</p></div>
      </section>
      <div className="login-card">
        <label className="input-field"><Icon name="user" /><input placeholder="CPF, e-mail ou telefone" /></label>
        <label className="input-field"><Icon name="lock" /><input placeholder="Senha" type="password" /><Icon name="eye" /></label>
        <Link to="/home" className="primary-btn">Entrar</Link>
        <button className="outline-btn">Primeiro acesso</button>
      </div>
      <p className="muted">No app, você pode:</p>
      <div className="feature-grid">
        <div className="feature-card"><Icon name="dumbbell" /><strong>Treino</strong><small>Acesse seus treinos</small></div>
        <div className="feature-card"><Icon name="apple" /><strong>Dieta</strong><small>Dicas personalizadas</small></div>
        <div className="feature-card"><Icon name="calendar" /><strong>Aulas</strong><small>Confira horários</small></div>
        <div className="feature-card"><Icon name="chart" /><strong>Evolução</strong><small>Acompanhe resultados</small></div>
      </div>
      <p className="muted"><Icon name="message" size={16} /> Problemas para acessar? <span className="yellow">Fale com a recepção.</span></p>
    </Screen>
  );
}
