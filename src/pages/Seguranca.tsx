import { Header, Screen, Card, MenuRow } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function Seguranca() {
  return (
    <Screen>
      <Header title="SEGURANÇA" />
      <div className="page-title" style={{textAlign:'center'}}><span className="status-icon" style={{margin:'0 auto 12px', color:'var(--blue)'}}><Icon name="shield" size={46}/></span><p>Proteja sua conta e mantenha seus dados seguros.</p></div>
      <section className="menu-list"><MenuRow icon="lock" title="Alterar senha" subtitle="Crie uma nova senha para sua conta" to="/conta/seguranca"/><MenuRow icon="shield" title="Autenticação em duas etapas" subtitle="Mais segurança para sua conta • Ativada" to="/conta/seguranca"/><MenuRow icon="device" title="Dispositivos conectados" subtitle="Gerencie seus dispositivos" to="/conta/seguranca"/><MenuRow icon="mail" title="Encerrar sessão em outros dispositivos" subtitle="Saia da conta em outros lugares" to="/conta/seguranca"/></section>
      <Card className="chart-card" style={{marginTop:14}}><p><Icon name="info" className="blue"/> Nunca compartilhe sua senha com outras pessoas.</p></Card>
    </Screen>
  );
}
