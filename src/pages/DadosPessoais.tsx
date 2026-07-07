import { Header, Screen, Card } from "../components/Layout";
import { Icon, type IconName } from "../components/Icon";

const rows: { icon: IconName; title: string; value: string }[] = [
  { icon: "user", title: "Nome completo", value: "Aluno Exemplo" },
  { icon: "calendar", title: "Data de nascimento", value: "01/01/1990" },
  { icon: "mail", title: "E-mail", value: "aluno@email.com" },
  { icon: "phone", title: "Telefone", value: "(11) 99999-9999" },
  { icon: "clipboard", title: "CPF", value: "123.456.789-00" },
  { icon: "map", title: "Endereço", value: "Rua Exemplo, 123\nSão Paulo - SP" },
  { icon: "shield", title: "Plano", value: "Mensal" },
  { icon: "phone", title: "Emergência", value: "(11) 98888-8888" },
];

export default function DadosPessoais() {
  return (
    <Screen>
      <Header title="DADOS PESSOAIS" />
      <div className="page-title" style={{textAlign:'center'}}><span className="profile-circle" style={{margin:'0 auto 12px'}}><Icon name="user" size={54}/></span><p>Mantenha seus dados sempre atualizados.</p></div>
      <Card className="form-list">{rows.map(r=><div className="form-row" key={r.title}><Icon name={r.icon} className="yellow"/><div><strong>{r.title}</strong><small>{r.value}</small></div><Icon name="back" className="chev"/></div>)}</Card>
      <button className="outline-btn" style={{marginTop:14}}><Icon name="edit"/>Editar dados</button>
    </Screen>
  );
}
