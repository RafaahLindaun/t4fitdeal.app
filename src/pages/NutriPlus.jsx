import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const { user } = useAuth();

  const [paidNutriPlus, setPaidNutriPlus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const nutriPlus = 65.99;
  const qs = new URLSearchParams(location.search || "");
  const checkoutStatus = (qs.get("checkout") || "").toLowerCase();

  async function loadNutriStatus() {
    if (!user?.id) {
      setPaidNutriPlus(false);
      setChecking(false);
      return;
    }

    setChecking(true);

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_key", "nutri")
        .maybeSingle();

      if (error) {
        console.error("NutriPlus load status error:", error);
        setPaidNutriPlus(false);
      } else {
        const active =
          data?.status === "active" || data?.status === "trialing";
        setPaidNutriPlus(!!active);
      }
    } catch (err) {
      console.error("NutriPlus load status catch:", err);
      setPaidNutriPlus(false);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadNutriStatus();
  }, [user?.id]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      const timer = setTimeout(() => {
        loadNutriStatus();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [checkoutStatus, user?.id]);

  async function activateNutri() {
    if (!user?.id || loading) return;

    try {
      setLoading(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const priceId = import.meta.env.VITE_STRIPE_PRICE_NUTRI;

      if (!supabaseUrl) {
        throw new Error("VITE_SUPABASE_URL ausente.");
      }

      if (!priceId) {
        throw new Error("VITE_STRIPE_PRICE_NUTRI ausente.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId,
            planKey: "nutri",
          }),
        }
      );

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.raw || `Erro ${response.status}`
        );
      }

      if (!data?.url) {
        throw new Error("A function não retornou a URL do checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("NutriPlus activateNutri error:", err);
      alert(err?.message || "Não foi possível abrir o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.brand}>Nutri+</div>

        <section style={styles.hero}>
          <h1 style={styles.title}>Melhore sua alimentação dentro do FitDeal.</h1>
          <p style={styles.sub}>
            Um plano premium para quem quer mais consistência, mais clareza e uma
            rotina alimentar mais forte junto com o treino.
          </p>
        </section>

        {checkoutStatus === "success" && !paidNutriPlus && (
          <section style={styles.section}>
            <p style={styles.copy}>
              Pagamento recebido. Se sua liberação ainda não apareceu, aguarde
              alguns segundos e tente novamente.
            </p>
          </section>
        )}

        {checkoutStatus === "cancel" && !paidNutriPlus && (
          <section style={styles.section}>
            <p style={styles.copy}>
              O pagamento não foi concluído. Quando quiser, você pode tentar de
              novo.
            </p>
          </section>
        )}

        <section style={styles.section}>
          <div style={styles.sectionTitle}>O que você desbloqueia</div>

          <div style={styles.list}>
            <SimpleItem text="Acompanhamento nutricional dentro do app." />
            <SimpleItem text="Uma área mais completa para organizar melhor sua rotina alimentar." />
            <SimpleItem text="Fluxo premium integrado com a jornada de treino." />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Por que assinar</div>

          <p style={styles.copy}>
            Porque treinar bem é só parte do processo. O Nutri+ deixa sua jornada
            mais completa, mais prática e mais alinhada com resultado real.
          </p>
        </section>

        <section style={styles.footerCard}>
          <div style={styles.priceLabel}>Nutri+ mensal</div>
          <div style={styles.price}>{fmtBRL(nutriPlus)}</div>
          <div style={styles.priceSub}>por mês</div>

          {checking ? (
            <button style={styles.ctaDark} disabled>
              Carregando...
            </button>
          ) : !paidNutriPlus ? (
            <button style={styles.cta} onClick={activateNutri} disabled={loading}>
              {loading ? "Processando..." : "Quero subir de nível"}
            </button>
          ) : (
            <button style={styles.ctaDark} onClick={() => nav("/nutricao")}>
              Abrir minha nutrição
            </button>
          )}

          <div style={styles.small}>
            Assinatura mensal com renovação automática. Cancelamento quando
            quiser.
          </div>
        </section>
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
