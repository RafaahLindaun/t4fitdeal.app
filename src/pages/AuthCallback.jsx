import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";

export default function AuthCallback() {

  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {

    const run = async () => {

      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        navigate("/login", { replace: true });
        return;
      }

      setVisible(true);

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 700);

    };

    run();

  }, []);

  return (

    <div style={S.page}>

      <div
        style={{
          ...S.logo,
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(.95)"
        }}
      >
        fitdeal<span style={{color:ORANGE}}>.</span>
      </div>

    </div>

  );

}

const S = {

  page:{
    height:"100vh",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    background:"#f8fafc"
  },

  logo:{
    fontSize:42,
    fontWeight:900,
    letterSpacing:-1,
    color:"#0f172a",
    transition:"all .35s ease"
  }

};
