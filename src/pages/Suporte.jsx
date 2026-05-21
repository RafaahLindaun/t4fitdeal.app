import { useNavigate } from "react-router-dom";

const ORANGE = "#FF6A00";

const TEXT = "#0f172a";

const MUTED = "#64748b";

const BORDER = "rgba(15,23,42,.08)";

export default function Suporte() {

  const nav = useNavigate();

  return (

    <div style={styles.page}>

      <button type="button" style={styles.backBtn} onClick={() => nav(-1)}>

        ← Voltar

      </button>

      <section style={styles.hero}>

        <div style={styles.kicker}>FitDeal</div>

        <h1 style={styles.title}>Suporte</h1>

        <p style={styles.text}>

          Precisa de ajuda com conta, plano, treino, nutrição ou funcionamento do app? Use os canais abaixo.

        </p>

      </section>

      <section style={styles.card}>

        <h2 style={styles.cardTitle}>Contato</h2>

        <p style={styles.cardText}>

          Envie uma mensagem explicando seu problema, incluindo email da conta e print do erro, se tiver.

        </p>

        <a style={styles.cta} href="mailto:suporte@fitdeal.app?subject=Suporte%20FitDeal">

          Enviar email

        </a>

      </section>

      <section style={styles.card}>

        <h2 style={styles.cardTitle}>Problemas comuns</h2>

        <div style={styles.item}>

          <b>Plano não liberou</b>

          <span>Confira se o pagamento foi aprovado e atualize o app.</span>

        </div>

        <div style={styles.item}>

          <b>Esqueci minha senha</b>

          <span>Volte para o login, digite seu email e toque em “Esqueci a senha”.</span>

        </div>

        <div style={styles.item}>

          <b>Treino não aparece</b>

          <span>Entre novamente na conta ou refaça o onboarding.</span>

        </div>

      </section>

    </div>

  );

}

const styles = {

  page: {

    minHeight: "100dvh",

    background: "#f8fafc",

    padding: "22px 16px 110px",

    boxSizing: "border-box",

    color: TEXT,

  },

  backBtn: {

    height: 40,

    padding: "0 14px",

    borderRadius: 999,

    border: `1px solid ${BORDER}`,

    background: "#fff",

    fontWeight: 900,

    color: TEXT,

  },

  hero: {

    marginTop: 18,

    borderRadius: 26,

    padding: 22,

    background: "linear-gradient(135deg, rgba(255,106,0,.16), #fff)",

    border: "1px solid rgba(255,106,0,.16)",

    boxShadow: "0 18px 48px rgba(15,23,42,.07)",

  },

  kicker: {

    color: ORANGE,

    fontSize: 12,

    fontWeight: 950,

    textTransform: "uppercase",

    letterSpacing: 1,

  },

  title: {

    margin: "8px 0 0",

    fontSize: 30,

    fontWeight: 950,

    letterSpacing: -0.8,

  },

  text: {

    margin: "10px 0 0",

    color: MUTED,

    fontSize: 14,

    fontWeight: 750,

    lineHeight: 1.45,

  },

  card: {

    marginTop: 14,

    borderRadius: 24,

    padding: 18,

    background: "#fff",

    border: `1px solid ${BORDER}`,

    boxShadow: "0 14px 36px rgba(15,23,42,.06)",

  },

  cardTitle: {

    margin: 0,

    fontSize: 18,

    fontWeight: 950,

    letterSpacing: -0.4,

  },

  cardText: {

    margin: "8px 0 0",

    color: MUTED,

    fontSize: 13,

    fontWeight: 750,

    lineHeight: 1.4,

  },

  cta: {

    marginTop: 14,

    height: 48,

    borderRadius: 16,

    background: ORANGE,

    color: "#111",

    fontWeight: 950,

    textDecoration: "none",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    boxShadow: "0 16px 34px rgba(255,106,0,.24)",

  },

  item: {

    marginTop: 12,

    padding: 14,

    borderRadius: 18,

    background: "rgba(15,23,42,.03)",

    border: `1px solid ${BORDER}`,

    display: "grid",

    gap: 5,

    color: TEXT,

  },

};
