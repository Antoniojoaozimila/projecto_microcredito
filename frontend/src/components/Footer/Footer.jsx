import { useContext } from "react";
import { Link } from "react-router-dom";
import { SidebarContext } from "../../context/sidebarContext";
import { SISTEMA_VERSAO } from "../../constants/sistema";
import { useMarca } from "../../services/marcaSistema";
import SupportContact from "../SupportContact/SupportContact";
import "./Footer.css";

export default function Footer() {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const marca = useMarca();

  return (
    <footer className="app-footer dashboard-footer" data-collapsed={isSidebarCollapsed}>
      <div className="footer-inner">
        <p className="footer-copy">
          © {new Date().getFullYear()} {marca.nome}
        </p>
        <a
          className="footer-credit"
          href="https://saviltech.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Criado pela SavilTech &amp; Serviços LDA
        </a>
        <span className="footer-version" title={`Versão ${SISTEMA_VERSAO}`}>
          v{SISTEMA_VERSAO}
        </span>
        <nav className="footer-links" aria-label="Informação legal">
          <Link to="/imperial/dashboard/privacidade" className="footer-link">
            Privacidade
          </Link>
          <Link to="/imperial/dashboard/termos-uso" className="footer-link">
            Uso
          </Link>
          <Link to="/imperial/dashboard/cookies" className="footer-link">
            Cookies
          </Link>
        </nav>
        <SupportContact variant="footer" />
      </div>
    </footer>
  );
}
