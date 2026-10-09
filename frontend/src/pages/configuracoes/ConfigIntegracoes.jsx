import { useContext, useState } from "react";
import { Plug, Save } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import { dataHoraCurta } from "../comum/utilModulo";
import { guardarConfig, lerConfig, listarIntegracoes, testarIntegracao } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const ROTULOS = {
  mpesa_api_url: "URL M-Pesa",
  mpesa_api_key: "Chave M-Pesa",
  mpesa_api_secret: "Segredo M-Pesa",
  emola_api_url: "URL E-Mola",
  emola_api_key: "Chave E-Mola",
  emola_api_secret: "Segredo E-Mola",
  banco_api_url: "URL do banco",
  banco_api_key: "Chave do banco",
  google_maps_api_key: "Chave Google Maps",
};

const ConfigIntegracoes = () => {
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(() => {
    const config = lerConfig();
    return { ...config, mpesa_api_secret: "", emola_api_secret: "" };
  });
  const [itens, setItens] = useState(listarIntegracoes);
  const [aviso, setAviso] = useState(null);

  const guardar = () => {
    const parcial = {};
    Object.keys(ROTULOS).forEach((chave) => {
      if (chave.endsWith("secret") && !form[chave]) return;
      parcial[chave] = form[chave] || "";
    });
    guardarConfig(parcial, usuario);
    setAviso({ texto: "As integrações foram guardadas." });
  };

  const testar = (id) => {
    try {
      guardar();
      testarIntegracao(id, usuario);
      setItens(listarIntegracoes());
      setAviso({ texto: "A integração respondeu e ficou activa neste navegador." });
    } catch (e) {
      setItens(listarIntegracoes());
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills"><span className="cli-pill"><Plug size={16} /> Integrações</span></div>
        <button type="button" className="cli-btn-novo" onClick={guardar}><Save size={16} /> Guardar</button>
      </header>
      <div className="cfg-integ">
        {itens.map((item) => (
          <article className="cfg-cartao" key={item.id}>
            <div>
              <h3 className="cfg-titulo"><Plug size={18} /> {item.nome}</h3>
              <p>{item.provedor} · {item.tipo}</p>
              <span className={`cli-chip ${item.status === "Ativa" ? "" : item.status === "Erro" ? "is-vermelho" : "is-cinza"}`}>{item.status}{item.ultimo_teste ? ` · ${dataHoraCurta(item.ultimo_teste)}` : ""}</span>
            </div>
            <div className="cli-grid">
              {item.chaves.map((chave) => (
                <Campo key={chave} icon={Plug} label={ROTULOS[chave]}>
                  <input
                    type={chave.endsWith("secret") ? "password" : "text"}
                    value={form[chave] || ""}
                    placeholder={chave.endsWith("secret") ? "Deixe em branco para manter" : "Preencha este campo"}
                    onChange={(e) => setForm({ ...form, [chave]: e.target.value })}
                  />
                </Campo>
              ))}
            </div>
            <div>
              <button type="button" className="cli-btn-io" onClick={() => testar(item.id)}>Testar ligação</button>
            </div>
          </article>
        ))}
      </div>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigIntegracoes;
