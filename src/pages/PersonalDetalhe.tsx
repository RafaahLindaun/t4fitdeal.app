import { Header, Screen, Card } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function PersonalDetalhe() {
  return (
    <Screen>
      <Header infoTo="/personal" />
      <Card className="trainer-detail-hero"><div className="trainer-photo">👨‍🏫</div><div className="trainer-info"><span className="badge">⭐ Mais procurado</span><h1>Rafael</h1><p>Hipertrofia e força</p><p style={{marginTop:12}}>Sou apaixonado por ajudar pessoas a se tornarem mais fortes no corpo e na mente. Meu foco é construir treinos seguros, personalizados e com evolução real.</p><div className="tiny-chips"><span className="tiny-chip">🏆 5 anos</span><span className="tiny-chip">☀️ Manhã</span><span className="tiny-chip">⭐ Avaliação 4,9</span></div></div></Card>
      <section className="trainer-bio"><Card className="status-card"><Icon name="user" className="yellow" size={36}/><div><h2>Sobre mim</h2><p>Formado em Educação Física e pós-graduado em Fisiologia do Exercício.</p></div></Card><Card className="status-card"><Icon name="dumbbell" className="yellow" size={36}/><div><h2>Especialidades</h2><p>Hipertrofia, força, ganho de massa, periodização e acompanhamento de evolução.</p></div></Card><Card className="status-card"><Icon name="trophy" className="yellow" size={36}/><div><h2>Para quem indico</h2><p>Iniciantes, praticantes que querem evoluir e alunos que buscam definição.</p></div></Card></section>
      <button className="primary-btn"><Icon name="message"/>Chamar personal</button><button className="outline-btn"><Icon name="calendar"/>Ver horários disponíveis</button>
    </Screen>
  );
}
