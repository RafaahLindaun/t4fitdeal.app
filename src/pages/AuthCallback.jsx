import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthCallback() {

  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {

    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const timer = setTimeout(() => {

      if (!user.onboarded) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    }, 30000); // 30 segundos

    return () => clearTimeout(timer);

  }, [user, loading, navigate]);

  return (
    <div style={styles.container}>

      <div style={styles.spinner}></div>

      <p style={styles.text}>
        Preparando seu treino...
      </p>

    </div>
  );
}

const styles = {

  container: {
    height: "100vh",
    width: "100%",
    background: "#0f0f0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },

  spinner: {
    width: 60,
    height: 60,
    border: "4px solid transparent",
    borderTop: "4px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  text: {
    marginTop: 20,
    color: "#aaa",
    fontSize: 14
  }

};
