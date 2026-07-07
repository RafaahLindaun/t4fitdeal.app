import { Header, Screen, BottomNav, MenuRow } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function Conta() {
  return (
    <Screen>
      <Header infoTo="/conta" help />
      <section className="account-head">
        <div><h1>Minha conta</h1><p>Gerencie suas informações e configurações</p></div>
        <div className="profile-mini"><span className="profile-circle"><Icon name="user" size={46}/></span><div><h2>Aluno</h2><a className="blue" href="/conta/perfil">Ver perfil ›</a></div></div>
      </section>
      <section className="menu-list">
        <MenuRow icon="user" title="Dados pessoais" subtitle="Atualize seus dados e informações" to="/conta/dados" />
        <MenuRow icon="bell" title="Notificações" subtitle="Gerencie como você recebe avisos" to="/conta/notificacoes" />
        <MenuRow icon="lock" title="Segurança" subtitle="Altere sua senha e configurações de segurança" to="/conta/seguranca" />
        <MenuRow icon="gear" title="Configurações do app" subtitle="Ajustes gerais do aplicativo" to="/conta/configuracoes" />
        <MenuRow icon="logout" title="Sair da conta" subtitle="Finalizar sessão no aplicativo" to="/login" />
      </section>
      <BottomNav active="perfil" />
    </Screen>
  );
}
