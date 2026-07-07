import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { students } from "../data/appData";

export default function Ranking() {
  return (
    <Screen>
      <Header infoTo="/ranking" />
      <div className="page-title"><h1>Ranking</h1><p>Alunos com mais treinos</p></div>
      <section className="ranking-podium">
        {[students[1], students[0], students[2]].map((s, idx) => <Card key={s.name} className={`podium-card ${idx === 1 ? 'first' : ''}`}><div className="avatar">{idx===1?'🥇':idx===0?'🥈':'🥉'}</div><h2>{s.name}</h2><p className="yellow">{s.trainings} treinos</p></Card>)}
      </section>
      <section className="rank-list">{students.slice(3).map(s=><Card className="rank-row" key={s.name}><strong>{s.pos}</strong><span className="avatar">🙂</span><h3>{s.name}</h3><p>{s.trainings} treinos</p></Card>)}</section>
      <BottomNav active="ranking" />
    </Screen>
  );
}
