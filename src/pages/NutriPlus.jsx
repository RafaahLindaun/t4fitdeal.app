import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const LIGHT = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";

function fmtBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NutriPlus() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [paidNutriPlus, setPaidNutriPlus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const nutriPlus = 65.99;

  useEffect(() => {
    let active = true;

    async function loadNutriStatus() {
      if (!user?.id) {
        if (!active) return;
        setPaidNutriPlus(false);
        setChecking(false);
        return;
      }

      try {
        const [subRes, profileRes] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("status, plan_type")
            .eq("user_id", user.id)
            .eq("plan_type", "nutri_plus")
            .in("status", ["active", "trialing"]),
          supabase
            .from("profiles")
            .select("nutri_plus, plan")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (!active) return;

        const bySubscription =
          Array.isArray(subRes.data) &&
          subRes.data.some((row) =>
            ["active", "trialing"].includes(String(row.status || "").toLowerCase())
          );

        const byProfile =
          profileRes.data?.nutri_plus === true ||
          String(profileRes.data?.plan || "").toLowerCase() === "nutri_plus";

        setPaidNutriPlus(!!bySubscription || !!byProfile);
      } catch (err) {
        console.error("NutriPlus load status error:", err);
        if (!active) return;
        setPaidNutriPlus(false);
      } finally {
        if (active) setChecking(false);
      }
    }

    loadNutriStatus();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function payMock() {
    if (!user?.id || loading) return;

    setLoading(true);

    try {
      const nowIso = new Date().toISOString();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: subError } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan_type: "nutri_plus",
          status: "active",
          amount: nutriPlus,
          currency: "BRL",
          current_period_end: periodEnd,
          updated_at: nowIso,
        },
        { onConflict: "user_id,plan_type" }
      );

      if (subError) {
        console.error("NutriPlus subscription error:", subError);
        setLoading(false);
        return;
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: user.id,
        plan: "Nutri+",
        amount: nutriPlus,
        status: "paid",
        created_at: nowIso,
      });

      if (paymentError) {
        console.error("NutriPlus payment error:", paymentError);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nutri_plus: true,
          plan: "nutri_plus",
          updated_at: nowIso,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("NutriPlus profile error:", profileError);
      }

      setPaidNutriPlus(true);
      setLoading(false);
      nav("/nutricao");
    } catch (err) {
      console.error("NutriPlus payMock catch:", err);
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.brand}>
          Nutri<span style={{ color: ORANGE }}>+</span>
        </div>

        <div style={styles.hero}>
          <h1 style={styles.title}>Melhore sua alimentação dentro do FitDeal.</h1>

          <p style={styles.sub}>
            Um plano premium para quem quer mais consistência, mais clareza e uma rotina alimentar
            mais forte junto com o treino.
          </p>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>O que você desbloqueia</div>

          <div style={styles.list}>
            <SimpleItem text="Refeições organizadas dentro do app" />
            <SimpleItem text="Receitas completas para facilitar sua rotina" />
            <SimpleItem text="Acompanhamento de hidratação" />
            <SimpleItem text="Sugestões de suplementação" />
            <SimpleItem text="Uma experiência mais completa para evoluir" />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Por que assinar</div>
          <p style={styles.copy}>
            Porque treinar bem é só parte do processo. O Nutri+ deixa sua jornada mais completa,
            mais prática e mais alinhada com resultado real.
          </p>
        </div>

        <div style={styles.footerCard}>
          <div style={styles.priceLabel}>Nutri+ mensal</div>
          <div style={styles.price}>{fmtBRL(nutriPlus)}</div>
          <div style={styles.priceSub}>por mês</div>

          {checking ? (
            <button style={styles.ctaDark} disabled>
              Carregando...
            </button>
          ) : !paidNutriPlus ? (
            <button style={styles.cta} onClick={payMock} disabled={loading}>
              {loading ? "Processando..." : "Quero subir de nível"}
            </button>
          ) : (
            <button style={styles.ctaDark} onClick={() => nav("/nutricao")}>
              Abrir minha nutrição
            </button>
          )}

          <div style={styles.small}>
            Assinatura mensal com renovação automática. Cancelamento quando quiser.
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleItem({ text }) {
  return (
    <div style={styles.item}>
      <div style={styles.dot} />
      <div style={styles.itemText}>{text}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: LIGHT,
    padding: 18,
    paddingBottom: 120,
  },

  wrap: {
    maxWidth: 560,
    margin: "0 auto",
  },

  brand: {
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: -1,
    color: BLACK,
    marginBottom: 22,
  },

  hero: {
    marginBottom: 28,
  },

  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: -1.2,
    color: BLACK,
  },

  sub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.55,
    fontWeight: 600,
    color: GRAY,
    maxWidth: 480,
  },

  section: {
    paddingTop: 22,
    paddingBottom: 22,
    borderTop: `1px solid ${BORDER}`,
  },

  sectionTitle: {
    fontSize: 16,
    lineHeight: 1.2,
    fontWeight: 800,
    color: BLACK,
    marginBottom: 14,
  },

  list: {
    display: "grid",
    gap: 14,
  },

  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ORANGE,
    marginTop: 7,
    flexShrink: 0,
  },

  itemText: {
    fontSize: 15,
    lineHeight: 1.5,
    fontWeight: 600,
    color: BLACK,
  },

  copy: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 600,
    color: GRAY,
    maxWidth: 500,
  },

  footerCard: {
    marginTop: 10,
    paddingTop: 24,
    borderTop: `1px solid ${BORDER}`,
  },

  priceLabel: {
    fontSize: 12,
    lineHeight: 1.2,
    fontWeight: 800,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  price: {
    marginTop: 8,
    fontSize: 40,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: -1.6,
    color: BLACK,
  },

  priceSub: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.4,
    fontWeight: 600,
    color: GRAY,
  },

  cta: {
    marginTop: 18,
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.2,
  },

  ctaDark: {
    marginTop: 18,
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: "none",
    background: BLACK,
    color: WHITE,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.2,
  },

  small: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 1.45,
    fontWeight: 600,
    color: GRAY,
  },
};
