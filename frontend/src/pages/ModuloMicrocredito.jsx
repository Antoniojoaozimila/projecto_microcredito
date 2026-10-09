import { useLocation } from "react-router-dom";
import { flattenNavigationLinks } from "../data/data";
import "./ModuloMicrocredito.css";

const ModuloMicrocredito = () => {
  const { pathname } = useLocation();
  const pagina = flattenNavigationLinks().find((item) => item.path === pathname);
  const titulo = pagina?.title?.replace(/^\d{2}\s/, "") || "Módulo";

  return (
    <section className="modulo-page">
      <h1>{titulo}</h1>
      <p>Este módulo do Sistema de Microcrédito está em preparação.</p>
    </section>
  );
};

export default ModuloMicrocredito;
