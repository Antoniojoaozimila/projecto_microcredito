import { useEffect, useState } from "react";
import companyLogo from "../../assets/logo.png";
import "./PageLoader.css";

export default function PageLoader() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page-loader" role="status" aria-label="A carregar">
      <div className="page-loader-inner">
        <div className="page-loader-logo-wrap">
          <img src={companyLogo} alt="Sistema de Microcrédito" className="page-loader-logo" />
          <div className="page-loader-ring" />
        </div>
        <p className="page-loader-text">A carregar{dots}</p>
        <div className="page-loader-bar">
          <div className="page-loader-progress" />
        </div>
      </div>
    </div>
  );
}
