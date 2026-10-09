import { useContext, useState } from "react";
import { BadgeCheck, Building2, ImagePlus, Mail, Phone, Save } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import { lerFicheiro } from "../comum/utilModulo";
import { guardarMarca, useMarca } from "../../services/marcaSistema";
import { guardarConfig, lerConfig } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const lerImagem = async (ficheiro) => {
  if (!ficheiro) return "";
  if (!/^image\/(png|jpeg|webp)$/.test(ficheiro.type)) throw new Error("Use uma imagem PNG, JPG ou WEBP.");
  if (ficheiro.size > 2 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 2 MB.");
  const lido = await lerFicheiro(ficheiro);
  return lido.conteudo;
};

const ZonaArrasto = ({ rotulo, dica, imagem, onImagem, onErro }) => {
  const [sobre, setSobre] = useState(false);
  const aceitar = async (ficheiro) => {
    try {
      onImagem(await lerImagem(ficheiro));
    } catch (e) {
      onErro(e.message);
    }
  };
  return (
    <label
      className={`cfg-drop${sobre ? " is-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setSobre(true); }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => { e.preventDefault(); setSobre(false); aceitar(e.dataTransfer.files?.[0]); }}
    >
      {imagem ? <img src={imagem} alt="" /> : <span className="cfg-vazio"><ImagePlus size={22} /></span>}
      <span>
        <strong>{rotulo}</strong>
        <small style={{ display: "block", marginTop: 4 }}>{dica}</small>
      </span>
      <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => aceitar(e.target.files?.[0])} />
    </label>
  );
};

const ConfigIdentidade = () => {
  const { usuario } = useContext(AuthContext);
  const marca = useMarca();
  const [empresa, setEmpresa] = useState(() => ({ ...lerConfig(), nome_sistema: marca.nome, logo: marca.logo, favicon: marca.favicon }));
  const [aviso, setAviso] = useState(null);
  const setE = (campo) => (valor) => setEmpresa((e) => ({ ...e, [campo]: valor }));

  const guardarIdentidade = () => {
    if (!empresa.nome_empresa?.trim() || !empresa.nome_sistema?.trim()) {
      setAviso({ erro: true, texto: "Indique o nome da empresa e o nome que aparece no navegador." });
      return;
    }
    guardarMarca({ nome: empresa.nome_sistema.trim(), logo: empresa.logo || "", favicon: empresa.favicon || "" });
    guardarConfig({
      nome_empresa: empresa.nome_empresa.trim(),
      endereco_empresa: empresa.endereco_empresa || "",
      telefone_empresa: empresa.telefone_empresa || "",
      email_empresa: empresa.email_empresa || "",
      nuit_empresa: empresa.nuit_empresa || "",
      moeda_padrao: empresa.moeda_padrao,
      idioma_padrao: empresa.idioma_padrao,
      fuso_horario: empresa.fuso_horario,
      formato_data: empresa.formato_data,
    }, usuario);
    setAviso({ texto: "A identidade do sistema foi actualizada.", detalhe: "O logótipo passa a aparecer no início de sessão e na barra lateral. O nome e o ícone do separador também foram actualizados." });
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Building2 size={16} /> Identidade da empresa</span>
        </div>
      </header>

      <section className="cli-section">
        <h2><Building2 size={16} /> Identidade da empresa</h2>
        <div className="cfg-drops">
          <ZonaArrasto rotulo="Logótipo da empresa" dica="Arraste a imagem para aqui ou clique para escolher PNG, JPG ou WEBP até 2 MB. Este ficheiro substitui o logo do início de sessão e da barra lateral." imagem={empresa.logo} onImagem={setE("logo")} onErro={(texto) => setAviso({ erro: true, texto })} />
          <ZonaArrasto rotulo="Ícone do navegador" dica="Arraste ou clique para escolher o ícone do separador. Se ficar vazio, o sistema usa o logótipo." imagem={empresa.favicon} onImagem={setE("favicon")} onErro={(texto) => setAviso({ erro: true, texto })} />
        </div>
        <div className="cli-grid">
          <Campo icon={Building2} label="Nome no navegador"><input value={empresa.nome_sistema} onChange={(e) => setE("nome_sistema")(e.target.value)} maxLength={80} /></Campo>
          <Campo icon={Building2} label="Nome da empresa"><input value={empresa.nome_empresa} onChange={(e) => setE("nome_empresa")(e.target.value)} maxLength={200} /></Campo>
          <Campo icon={Building2} label="Endereço"><input value={empresa.endereco_empresa} onChange={(e) => setE("endereco_empresa")(e.target.value)} /></Campo>
          <Campo icon={Phone} label="Telefone"><input value={empresa.telefone_empresa} onChange={(e) => setE("telefone_empresa")(e.target.value)} /></Campo>
          <Campo icon={Mail} label="Email"><input type="email" value={empresa.email_empresa} onChange={(e) => setE("email_empresa")(e.target.value)} /></Campo>
          <Campo icon={BadgeCheck} label="NUIT"><input value={empresa.nuit_empresa} onChange={(e) => setE("nuit_empresa")(e.target.value)} /></Campo>
          <Campo icon={BadgeCheck} label="Moeda"><MenuSuspenso valor={empresa.moeda_padrao} onChange={setE("moeda_padrao")} opcoes={["MZN", "USD", "ZAR"].map((id) => ({ id, label: id }))} /></Campo>
          <Campo icon={BadgeCheck} label="Idioma"><MenuSuspenso valor={empresa.idioma_padrao} onChange={setE("idioma_padrao")} opcoes={[{ id: "pt", label: "Português" }, { id: "en", label: "Inglês" }]} /></Campo>
          <Campo icon={BadgeCheck} label="Fuso horário"><MenuSuspenso valor={empresa.fuso_horario} onChange={setE("fuso_horario")} opcoes={[{ id: "Africa/Maputo", label: "Africa/Maputo" }]} /></Campo>
          <Campo icon={BadgeCheck} label="Formato de data"><MenuSuspenso valor={empresa.formato_data} onChange={setE("formato_data")} opcoes={["DD/MM/YYYY", "MM/DD/YYYY"].map((id) => ({ id, label: id }))} /></Campo>
        </div>
        <div className="cli-top-actions" style={{ marginTop: 16 }}>
          <button type="button" className="cli-btn-novo" onClick={guardarIdentidade}><Save size={16} /> Guardar identidade</button>
        </div>
      </section>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigIdentidade;
