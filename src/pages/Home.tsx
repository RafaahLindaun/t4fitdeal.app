import { Link } from "react-router-dom";
import { AppLogoHeader, BottomNav, Card } from "../components/Layout";
import { Icon, type IconName } from "../components/Icon";

const tiles: { label: string; icon: IconName; to: string; badge?: string }[] = [
  { label: "Meu treino", icon: "dumbbell", to: "/treino" },
  { label: "Minha dieta", icon: "apple", to: "/dieta" },
  { label: "Ranking", icon: "trophy", to: "/ranking", badge: "Novidade" },
  { label: "Área personal", icon: "clipboard", to: "/personal" },
  { label: "Loja", icon: "bag", to: "/loja" },
  { label: "Configuração", icon: "gear", to: "/conta" },
];

export default function Home() {
  return (
    <main className="screen">
      <AppLogoHeader bell />
      <section className="home-greeting"><h1>Olá, Aluno</h1><p>Seu app da academia</p></section>
      <Card className="status-card"><span className="status-icon"><Icon name="shield" size={34} /></span><div><strong>Matrícula ativa</strong><p><span className="yellow">•</span> Acesso liberado</p></div></Card>
      <section className="home-grid">
        {tiles.map((tile) => (
          <Link to={tile.to} key={tile.label}>
            <Card className="home-tile"><Icon name={tile.icon} size={42} /><strong>{tile.label}</strong>{tile.badge && <span className="badge">{tile.badge}</span>}<Icon className="chev" name="back" /></Card>
          </Link>
        ))}
      </section>
      <BottomNav active="inicio" />
    </main>
  );
}
