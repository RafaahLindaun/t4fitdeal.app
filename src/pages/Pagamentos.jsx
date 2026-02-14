// ✅ COLE EM: src/pages/Pagamentos.jsx  (SEM BOTÃO FLUTUANTE, página normal)
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

export default function Pagamentos() {
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const payments = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`payments_${email}`) || "[]");
    } catch {
      return [];
    }
  }, [email]);

  return (
    <div style={S.page}>
      <div style={S.top}>
        <div style={S.title}>Pagamentos efetuados</div>
        <div style={S.sub}>Histórico do que já foi pago nesta conta.</div>
      </div>

      {payments.length === 0 ? (
        <div style={S.item}>
          <div style={S.itemRow}>
            <div>
              <div style={S.itemTitle}>Plano</div>
              <div style={S.itemDate}>
                {new Date().toLocaleDateString("pt-BR")} •{" "}
                {new Date().toLocaleTimeString("pt-BR")}
              </div>
            </div>
            <div style={S.itemPrice}>R$ 0,00</div>
          </div>
        </div>
      ) : (
        <div style={S.list}>
          {payments.map((p) => (
            <div key={p.id || p.createdAt} style={S.item}>
              <div style={S.itemRow}>
                <div>
                  <div style={S.itemTitle}>{p.title || "Plano"}</div>
                  <div style={S.itemDate}>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("pt-BR")
                      : "-"}{" "}
                    •{" "}
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleTimeString("pt-BR")
                      : "-"}
                  </div>
                </div>
                <div style={S.itemPrice}>
                  {typeof p.amount === "number"
                    ? `R$ ${p.amount.toFixed(2).replace(".", ",")}`
                    : "R$ 0,00"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  page: { padding: 20, paddingBottom: 120, background: BG, minHeight: "100vh" },
  top: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  sub: { marginTop: 4, fontSize: 13, color: MUTED, fontWeight: 700 },

  list: { display: "grid", gap: 12 },
  item: {
    borderRadius: 18,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 12px 32px rgba(15,23,42,.06)",
    padding: 16,
  },
  itemRow: { display: "flex", justifyContent: "space-between", gap: 12 },
  itemTitle: { fontSize: 14, fontWeight: 900, color: TEXT },
  itemDate: { marginTop: 6, fontSize: 12, color: MUTED, fontWeight: 700 },
  itemPrice: { fontSize: 14, fontWeight: 900, color: "#2563eb", whiteSpace: "nowrap" },
};
