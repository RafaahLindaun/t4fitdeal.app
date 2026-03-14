import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const LIGHT = "#F7F7F5";
const WHITE = "#FFFFFF";

function fmtBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NutriPlus() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paidNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";
  const [loading, setLoading] = useState(false);

  const nutriPlus = 65.99;

  async function payMock() {
    setLoading(true);

    setTimeout(() => {
      localStorage.setItem(`nutri_plus_${email}`, "1");

      const payKey = `payments_${email}`;
      const raw = localStorage.getItem(payKey);
      const list = raw ? JSON.parse(raw) : [];

      list.unshift({
        id: String(Date.now()),
        plan: "Nutri+",
        amount: nutriPlus,
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem(payKey, JSON.stringify(list.slice(0, 50)));

      setLoading(false);
      nav("/nutricao");
    }, 900);
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroKicker}>premium nutrition</div>
        <h1 style={styles.heroTitle}>
          Nutri<span style={{ color: ORANGE }}>+</span>
        </h1>
        <p style={styles.heroSub}>
          O plano para quem quer ir além do treino e ter uma rotina alimentar mais guiada,
          prática e consistente dentro do FitDeal.
        </p>

        <div style={styles.heroGlow} />

        <div style={styles.heroCtas}>
          {!paidNutriPlus ? (
            <button style={styles.ctaPrimary} onClick={payMock} disabled={loading}>
              {loading ? "Processando..." : `Assinar Nutri+ por ${fmtBRL(nutriPlus)}/mês`}
            </button>
          ) : (
            <button style={styles.ctaPrimaryDark} onClick={() => nav("/nutricao")}>
              Abrir minha nutrição
            </button>
          )}

          <button style={styles.ctaGhost} onClick={() => nav("/planos")}>
            Ver planos
          </button>
        </div>

        <div style={styles.heroFoot}>
          {paidNutriPlus
            ? "Seu acesso Nutri+ já está ativo."
            : "Libere o módulo de nutrição premium e deixe seu resultado mais completo."}
        </div>
      </section>

      <section style={styles.proofCard}>
        <div style={styles.sectionTag}>por que o nutri+ chama mais</div>
        <h2 style={styles.sectionTitle}>Mais clareza. Mais consistência. Mais resultado.</h2>
        <p style={styles.sectionText}>
          O Nutri+ não é só uma aba extra. É a parte do app que aproxima treino e alimentação
          em um fluxo mais completo, mais fácil de seguir e muito mais valioso no dia a dia.
        </p>
      </section>

      <section style={styles.grid}>
        <FeatureCard
          title="Refeições guiadas"
          desc="Combinações de refeições prontas para facilitar sua rotina e reduzir a dúvida na hora de comer."
        />
        <FeatureCard
          title="Receitas completas"
          desc="Passo a passo, ingredientes e preparo organizados para você executar sem perder tempo."
        />
        <FeatureCard
          title="Hidratação no app"
          desc="Acompanhe sua água do dia com uma meta sugerida e visão mais prática da sua rotina."
        />
        <FeatureCard
          title="Suplementação"
          desc="Plano de suplementos recomendado por objetivo e ajustado ao seu peso."
        />
        <FeatureCard
          title="Favoritos"
          desc="Salve refeições e receitas para repetir o que funciona melhor para você."
        />
        <FeatureCard
          title="Fluxo premium"
          desc="Uma experiência mais completa para quem quer mais direção, mais praticidade e mais constância."
        />
      </section>

      <section style={styles.darkCard}>
        <div style={styles.darkLabel}>o que você leva no nutri+</div>
        <div style={styles.darkTitle}>Uma área premium feita para aumentar a adesão ao seu plano.</div>

        <div style={styles.bullets}>
          <Bullet text="Mais facilidade para decidir o que comer" />
          <Bullet text="Mais organização na rotina alimentar" />
          <Bullet text="Mais conexão entre treino e nutrição" />
          <Bullet text="Mais valor percebido dentro do app" />
        </div>

        {!paidNutriPlus ? (
          <button style={styles.darkCta} onClick={payMock} disabled={loading}>
            {loading ? "Processando..." : "Quero liberar o Nutri+"}
          </button>
        ) : (
          <button style={styles.darkCtaLight} onClick={() => nav("/nutricao")}>
            Entrar na área Nutri+
          </button>
        )}

        <div style={styles.smallPrint}>
          Assinatura recorrente mensal. Cancelamento simples quando quiser.
        </div>
      </section>

      <section style={styles.priceCard}>
        <div style={styles.priceTop}>
          <div>
            <div style={styles.priceLabel}>assinatura nutri+</div>
            <div style={styles.priceBig}>{fmtBRL(nutriPlus)}</div>
            <div style={styles.priceSub}>por mês</div>
          </div>

          <div style={styles.pricePill}>premium</div>
        </div>

        <div style={styles.priceBox}>
          <div style={styles.priceBoxTitle}>Para quem quer uma entrega mais completa</div>
          <div style={styles.priceBoxText}>
            Ideal para usuários que querem mais do que treino: querem apoio alimentar, praticidade
            na rotina e uma experiência mais forte dentro do FitDeal.
          </div>
        </div>

        {!paidNutriPlus ? (
          <button style={styles.bottomCta} onClick={payMock} disabled={loading}>
            {loading ? "Processando..." : "Assinar Nutri+ agora"}
          </button>
        ) : (
          <button style={styles.bottomCtaDark} onClick={() => nav("/nutricao")}>
            Ir para Nutrição
          </button>
        )}
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureIcon}>+</div>
      <div>
        <div style={styles.featureTitle}>{title}</div>
        <div style={styles.featureDesc}>{desc}</div>
      </div>
    </div>
  );
}

function Bullet({ text }) {
  return (
    <div style={styles.bulletRow}>
      <div style={styles.bulletDot} />
      <div style={styles.bulletText}>{text}</div>
    </div>
  );
}

const styles = {
  page: {
    padding: 18,
    paddingBottom: 120,
    background: LIGHT,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: 20,
    background: BLACK,
    color: WHITE,
    boxShadow: "0 22px 60px rgba(0,0,0,.18)",
  },

  heroGlow: {
    position: "absolute",
    right: -40,
    top: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(255,106,0,.30) 0%, rgba(255,106,0,0) 72%)",
    pointerEvents: "none",
  },

  heroKicker: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "rgba(255,255,255,.68)",
  },

  heroTitle: {
    margin: "8px 0 0 0",
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: -1,
  },

  heroSub: {
    marginTop: 10,
    maxWidth: 420,
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 700,
    color: "rgba(255,255,255,.82)",
  },

  heroCtas: {
    display: "grid",
    gap: 10,
    marginTop: 18,
  },

  ctaPrimary: {
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 18px 45px rgba(255,106,0,.24)",
  },

  ctaPrimaryDark: {
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "none",
    background: WHITE,
    color: BLACK,
    fontWeight: 950,
    fontSize: 15,
  },

  ctaGhost: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.06)",
    color: WHITE,
    fontWeight: 850,
    fontSize: 14,
  },

  heroFoot: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 700,
    color: "rgba(255,255,255,.68)",
  },

  proofCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    background: WHITE,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 14px 40px rgba(0,0,0,.05)",
  },

  sectionTag: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    color: BLACK,
    fontSize: 11,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  sectionTitle: {
    marginTop: 12,
    fontSize: 22,
    lineHeight: 1.08,
    letterSpacing: -0.5,
    fontWeight: 950,
    color: BLACK,
  },

  sectionText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 700,
    color: GRAY,
  },

  grid: {
    display: "grid",
    gap: 12,
    marginTop: 14,
  },

  featureCard: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 22,
    background: WHITE,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 10px 28px rgba(0,0,0,.04)",
  },

  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 18,
    flexShrink: 0,
  },

  featureTitle: {
    fontSize: 15,
    lineHeight: 1.2,
    fontWeight: 950,
    color: BLACK,
  },

  featureDesc: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 1.45,
    fontWeight: 700,
    color: GRAY,
  },

  darkCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 18,
    background: "linear-gradient(180deg, #121212 0%, #0B0B0C 100%)",
    color: WHITE,
    boxShadow: "0 18px 52px rgba(0,0,0,.18)",
  },

  darkLabel: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "rgba(255,255,255,.64)",
  },

  darkTitle: {
    marginTop: 10,
    fontSize: 24,
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -0.6,
  },

  bullets: {
    display: "grid",
    gap: 10,
    marginTop: 16,
  },

  bulletRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },

  bulletDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: ORANGE,
    marginTop: 6,
    flexShrink: 0,
  },

  bulletText: {
    fontSize: 13,
    lineHeight: 1.45,
    fontWeight: 800,
    color: "rgba(255,255,255,.88)",
  },

  darkCta: {
    marginTop: 18,
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 18px 45px rgba(255,106,0,.24)",
  },

  darkCtaLight: {
    marginTop: 18,
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "none",
    background: WHITE,
    color: BLACK,
    fontWeight: 950,
    fontSize: 15,
  },

  smallPrint: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 1.4,
    fontWeight: 700,
    color: "rgba(255,255,255,.62)",
  },

  priceCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    background: WHITE,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 14px 40px rgba(0,0,0,.05)",
  },

  priceTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-end",
  },

  priceLabel: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: GRAY,
  },

  priceBig: {
    marginTop: 6,
    fontSize: 36,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: -1,
    color: BLACK,
  },

  priceSub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: 800,
    color: GRAY,
  },

  pricePill: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
    color: BLACK,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  priceBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    background: "#FAFAF8",
    border: "1px solid rgba(0,0,0,.05)",
  },

  priceBoxTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: BLACK,
  },

  priceBoxText: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 1.45,
    fontWeight: 700,
    color: GRAY,
  },

  bottomCta: {
    marginTop: 14,
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 18px 45px rgba(255,106,0,.22)",
  },

  bottomCtaDark: {
    marginTop: 14,
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "none",
    background: BLACK,
    color: WHITE,
    fontWeight: 950,
    fontSize: 15,
  },
};
