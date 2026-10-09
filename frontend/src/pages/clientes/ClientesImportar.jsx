import { useContext, useState } from "react";
import { Download, Upload } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { importarClientes, listarClientes } from "../../services/clientesMicrocredito";
import "./ClienteModulo.css";

const ClientesImportar = () => {
  const { usuario } = useContext(AuthContext);
  const [mensagem, setMensagem] = useState("");

  const exportar = () => {
    const blob = new Blob([JSON.stringify(listarClientes(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clientes-microcredito.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importar = async (ficheiro) => {
    if (!ficheiro) return;
    try {
      const texto = await ficheiro.text();
      const dados = JSON.parse(texto);
      const lista = Array.isArray(dados) ? dados : [];
      const n = importarClientes(lista, usuario);
      setMensagem(`${n} cliente${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"}. Documentos repetidos foram ignorados.`);
    } catch {
      setMensagem("O ficheiro tem de ser um JSON com a lista de clientes.");
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-head">
        <div>
          <h1>Importar / Exportar</h1>
          <p>Leve a carteira de clientes para fora ou traga um ficheiro JSON.</p>
        </div>
      </header>
      {mensagem ? <p className="cli-ok">{mensagem}</p> : null}
      <section className="cli-section" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="cli-btn" onClick={exportar}><Download size={16} /> Exportar clientes</button>
        <label className="cli-btn ghost">
          <Upload size={16} /> Importar JSON
          <input type="file" accept="application/json" hidden onChange={(e) => importar(e.target.files?.[0])} />
        </label>
      </section>
    </div>
  );
};

export default ClientesImportar;
