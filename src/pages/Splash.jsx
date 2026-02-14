import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import splashImg from "../assets/splash.png";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      nav("/auth", { replace: true }); // vai pro login
    }, 1500);

    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="splash-wrap">
      <div className="splash-stage">
        <img className="splash-runner" src={splashImg} alt="FitDeal" />
        <div className="splash-steps" />
        <div className="splash-footprints">
          <span className="fp fp1" />
          <span className="fp fp2" />
          <span className="fp fp3" />
          <span className="fp fp4" />
        </div>
      </div>
    </div>
  );
}
