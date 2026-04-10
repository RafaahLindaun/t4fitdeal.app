import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BG = "#f8fafc";
const BORDER = "rgba(15,23,42,.08)";
const SOFT = "rgba(15,23,42,.04)";

function moneyBRL(v) {
  return (Number(v || 0) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function planLabel(planKey) {
  const k = String(planKey || "").toLowerCase();
  if (k === "nutri") return "Nutri+";
  if (k === "basico") return "Básico";
  return "Plano ativo";
}

function planPrice(planKey) {
  const k = String(planKey || "").toLowerCase();
  if (k === "nutri") return 65.99;
  if (k === "basico") return 12.99;
  return 0;
}

export default function Pagamentos() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const activeStatus = useMemo(() => {
    return ["active", "trialing"].includes(
      String(subscription?.status || "").toLowerCase()
    );
  }, [subscription]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const [subRes, payRes] = await Promise.all([
        supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!alive) return;

      if (subRes.error) {
        console.error("Pagamentos subscription error:", subRes.error);
      }

      if (payRes.error) {
        console.error("Pagamentos payments error:", payRes.error);
      }

      setSubscription(subRes.data || null);
      setPayments(payRes.data || []);
      setLoading(false);
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  async function cancelSubscription() {
    if (!user?.id || !subscription?.stripe_subscription_id || canceling) return;

    try {
      setCanceling(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("VITE_SUPABASE_URL ausente.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
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

      const { data: refreshed, error: refreshError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (refreshError) {
        console.error("refresh subscription error:", refreshError);
      } else {
        setSubscription(refreshed || null);
      }

      alert("Assinatura cancelada com sucesso.");
    } catch (err) {
      console.error("cancelSubscription error:", err);
      alert(err?.message || "Não foi possível cancelar a assinatura.");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>Pagamentos</div>
            <div style={S.title}>Sua assinatura.</div>
            <div style={S.sub}>
              Veja seu plano atual, status e histórico.
            </div>
          </div>

          <button style={S.backBtn} onClick={() => nav(-1)} type="button">
            Voltar
          </button>
        </div>

        {loading ? (
          <section style={S.card}>
            <div style={S.rowTitle}>Carregando...</div>
          </section>
        ) : (
          <>
            <section style={S.card}>
              <div style={S.rowTop}>
                <div>
                  <div style={S.rowTitle}>Plano atual</div>
                  <div style={S.planName}>
                    {subscription ? planLabel(subscription.plan_key) : "Sem plano"}
                  </div>
                </div>

                <div
                  style={{
                    ...S.statusPill,
                    ...(activeStatus ? S.statusOn : S.statusOff),
                  }}
                >
                  {activeStatus ? "Ativo" : "Inativo"}
                </div>
              </div>

              <div style={S.metaGrid}>
                <div style={S.metaBox}>
                  <div style={S.metaLabel}>Cobrança</div>
                  <div style={S.metaValue}>
                    {subscription ? moneyBRL(planPrice(subscription.plan_key)) : "—"}
                  </div>
                </div>

                <div style={S.metaBox}>
                  <div style={S.metaLabel}>Recorrência</div>
                  <div style={S.metaValue}>Mensal</div>
                </div>

                <div style={S.metaBox}>
                  <div style={S.metaLabel}>Status Stripe</div>
                  <div style={S.metaValue}>{subscription?.status || "—"}</div>
                </div>

                <div style={S.metaBox}>
                  <div style={S.metaLabel}>Fim do período</div>
                  <div style={S.metaValue}>
                    {subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                      : "—"}
                  </div>
                </div>
              </div>

              <div style={S.noticeBox}>
                <div style={S.noticeTitle}>Informações importantes</div>
                <div style={S.noticeText}>
                  A cobrança da assinatura é mensal e renovada automaticamente
                  até o cancelamento.
                </div>
                <div style={S.noticeText}>
                  Após a cobrança efetivada, não há devolução do valor já pago.
                </div>
              </div>

              {activeStatus && subscription?.stripe_subscription_id ? (
                <button
                  type="button"
                  style={S.cancelBtn}
                  onClick={cancelSubscription}
                  disabled={canceling}
                >
                  {canceling ? "Cancelando..." : "Cancelar assinatura"}
                </button>
              ) : null}
            </section>

            <section style={S.card}>
              <div style={S.rowTitle}>Histórico</div>

              {payments.length === 0 ? (
                <div style={S.empty}>
                  Nenhum pagamento salvo no histórico ainda.
                </div>
              ) : (
                <div style={S.list}>
                  {payments.map((item) => (
                    <div key={item.id} style={S.item}>
                      <div>
                        <div style={S.itemTitle}>
                          {item.description || planLabel(item.plan_key)}
                        </div>
                        <div style={S.itemSub}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString("pt-BR")
                            : "—"}
                        </div>
                      </div>

                      <div style={S.itemRight}>
                        <div style={S.itemPrice}>
                          {moneyBRL(item.amount || planPrice(item.plan_key))}
                        </div>
                        <div style={S.itemStatus}>
                          {item.status || "pago"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    padding: 18,
    paddingBottom: 120,
  },

  wrap: {
    maxWidth: 760,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },

  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -1,
  },

  sub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.45,
    color: MUTED,
    fontWeight: 700,
  },

  backBtn: {
    padding: "12px 14px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT,
    fontWeight: 900,
  },

  card: {
    borderRadius: 24,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 34px rgba(15,23,42,.06)",
    padding: 16,
    marginBottom: 14,
  },

  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: 950,
    color: TEXT,
  },

  planName: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.5,
  },

  statusPill: {
    padding: "8px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: `1px solid ${BORDER}`,
    whiteSpace: "nowrap",
  },

  statusOn: {
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.20)",
    color: TEXT,
  },

  statusOff: {
    background: SOFT,
    color: MUTED,
  },

  metaGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  metaBox: {
    borderRadius: 18,
    background: SOFT,
    border: `1px solid ${BORDER}`,
    padding: 12,
  },

  metaLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  metaValue: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 900,
    color: TEXT,
  },

  noticeBox: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,106,0,.08)",
    border: "1px solid rgba(255,106,0,.16)",
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
  },

  noticeText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.45,
    color: MUTED,
    fontWeight: 700,
  },

  cancelBtn: {
    marginTop: 14,
    width: "100%",
    height: 52,
    borderRadius: 18,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
  },

  empty: {
    marginTop: 12,
    fontSize: 13,
    color: MUTED,
    fontWeight: 700,
  },

  list: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },

  item: {
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: SOFT,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: TEXT,
  },

  itemSub: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: 700,
  },

  itemRight: {
    textAlign: "right",
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: 900,
    color: TEXT,
  },

  itemStatus: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: 700,
  },
};
