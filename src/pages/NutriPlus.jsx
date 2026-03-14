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
        <div style={styles.kicker}>plano premium</div>
        <h1 style={styles.title}>
          Nutri<span style={{ color: ORANGE }}>+</span>
        </h1>
        <p style={styles.sub}>
          Para quem quer subir de nível no FitDeal e transformar alimentação em resultado de
          verdade.
        </p>

        <div style={styles.highlightBox}>
          <div style={styles.highlightTitle}>Treinar melhor começa em comer melhor.</div>
          <div style={styles.highlightText}>
            O Nutri+ organiza sua rotina alimentar dentro do app para você ganhar mais constância,
            mais clareza e mais evolução no dia a dia.
          </div>
        </div>

        {!paidNutriPlus ? (
          <button style={styles.ctaTop} onClick={payMock} disabled={loading}>
            {loading ? "Processando..." : `Assinar Nutri+ por ${fmtBRL(nutriPlus)}/mês`}
          </button>
        ) : (
          <button style={styles.ctaTopActive} onClick={() => nav("/nutricao")}>
            Abrir minha nutrição
          </button>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>O que muda com o Nutri+</h2>
        <p style={styles.sectionText}>
          Você abre o plano, entende rápido o valor, vê como isso encaixa no seu objetivo e sente
          que faz sentido evoluir sua alimentação junto com o treino.
        </p>

        <div style={styles.list}>
          <Benefit
            title="Mais direção para sua alimentação"
            desc="Menos dúvida no dia a dia e mais facilidade para seguir uma rotina melhor."
          />
          <Benefit
            title="Refeições e receitas dentro do app"
            desc="Tudo mais organizado para facilitar sua execução e manter constância."
          />
          <Benefit
            title="Mais conexão entre treino e resultado"
            desc="O plano premium deixa sua jornada mais completa e mais séria."
          />
          <Benefit
            title="Evolução mais consistente"
            desc="Quando alimentação e treino andam juntos, o resultado fica mais forte."
          />
        </div>
      </section>

      <section style={styles.priceCard}>
        <div style={styles.priceLabel}>nutri+ mensal</div>
        <div style={styles.priceBig}>{fmtBRL(nutriPlus)}</div>
        <div style={styles.priceSub}>para melhorar sua alimentação dentro do FitDeal</div>

        <div style={styles.priceCopy}>
          Ideal para quem quer uma experiência mais completa, mais premium e mais alinhada com
          evolução real.
        </div>

        {!paidNutriPlus ? (
          <button style={styles.ctaBottom} onClick={payMock} disabled={loading}>
            {loading ? "Processando..." : "Quero subir de nível"}
          </button>
        ) : (
          <button style={styles.ctaBottomActive} onClick={() => nav("/nutricao")}>
            Ir para Nutrição
          </button>
        )}

        <div style={styles.small}>
          Assinatura mensal com renovação automática. Cancelamento quando quiser.
        </div>
      </section>
    </div>
  );
}

function Benefit({ title, desc }) {
  return (
    <div style={styles.benefit}>
      <div style={styles.benefitIcon}>+</div>
      <div>
        <div style={styles.benefitTitle}>{title}</div>
        <div style={styles.benefitDesc}>{desc}</div>
      </div>
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
    borderRadius: 28,
    padding: 20,
    background: BLACK,
    color: WHITE,
    boxShadow: "0 22px 60px rgba(0,0,0,.18)",
  },

  kicker: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "rgba(255,255,255,.65)",
  },

  title: {
    margin: "8px 0 0 0",
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: -1,
  },

  sub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 700,
    color: "rgba(255,255,255,.84)",
  },

  highlightBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.08)",
  },

  highlightTitle: {
    fontSize: 16,
    lineHeight: 1.2,
    fontWeight: 900,
    color: WHITE,
  },

  highlightText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 700,
    color: "rgba(255,255,255,.72)",
  },

  ctaTop: {
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

  ctaTopActive: {
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

  section: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    background: WHITE,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 14px 40px rgba(0,0,0,.05)",
  },

  sectionTitle: {
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

  list: {
    display: "grid",
    gap: 12,
    marginTop: 16,
  },

  benefit: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 20,
    background: "#FAFAF8",
    border: "1px solid rgba(0,0,0,.05)",
  },

  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 18,
    flexShrink: 0,
  },

  benefitTitle: {
    fontSize: 14.5,
    lineHeight: 1.2,
    fontWeight: 950,
    color: BLACK,
  },

  benefitDesc: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 1.45,
    fontWeight: 700,
    color: GRAY,
  },

  priceCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    background: WHITE,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 14px 40px rgba(0,0,0,.05)",
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
    fontSize: 13,
    fontWeight: 800,
    color: GRAY,
  },

  priceCopy: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    background: "#FAFAF8",
    border: "1px solid rgba(0,0,0,.05)",
    fontSize: 12.5,
    lineHeight: 1.45,
    fontWeight: 700,
    color: GRAY,
  },

  ctaBottom: {
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

  ctaBottomActive: {
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

  small: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 1.4,
    fontWeight: 700,
    color: GRAY,
  },
};
