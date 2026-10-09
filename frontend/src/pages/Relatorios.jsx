import { FaFileExcel, FaChartBar } from "react-icons/fa";
import MapaMensalSupervisor from "../components/MapaMensalSupervisor/MapaMensalSupervisor";
import "./Relatorios.css";

const Relatorios = () => (
  <div className="relatorios-container">
    <header className="relatorios-header">
      <h1 className="titulo-principal">
        <FaChartBar className="icon-titulo" /> Relatório de Vendas
      </h1>
      <p className="relatorios-subtitle">
        Tabela detalhada por agente, ponto de venda e semanas — com exportação Excel{" "}
        <FaFileExcel className="relatorios-excel-hint" />
      </p>
    </header>
    <MapaMensalSupervisor />
  </div>
);

export default Relatorios;
