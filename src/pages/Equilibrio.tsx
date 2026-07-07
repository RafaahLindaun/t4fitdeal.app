import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function Equilibrio() {
  return (
    <Screen>
      <Header title="MINHA DIETA" infoTo="/dieta/guia" />
      <div className="page-title"><h1>Equilíbrio nutricional</h1><p>Comer bem todos os dias é o que te leva mais longe.</p></div>
      <Card className="status-card"><Icon name="check" className="green" size={44}/><div><h2>Seu consumo de proteínas está ideal</h2><p>Você está no caminho certo para uma alimentação equilibrada.</p></div><div className="goal-gauge">72%<small style={{display:'block',fontSize:15,color:'var(--muted)'}}>da meta</small></div></Card>
      <Card className="plate-card"><h2>Monte seu prato equilibrado</h2><p>Use o modelo do prato como guia para suas principais refeições.</p><div className="plate"/><div className="macro-list" style={{textAlign:'left'}}><p><span className="dot blue"/>Proteínas <b>¼ do prato</b></p><p><span className="dot green"/>Legumes e verduras <b>½ do prato</b></p><p><span className="dot orange"/>Gorduras boas <b>pequena porção</b></p></div></Card>
      <Card className="chart-card"><h2>Dicas para o dia a dia</h2><section className="feature-grid"><div className="feature-card"><Icon name="target"/><strong>Equilibre macros</strong><small>Energia e recuperação</small></div><div className="feature-card"><Icon name="leaf"/><strong>Comida de verdade</strong><small>Prefira naturais</small></div><div className="feature-card"><Icon name="clock"/><strong>Não pule refeições</strong><small>Energia estável</small></div><div className="feature-card"><Icon name="spark"/><strong>Varie as cores</strong><small>Mais nutrientes</small></div></section></Card>
      <BottomNav active="inicio" />
    </Screen>
  );
}
