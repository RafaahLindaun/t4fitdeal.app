export default function Fab() {
  return (
    <button style={styles.btn}>+</button>
  );
}

const styles = {
  btn: {
    position: "fixed" as const,
    bottom: "20px",
    right: "20px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#38bdf8",
    color: "#020617",
    fontSize: "28px",
    border: "none",
  },
};
