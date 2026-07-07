import { Header, Screen, Card, Toggle } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function Configuracoes() {
  return (
    <Screen>
      <Header title="CONFIGURAÇÕES" />
      <div className="page-title" style={{textAlign:'center'}}><span className="status-icon" style={{margin:'0 auto 12px', color:'var(--yellow)'}}><Icon name="gear" size={46}/></span><p>Personalize sua experiência no app.</p></div>
      <section className="settings-list">
        <Card className="setting-row"><span><Icon name="fire"/><div><strong>Tema</strong><p>Escuro</p></div></span><Icon name="back" className="chev"/></Card>
        <Card className="setting-row"><span><Icon name="globe"/><div><strong>Idioma</strong><p>Português</p></div></span><Icon name="back" className="chev"/></Card>
        <Card className="setting-row"><span><Icon name="ruler"/><div><strong>Unidade de medida</strong><p>Métrico (kg, cm)</p></div></span><Icon name="back" className="chev"/></Card>
        <Card className="setting-row"><span><Icon name="sound"/><div><strong>Som</strong><p>Ativado</p></div></span><Toggle /></Card>
        <Card className="setting-row"><span><Icon name="device"/><div><strong>Vibração</strong><p>Ativada</p></div></span><Toggle /></Card>
      </section>
      <Card className="chart-card" style={{marginTop:14}}><p><Icon name="info" className="blue"/> As alterações são salvas automaticamente.</p></Card>
    </Screen>
  );
}
