import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";
const LIGHT = "#F7F7F5";

function normalizePlanLabel(planKey) {
  if (planKey === "nutri") return "Nutri+";
  if (planKey === "basico") return "Básico";
  return "Plano";
}

function normalizeStatusLabel(status) {
  const raw = String(status || "").toLowerCase();
  if (raw === "active") return "Ativa";
  if (raw === "trialing") return "Em teste";
  if (raw === "paid") return "Pago";
  if (raw === "canceled") return "Cancelada";
  if (raw === "past_due") return "Pendente";
  return raw || "—";
}

function planAmountByKey(planKey) {
  if (planKey === "nutri") return 6599;
  if (planKey === "basico") return 1299;
  return 0;
}


export default function Pagamentos() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [payments, setPayments] = useState([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    async function loadPayments() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: paymentRows }, { data: subscriptionRow, error: subError }] =
          await Promise.all([
            supabase
              .from("payments")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false }),
            supabase
              .from("user_subscriptions")
              .select("plan_key,status,current_period_end,stripe_subscription_id,stripe_price_id,created_at,updated_at")
              .eq("user_id", userId)
              .maybeSingle(),
          ]);

        if (subError) {
          console.error("Pagamentos subscription error:", subError);
        }

        setSubscriptionInfo(subscriptionRow || null);

        const rows = Array.isArray(paymentRows) ? paymentRows : [];
        if (rows.length > 0) {
          setPayments(rows);
        } else if (subscriptionRow) {
          setPayments([
            {
              id: subscriptionRow.stripe_subscription_id || "subscription-row",
              title: normalizePlanLabel(subscriptionRow.plan_key),
              amount_brl: planAmountByKey(subscriptionRow.plan_key),
              created_at:
                subscriptionRow.updated_at ||
                subscriptionRow.created_at ||
                subscriptionRow.current_period_end ||
                new Date().toISOString(),
              status:
                subscriptionRow.status === "active" || subscriptionRow.status === "trialing"
                  ? "paid"
                  : subscriptionRow.status,
              source: "subscription",
            },
          ]);
        } else {
          setPayments([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [userId]);


  const currentPlanLabel = useMemo(() => {
    return subscriptionInfo ? normalizePlanLabel(subscriptionInfo.plan_key) : "Sem plano";
  }, [subscriptionInfo]);

  const currentStatusLabel = useMemo(() => {
    return subscriptionInfo ? normalizeStatusLabel(subscriptionInfo.status) : "Inativa";
  }, [subscriptionInfo]);

  async function cancelSubscription() {
    if (!subscriptionInfo?.stripe_subscription_id || cancelLoading) return;

    try {
      setCancelLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subscriptionId: subscriptionInfo.stripe_subscription_id,
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
        throw new Error(data?.error || data?.raw || `Erro ${response.status}`);
      }

      const { data: refreshed } = await supabase
        .from("user_subscriptions")
        .select("plan_key,status,current_period_end,stripe_subscription_id,stripe_price_id,created_at,updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      setSubscriptionInfo(refreshed || null);
    } catch (err) {
      alert(err?.message || "Não foi possível cancelar a assinatura.");
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerRow}>
          <div style={styles.brand}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>
        </div>

        <div style={styles.title}>Pagamentos</div>

        {subscriptionInfo ? (
          <div style={styles.summaryCard}>
            <div style={styles.cardTop}>
              <div style={styles.plan}>{currentPlanLabel}</div>
              <div
                style={{
                  ...styles.status,
                  ...(subscriptionInfo.status === "active" || subscriptionInfo.status === "trialing"
                    ? styles.statusPaid
                    : styles.statusPending),
                }}
              >
                {currentStatusLabel}
              </div>
            </div>

            <div style={styles.metaRow}>
              <span style={styles.meta}>
                {subscriptionInfo.current_period_end
                  ? `Válida até ${new Date(subscriptionInfo.current_period_end).toLocaleDateString("pt-BR")}`
                  : "Sem renovação ativa"}
              </span>
            </div>

            {(subscriptionInfo.status === "active" || subscriptionInfo.status === "trialing") ? (
              <button style={styles.cancelBtn} onClick={cancelSubscription}>
                {cancelLoading ? "Cancelando..." : "Cancelar assinatura"}
              </button>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div style={styles.loading}>Carregando pagamentos...</div>
        ) : payments.length === 0 ? (
          <div style={styles.empty}>
            Nenhum pagamento encontrado ainda.
          </div>
        ) : (
          <div style={styles.list}>
            {payments.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.plan}>{p.title || normalizePlanLabel(p.plan_key)}</div>
                  <div style={styles.price}>
                    R$ {((Number(p.amount_brl || 0)) / 100).toFixed(2)}
                  </div>
                </div>

                <div style={styles.metaRow}>
                  <span style={styles.meta}>
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </span>

                  <span
                    style={{
                      ...styles.status,
                      ...(p.status === "paid"
                        ? styles.statusPaid
                        : styles.statusPending),
                    }}
                  >
                    {normalizeStatusLabel(p.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button style={styles.backBtn} onClick={() => nav(-1)}>
          Voltar
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: LIGHT,
    padding: 20,
  },

  wrap: {
    maxWidth: 600,
    margin: "0 auto",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  brand: {
    fontSize: 28,
    fontWeight: 900,
    color: BLACK,
  },

  title: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 20,
    color: BLACK,
  },

  loading: {
    fontSize: 14,
    color: GRAY,
  },

  empty: {
    fontSize: 14,
    color: GRAY,
  },

  summaryCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: WHITE,
  },

  cancelBtn: {
    marginTop: 14,
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "none",
    background: BLACK,
    color: WHITE,
    fontWeight: 800,
    fontSize: 14,
  },

  list: {
    display: "grid",
    gap: 12,
  },

  card: {
    padding: 18,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: WHITE,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  plan: {
    fontSize: 16,
    fontWeight: 700,
    color: BLACK,
  },

  price: {
    fontSize: 16,
    fontWeight: 800,
    color: ORANGE,
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
  },

  meta: {
    fontSize: 12,
    color: GRAY,
  },

  status: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 700,
  },

  statusPaid: {
    background: "#E8F8F0",
    color: "#1F9D55",
  },

  statusPending: {
    background: "#FFF4E5",
    color: "#C77800",
  },

  backBtn: {
    marginTop: 24,
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 800,
    fontSize: 15,
  },
};
