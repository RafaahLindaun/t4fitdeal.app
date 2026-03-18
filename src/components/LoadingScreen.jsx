import { useEffect } from "react";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";

export default function LoadingScreen({ fullScreen = true, label = "" }) {
  useEffect(() => {
    const id = "fitdeal-loading-anim";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes fitdealDotBounce {
        0% { transform: translateY(0px); opacity: 1; }
        35% { transform: translateY(-7px); opacity: .95; }
        65% { transform: translateY(2px); opacity: 1; }
        100% { transform: translateY(0px); opacity: 1; }
      }

      @keyframes fitdealFadeIn {
        from { opacity: 0; transform: scale(.985); }
        to { opacity: 1; transform: scale(1); }
      }

      .fitdeal-loading-enter {
        animation: fitdealFadeIn .28s ease both;
      }

      .fitdeal-loading-dot {
        display: inline-block;
        animation: fitdealDotBounce .9s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div
      className="fitdeal-loading-enter"
      style={{
        minHeight: fullScreen ? "100vh" : 160,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: fullScreen ? BG : "transparent",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: -1,
            color: TEXT,
            lineHeight: 1,
          }}
        >
          fitdeal<span className="fitdeal-loading-dot" style={{ color: ORANGE }}>.</span>
        </div>

        {label ? (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(15,23,42,.55)",
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
