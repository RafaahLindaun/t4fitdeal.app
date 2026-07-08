import { useLocation } from "react-router-dom";
import AppShell from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../lib/permissions";

const RECEPTION_URL = "https://wa.me/551147181730?text=Olá,%20enviei%20meu%20cadastro%20no%20app%20Accqua%20Sports%20e%20gostaria%20de%20confirmar%20a%20liberação.";

export function RegistrationSent() {
  const location = useLocation();
  const professor = Boolean((location.state as { professorAccount?: boolean } | null)?.professorAccount);
  return <div className="auth-page"><section className="pending-public"><Icon name="check" size={44}/><h1>Cadastro enviado</h1><p>{professor ? "Confirme seu e-mail. Depois, o Supabase validará sua autorização como professor." : "Confirme seu e-mail e aguarde a recepção comparar seus dados com a matrícula da academia."}</p><a className="button primary" href="/login">Voltar para o login</a></section></div>;
}

export default function Pending() {
  const { profile, refreshProfile, signOut } = useAuth();
  const blocked = profile?.status === "blocked";
  const inactive = profile?.status === "inactive";
  return <AppShell hideNav>
    <div className="pending-card card">
      <span className={`pending-icon ${blocked ? "danger" : ""}`}><Icon name={blocked ? "lock" : "clock"} size={44}/></span>
      <h1>{blocked ? "Acesso bloqueado" : inactive ? "Matrícula inativa" : "Aguardando liberação"}</h1>
      <p>{blocked ? "Fale com a recepção para entender o bloqueio." : inactive ? "Sua matrícula está inativa no momento." : "A recepção precisa confirmar seus dados e sua matrícula ativa antes de liberar o aplicativo."}</p>
      <div className="pending-details"><span>Conta</span><strong>{profile?.email}</strong><span>Tipo</span><strong>{roleLabel(profile?.role)}</strong><span>Status</span><strong>{profile?.status}</strong></div>
      <button className="button primary" onClick={() => void refreshProfile()}><Icon name="refresh"/> Verificar novamente</button>
      <a className="button outline" href={RECEPTION_URL} target="_blank" rel="noreferrer"><Icon name="message"/> Falar com a recepção</a>
      <button className="text-button" onClick={() => void signOut()}>Sair da conta</button>
    </div>
  </AppShell>;
}
