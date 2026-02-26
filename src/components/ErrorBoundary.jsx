import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // log no console também
    // eslint-disable-next-line no-console
    console.error("FITDEAL RUNTIME ERROR:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = String(this.state.err?.message || this.state.err || "Erro desconhecido");
    const stack = String(this.state.err?.stack || "");
    const compStack = String(this.state.info?.componentStack || "");

    return (
      <div style={{ padding: 18, fontFamily: "system-ui", background: "#f8fafc", minHeight: "100vh" }}>
        <div
          style={{
            borderRadius: 18,
            padding: 14,
            background: "#fff",
            border: "1px solid rgba(15,23,42,.08)",
            boxShadow: "0 14px 40px rgba(15,23,42,.06)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>fitdeal. quebrou em runtime</div>
          <div style={{ marginTop: 8, color: "#334155", fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>
            {msg}
          </div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 800, color: "#0f172a" }}>Ver detalhes</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#0f172a" }}>{stack}</pre>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#0f172a" }}>{compStack}</pre>
          </details>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              width: "100%",
              padding: 12,
              borderRadius: 16,
              border: "none",
              background: "#FF6A00",
              color: "#111",
              fontWeight: 900,
            }}
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
