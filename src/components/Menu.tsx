export default function Menu() {
  return (
    <header style={styles.header}>
      <div>
        <h1>FitLife</h1>
        <p style={styles.subtitle}>Treino e nutrição inteligente</p>
      </div>
      <div style={styles.avatar}>R</div>
    </header>
  );
}

const styles = {
  header: {
    padding: "20px",
    background: "#020617",
    borderBottom: "1px solid #1f2937",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#38bdf8",
    color: "#020617",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
};
