// ✅ COLE EM: src/pages/NutriPlus.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function fmtBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function NutriPlus() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  // ✅ flags locais (enquanto não integra Stripe de verdade)
  const paidTreino = localStorage.getItem(`paid_${email}`) === "1";
  const paidNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";

  // valores (ajuste quando quiser)
  const baseTreino = 12.99;
  const nutriPlus = 65.99;

  const upgradeValue = useMemo(() => {
    if (paidTreino) return Math.max(0, nutriPlus - baseTreino);
    return nutriPlus;
  }, [paidTreino]);

  const [loading, setLoading] = useState(false);

  async function payMock() {
    // ✅ quando tiver Stripe: aqui você chama sua checkout session e redireciona.
    // Por enquanto: simula pagamento e libera Nutri+.
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem(`nutri_plus_${email}`, "1");
      // opcional: registrar “pagamento”
      const payKey = `payments_${email}`;
      const raw = localStorage.getItem(payKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: String(Date.now()),
        plan: "Nutri+",
        amount: upgradeValue,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(payKey, JSON.stringify(list.slice(0, 50)));

      setLoading(false);
      nav("/nutricao");
    }, 900);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.kicker}>Plano</div>
        <div style={styles.title}>Nutri+</div>
        <div style={styles.sub}>
          {paidNutriPlus ? "Você já tem o Nutri+ ativo ✅" : "Desbloqueie a área de nutrição completa."}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.badge}>O que você ganha</div>

        <div style={styles.list}>
          <Item title="42 refeições pra você" desc="2 cafés + 2 almoços + 2 jantas por dia, renovando todo dia." />
          <Item title="Receitas completas" desc="Ingredientes, preparo e porções — tudo pronto." />
          <Item title="Botão “Concluído”" desc="Marca o dia como feito e te dá mais opções quando quiser." />
          <Item title="Ajuste por objetivo" desc="Foco em hipertrofia / bem-estar / atleta (base do seu perfil)." />
          <Item title="Acesso Nutrição liberado" desc="A aba Nutrição vira completa automaticamente após pagar." />
        </div>
      </div>

      <div style={styles.priceCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
          <div>
            <div style={styles.priceLabel}>
              {paidTreino ? "Upgrade Nutri+ (diferença)" : "Assinatura Nutri+"}
            </div>
            <div style={styles.priceBig}>{fmtBRL(upgradeValue)}</div>
            <div style={styles.priceSub}>pagamento recorrente e automático</div>
          </div>
          <div style={styles.pill}>Nutri+</div>
        </div>

        {!paidNutriPlus ? (
          <button style={styles.cta} onClick={payMock} disabled={loading}>
            {loading ? "Processando..." : paidTreino ? "Assinar Nutri+ agora" : "Assinar Nutri+ agora"}
          </button>
        ) : (
          <button style={styles.ctaDark} onClick={() => nav("/nutricao")}>
            Ir para Nutrição
          </button>
        )}

        <div style={styles.small}>
          Ao assinar, você concorda com cobrança recorrente e cancelamento quando quiser.
        </div>
      </div>
    </div>
  );
}

function Item({ title, desc }) {
  return (
    <div style={styles.item}>
      <div style={styles.check}>✓</div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.itemTitle}>{title}</div>
        <div style={styles.itemDesc}>{desc}</div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 18, paddingBottom: 120, background: BG },

  header: {
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.70))",
    color: "#fff",
    boxShadow: "0 22px 70px rgba(15,23,42,.14)",
  },
  kicker: { fontSize: 12, fontWeight: 900, opacity: 0.9 },
  title: { marginTop: 6, fontSize: 26, fontWeight: 950, letterSpacing: -0.6, lineHeight: 1.05 },
  sub: { marginTop: 6, fontSize: 13, fontWeight: 800, opacity: 0.95, lineHeight: 1.35 },

  card: {
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.12)",
    color: "#111",
    fontWeight: 950,
    fontSize: 12,
    marginBottom: 12,
  },
  list: { display: "grid", gap: 10 },

  item: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 18,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: "rgba(255,106,0,.18)",
    color: ORANGE,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    flexShrink: 0,
  },
  itemTitle: { fontSize: 14, fontWeight: 950, color: TEXT, lineHeight: 1.2 },
  itemDesc: { marginTop: 4, fontSize: 12, fontWeight: 700, color: MUTED, lineHeight: 1.35 },

  priceCard: {
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    background: "#0B0B0C",
    color: "#fff",
    boxShadow: "0 18px 50px rgba(0,0,0,.18)",
  },
  priceLabel: { fontSize: 12, fontWeight: 900, opacity: 0.75 },
  priceBig: { marginTop: 6, fontSize: 34, fontWeight: 950, letterSpacing: -0.8 },
  priceSub: { marginTop: 4, fontSize: 12, fontWeight: 700, opacity: 0.8 },

  pill: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.14)",
    border: "1px solid rgba(255,106,0,.28)",
    color: "#fff",
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  cta: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.26)",
  },
  ctaDark: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "#fff",
    color: "#0B0B0C",
    fontWeight: 950,
  },

  small: { marginTop: 10, fontSize: 11, opacity: 0.75, fontWeight: 700, lineHeight: 1.35 },
};
