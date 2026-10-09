import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const MenuSuspenso = ({ valor, opcoes, onChange, placeholder = "Seleccione", pesquisavel = false }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const texto = opcoes.find((op) => op.id === valor)?.label || placeholder;

  useEffect(() => {
    if (!aberto) return undefined;
    const fechar = (evento) => {
      if (!evento.target.closest(".cli-menu")) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return opcoes;
    return opcoes.filter((op) => op.label.toLowerCase().includes(q));
  }, [opcoes, busca]);

  return (
    <div className={`cli-menu ${aberto ? "is-open" : ""}`}>
      <button type="button" className="cli-menu-btn" onClick={() => setAberto((atual) => !atual)} aria-expanded={aberto}>
        <span>{texto}</span>
        <ChevronDown size={15} />
      </button>
      {aberto ? (
        <div className="cli-menu-painel">
          {pesquisavel ? (
            <label className="cli-menu-busca">
              <Search size={14} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar" />
            </label>
          ) : null}
          <ul>
            {visiveis.map((op) => (
              <li key={op.id || "vazio"}>
                <button
                  type="button"
                  className={op.id === valor ? "is-active" : ""}
                  onClick={() => {
                    onChange(op.id);
                    setAberto(false);
                    setBusca("");
                  }}
                >
                  {op.label}
                </button>
              </li>
            ))}
            {visiveis.length === 0 ? <li className="cli-menu-vazio">Sem resultados</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default MenuSuspenso;
