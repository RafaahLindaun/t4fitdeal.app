import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

export default function AuthCallback() {
  const [step, setStep] = useState("Conectando")
  const navigate = useNavigate()

  useEffect(() => {
    async function handleAuth() {

      setStep("Conectando")

      await supabase.auth.getSession()

      setStep("Verificando conta")

      await new Promise((r) => setTimeout(r, 600))

      setStep("Carregando menu")

      await new Promise((r) => setTimeout(r, 600))

      navigate("/dashboard")
    }

    handleAuth()
  }, [])

  return (
    <div className="auth-wrapper">

      <div className="loader"></div>

      <p className="auth-text">{step}...</p>

      <style jsx>{`

        .auth-wrapper {
          height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-direction:column;
          background:#ffffff;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto;
        }

        .loader {
          width:38px;
          height:38px;
          border-radius:50%;
          border:3px solid rgba(255,120,0,0.15);
          border-top:3px solid #ff7a00;
          animation:spin 0.8s linear infinite;
        }

        .auth-text {
          margin-top:18px;
          font-size:15px;
          color:#555;
          letter-spacing:0.2px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

      `}</style>

    </div>
  )
}
