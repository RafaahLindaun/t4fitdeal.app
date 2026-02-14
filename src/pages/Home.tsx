export default function Home() {
  return (
    <main style={styles.container}>
      <h2>Seu treino e sua dieta, em um só lugar</h2>

      <section style={styles.cards}>
        <div style={styles.card}>🏋️ Treinos personalizados</div>
        <div style={styles.card}>🥗 Plano alimentar</div>
        <div style={styles.card}>💳 Planos e pagamentos</div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    padding: "24px",
  },
  cards: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  card: {
    background: "#020617",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
  },
};
export default function Home() {
  return (
    <main style={styles.container}>
      <section style={styles.hero}>
        <h2>Seu plano começa hoje</h2>
        <p>
          Treinos personalizados, dieta simples e acompanhamento real.
        </p>
      </section>

      <section style={styles.cards}>
        <div style={styles.card}>
          <span style={styles.icon}>🏋️</span>
          <h3>Treino</h3>
          <p>Planos adaptados ao seu objetivo</p>
        </div>

        <div style={styles.card}>
          <span style={styles.icon}>🥗</span>
          <h3>Nutrição</h3>
          <p>Dieta prática e sem frescura</p>
        </div>

        <div style={styles.card}>
          <span style={styles.icon}>💳</span>
          <h3>Planos</h3>
          <p>Pagamentos simples e controle total</p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    padding: "20px",
  },
  hero: {
    background: "linear-gradient(135deg, #020617, #111827)",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #1f2937",
  },
  cards: {
    marginTop: "24px",
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#111827",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #1f2937",
  },
  icon: {
    fontSize: "22px",
    marginBottom: "8px",
    display: "block",
  },
};
