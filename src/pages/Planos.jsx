import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";

export default function Planos() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const email = (user?.email || "anon").toLowerCase();

  const basicRef = useRef(null);
  const nutriRef = useRef(null);

  const [tap, setTap] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);

  const qs = useMemo(
    () => new URLSearchParams(location.search || ""),
    [location.search]
  );

  const checkoutStatus = (qs.get("checkout") || "").toLowerCase();

  const paid =
    subscription?.status === "active" ||
    subscription?.status === "trialing";

  async function loadSubscription() {
    if (!user?.id) {
      setSubscription(null);
      setLoadingSubscription(false);
      return;
    }

    setLoadingSubscription(true);

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("loadSubscription error:", error);
      setSubscription(null);
    } else {
      setSubscription(data ?? null);
    }

    setLoadingSubscription(false);
  }

  async function activateBasic() {
    try {
      if (!user) {
        nav("/login");
        return;
      }

      setCheckoutLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId: import.meta.env.VITE_STRIPE_PRICE_BASIC,
            planKey: "basico",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível iniciar o checkout.");
      }

      if (!data?.url) {
        throw new Error("A URL do checkout não foi retornada.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("activateBasic error:", err);
      alert(err?.message || "Erro ao abrir o pagamento.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function scrollTo(ref) {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    loadSubscription();
  }, [user?.id]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      const timer = setTimeout(() => {
        loadSubscription();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [checkoutStatus, user?.id]);

  useEffect(() => {
    const hash = (location.hash || "").toLowerCase();
    const focus = (qs.get("focus") || "").toLowerCase();

    if (hash === "#nutri" || focus === "nutri" || focus === "nutri+") {
      setTimeout(() => scrollTo(nutriRef), 60);
      return;
    }

    if (hash === "#basico" || focus === "basico" || focus === "basic") {
      setTimeout(() => scrollTo(basicRef), 60);
    }
  }, [location.hash, qs]);

  function goTab(which) {
    setTap(which);
    setTimeout(() => setTap(null), 140);
    if (which === "basico") scrollTo(basicRef);
    if (which === "nutri") scrollTo(nutriRef);
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      <section style={styles.hero}>
        <div style={styles.heroTop}>
          <button
            onClick={() => nav(-1)}
            style={styles.backMini}
            aria-label="Voltar"
            title="Voltar"
          >
            <ChevronLeft />
          </button>

          <div>
            <div style={styles.kicker}>Planos</div>
            <div style={styles.title}>Escolha seu acesso</div>
            <div style={styles.sub}>
              Pagamento recorrente. Cancelamento simples, sem burocracia.
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            onClick={() => goTab("basico")}
            style={{
              ...styles.tab,
              ...(tap === "basico" ? styles.tabTap : null),
            }}
          >
            Básico
          </button>

          <button
            onClick={() => goTab("nutri")}
            style={{
              ...styles.tabPremium,
              ...(tap === "nutri" ? styles.tabTap : null),
            }}
          >
            Nutri+
          </button>
        </div>

        {loadingSubscription ? (
          <div style={styles.freeBanner}>
            <div style={styles.lockMark}>
              <LockGlyph />
            </div>
            <div>
              <div style={styles.freeTitle}>Verificando assinatura</div>
              <div style={styles.freeText}>
                Aguarde um instante enquanto buscamos seu status.
              </div>
            </div>
            <div style={styles.freeRight}>
              <div style={styles.freePulseDot} />
            </div>
          </div>
        ) : paid ? (
          <div style={styles.paidBanner}>
            <div style={styles.paidDot} />
            Você já tem o Básico ativo.
            <button style={styles.paidBtn} onClick={() => nav("/dashboard")}>
              Ir pro dashboard
            </button>
          </div>
        ) : checkoutStatus === "success" ? (
          <div style={styles.freeBanner}>
            <div style={styles.lockMark}>
              <LockGlyph />
            </div>
            <div>
              <div style={styles.freeTitle}>Pagamento recebido</div>
              <div style={styles.freeText}>
                Se a liberação ainda não apareceu, atualize em alguns segundos.
              </div>
            </div>
            <div style={styles.freeRight}>
              <div style={styles.freePulseDot} />
            </div>
          </div>
        ) : checkoutStatus === "cancel" ? (
          <div style={styles.freeBanner}>
            <div style={styles.lockMark}>
              <LockGlyph />
            </div>

            <div>
              <div style={styles.freeTitle}>Pagamento não concluído</div>
              <div style={styles.freeText}>
                Você voltou do checkout sem finalizar a assinatura.
              </div>
            </div>

            <div style={styles.freeRight}>
              <div style={styles.freePulseDot} />
            </div>
          </div>
        ) : (
          <div style={styles.freeBanner}>
            <div style={styles.lockMark}>
              <LockGlyph />
            </div>

            <div>
              <div style={styles.freeTitle}>Você está no Free</div>
              <div style={styles.freeText}>
                Assine o Básico pra liberar o treino completo (detalhes, séries
                e evolução).
              </div>
            </div>

            <div style={styles.freeRight}>
              <div style={styles.freePulseDot} />
            </div>
          </div>
        )}
      </section>

      <section ref={basicRef} style={styles.section}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.tag}>BÁSICO</span>

            <div style={styles.priceWrap}>
              <span style={styles.price}>R$ 12,99</span>
              <span style={styles.per}>/mês</span>
            </div>
          </div>

          <div style={styles.cardTitle}>Treinos personalizados</div>
          <div style={styles.cardNote}>
            Foque no essencial: execução, constância e progressão.
          </div>

          <div style={styles.featureGrid}>
            <Feature
              title="Treino completo"
              text="Detalhes dos exercícios, séries e organização clara."
            />
            <Feature
              title="Evolução"
              text="Acompanhe sua constância e progresso com mais controle."
            />
            <Feature
              title="Liberação do app"
              text="Ao ativar, o treino deixa o modo limitado e libera o fluxo completo."
            />
          </div>

          <button
            onClick={paid ? () => nav("/dashboard") : activateBasic}
            disabled={paid || checkoutLoading || loadingSubscription}
            style={{
              ...styles.primary,
              ...(paid || checkoutLoading || loadingSubscription
                ? styles.primaryDisabled
                : null),
            }}
          >
            {paid
              ? "Já ativado"
              : checkoutLoading
              ? "Abrindo pagamento..."
              : loadingSubscription
              ? "Verificando..."
              : "Assinar agora"}
          </button>

          <div style={styles.micro}>
            Ao assinar, o app libera o treino completo e evolução.
          </div>
        </div>
      </section>

      <section ref={nutriRef} style={styles.section}>
        <div style={styles.cardPremium}>
          <div style={styles.cardHeader}>
            <span style={styles.tagPremium}>NUTRI+</span>

            <div style={styles.priceWrap}>
              <span style={{ ...styles.price, color: "rgba(255,255,255,.96)" }}>
                R$ 65,99
              </span>
              <span style={{ ...styles.per, color: "rgba(255,255,255,.70)" }}>
                /mês
              </span>
            </div>
          </div>

          <div style={styles.cardTitlePremium}>Nutrição + Treino (upgrade)</div>
          <div style={styles.cardNotePremium}>
            Para quem quer dieta guiada e evolução completa.
          </div>

          <div style={styles.featureGridPremium}>
            <FeaturePremium
              title="Plano alimentar"
              text="Organização alimentar integrada ao treino."
            />
            <FeaturePremium
              title="Acompanhamento"
              text="Uma área mais completa para evolução guiada."
            />
            <FeaturePremium
              title="Fluxo premium"
              text="Inclui recursos extras de nutrição e acompanhamento."
            />
          </div>

          <button style={styles.premiumCta} onClick={() => nav("/nutriplus")}>
            Ver área de nutrição
          </button>

          <div style={styles.microPremium}>
            Inclui recursos de nutrição e acompanhamento no mesmo fluxo.
          </div>
        </div>
      </section>

      <section style={styles.footer}>
        <button style={styles.back} onClick={() => nav("/dashboard")}>
          Voltar
        </button>
      </section>
    </div>
  );
}

function Feature({ title, text }) {
  return (
    <div style={styles.feat}>
      <div style={styles.featIcon}>
        <CheckGlyph color="#111" />
      </div>

      <div>
        <div style={styles.featTitle}>{title}</div>
        <div style={styles.featText}>{text}</div>
      </div>
    </div>
  );
}

function FeaturePremium({ title, text }) {
  return (
    <div style={styles.featPremium}>
      <div style={styles.featIconPremium}>
        <CheckGlyph color="#fff" />
      </div>

      <div>
        <div style={styles.featTitlePremium}>{title}</div>
        <div style={styles.featTextPremium}>{text}</div>
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18L9 12L15 6"
        stroke={TEXT}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckGlyph({ color = "#111" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 7L9 18L4 13"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 10V8a4 4 0 118 0v2"
        stroke={ORANGE}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke={ORANGE}
        strokeWidth="2.2"
      />
    </svg>
  );
}

const styles = {
  page: {
    padding: 18,
    paddingBottom: 120,
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.16), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
  },

  bgGlow: {
    position: "absolute",
    inset: -120,
    pointerEvents: "none",
    background:
      "radial-gradient(520px 260px at 86% 6%, rgba(15,23,42,.06), rgba(255,255,255,0) 70%)",
  },

  hero: {
    position: "relative",
    zIndex: 1,
    borderRadius: 26,
    padding: 16,
    background: "rgba(255,255,255,.72)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  heroTop: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  backMini: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.82)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 12px 34px rgba(15,23,42,.08)",
    flexShrink: 0,
  },

  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: MUTED,
  },

  title: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.8,
    lineHeight: 1.05,
  },

  sub: {
    marginTop: 8,
    fontSize: 13,
    color: MUTED,
    fontWeight: 800,
    lineHeight: 1.35,
  },

  tabs: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  tab: {
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.86)",
    fontWeight: 950,
    color: TEXT,
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
    transition: "transform .12s ease",
  },

  tabPremium: {
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.10)",
    background: "linear-gradient(180deg, #0B0C0F 0%, #14161B 100%)",
    fontWeight: 950,
    color: "rgba(255,255,255,.94)",
    boxShadow:
      "0 14px 38px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.06)",
    transition: "transform .12s ease",
  },

  tabTap: {
    transform: "scale(0.985)",
  },

  paidBanner: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 850,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  paidDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ORANGE,
  },

  paidBtn: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.10)",
    fontWeight: 950,
    color: TEXT,
    cursor: "pointer",
  },

  freeBanner: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background:
      "linear-gradient(135deg, rgba(255,255,255,.90), rgba(255,255,255,.78))",
    border: "1px solid rgba(15,23,42,.07)",
    boxShadow: "0 14px 40px rgba(15,23,42,.08)",
    color: TEXT,
    display: "flex",
    alignItems: "center",
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },

  lockMark: {
    width: 36,
    height: 36,
    borderRadius: 16,
    background:
      "radial-gradient(14px 14px at 30% 25%, rgba(255,106,0,.28), rgba(255,255,255,0) 70%), rgba(15,23,42,.04)",
    border: "1px solid rgba(255,106,0,.18)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 10px 26px rgba(255,106,0,.10)",
    flexShrink: 0,
  },

  freeTitle: {
    fontSize: 12,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
    lineHeight: 1.15,
  },

  freeText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    lineHeight: 1.3,
  },

  freeRight: {
    marginLeft: "auto",
    display: "grid",
    placeItems: "center",
  },

  freePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.12)",
  },

  section: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
  },

  card: {
    borderRadius: 26,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
  },

  cardPremium: {
    borderRadius: 26,
    padding: 18,
    background:
      "linear-gradient(180deg, #0B0C0F 0%, #14161B 55%, #0E0F13 100%)",
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow:
      "0 22px 80px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.06)",
    position: "relative",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  tag: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,106,0,.12)",
    border: "1px solid rgba(255,106,0,.24)",
    color: ORANGE,
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  tagPremium: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    color: "rgba(255,255,255,.92)",
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  priceWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },

  price: {
    fontSize: 28,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.7,
  },

  per: {
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
  },

  cardTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
  },

  cardNote: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.4,
  },

  cardTitlePremium: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 950,
    color: "rgba(255,255,255,.96)",
    letterSpacing: -0.3,
  },

  cardNotePremium: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,255,255,.70)",
    lineHeight: 1.4,
  },

  featureGrid: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },

  featureGridPremium: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },

  feat: {
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  featIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255,255,255,.9)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  featTitle: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
  },

  featText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.3,
  },

  featPremium: {
    borderRadius: 18,
    padding: 12,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  featIconPremium: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
  },

  featTitlePremium: {
    fontSize: 13,
    fontWeight: 950,
    color: "rgba(255,255,255,.92)",
    letterSpacing: -0.2,
  },

  featTextPremium: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,.70)",
    lineHeight: 1.3,
  },

  primary: {
    marginTop: 14,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 60px rgba(255,106,0,.26)",
    cursor: "pointer",
  },

  primaryDisabled: {
    opacity: 0.55,
    boxShadow: "none",
    cursor: "default",
  },

  premiumCta: {
    marginTop: 14,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.08)",
    color: "rgba(255,255,255,.92)",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow:
      "0 14px 40px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06)",
  },

  micro: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.35,
  },

  microPremium: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,.70)",
    lineHeight: 1.35,
  },

  footer: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
  },

  back: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },
};
