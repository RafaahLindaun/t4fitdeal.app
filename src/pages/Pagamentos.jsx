import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";
const LIGHT = "#F7F7F5";

export default function Pagamentos() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    async function loadPayments() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        setPayments(data || []);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [userId]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerRow}>
          <div style={styles.brand}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>
        </div>

        <div style={styles.title}>Pagamentos</div>

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
                  <div style={styles.plan}>{p.title || "Plano"}</div>
                  <div style={styles.price}>
                    R$ {(p.amount_brl / 100).toFixed(2)}
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
                    {p.status}
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
