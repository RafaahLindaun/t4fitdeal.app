import { useNavigate } from "react-router-dom";

const ORANGE = "#FF6A00";

const TEXT = "#0f172a";

const MUTED = "#64748b";

const BORDER = "rgba(15,23,42,.08)";

export default function Politicas() {

  const nav = useNavigate();

  return (

    <div style={styles.page}>

      <button type="button" style={styles.backBtn} onClick={() => nav(-1)}>

        ← Voltar

      </button>

      <section style={styles.hero}>

        <div style={styles.kicker}>FitDeal</div>

        <h1 style={styles.title}>Políticas</h1>

        <p style={styles.text}>

          Informações básicas sobre uso do app, privacidade, planos e responsabilidade das ferramentas.

        </p>

      </section>

      <section style={styles.card}>

        <h2 style={styles.cardTitle}>Privacidade</h2>

        <p style={styles.cardText}>

          O FitDeal usa seus dados de perfil, treino, metas e progresso para personalizar sua experiência dentro do app.

          Dados sensíveis devem ser tratados com cuidado e não devem ser compartilhados fora da sua conta.

        </p>

      </section>

      <section style={styles.card}>

        <h2 style={styles.cardTitle}>Planos e acesso</h2>

        <p style={styles.cardText}>

          Recursos pagos dependem de uma assinatura ativa. Ao cancelar ou perder o status ativo, os recursos premium podem

          voltar ao modo gratuito.

        </p>

      </section>

      <section style={styles.card}>

        <h2 style={styles.cardTitle}>Treino, nutrição e saúde</h2>

        <p style={styles.cardText}>

          As informações do app servem como apoio à rotina. Elas não substituem avaliação médica, nutricional ou acompanhamento

          presencial de um profissional.

        </p>

      </section>

      <section style={styles.card}>

        <h2 style={styles.cardTitle}>Pagamentos</h2>

        <p style={styles.cardText}>

          Pagamentos, renovações e cancelamentos seguem as regras da plataforma de pagamento integrada ao app.

        </p>

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

    lineHeight: 1.48,

  },

};
