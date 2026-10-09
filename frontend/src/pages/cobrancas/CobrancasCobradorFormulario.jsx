import { useContext, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import { opcoesDe, soMontante, soTelefone } from "../comum/utilModulo";
import { CAMINHO_COB } from "./iconesCobranca";
import { ESTADOS_COBRADOR, guardarCobrador, listarZonas, obterCobrador, utilizadoresConhecidos, validarCobrador } from "../../services/cobrancasMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import { REGRAS } from "../../services/emprestimosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const vazio = {
  utilizador: "", nome_completo: "", documento: "", telefone_principal: "", telefone_alternativo: "", email: "",
  zona_id: "", meta_mensal: "", comissao_percentual: "", status: "Ativo", data_admissao: hojeIso(), observacoes: "",
};

const CobrancasCobradorFormulario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const actual = id ? obterCobrador(id) : null;
  const [form, setForm] = useState(() => (actual ? { ...vazio, ...actual, zona_id: String(actual.zona_id || ""), meta_mensal: actual.meta_mensal ?? "", comissao_percentual: actual.comissao_percentual ?? "" } : { ...vazio, utilizador: usuario?.nome || "", meta_mensal: String(REGRAS.metaMensal), comissao_percentual: String(REGRAS.comissaoCobrador) }));
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));
  const zonas = useMemo(() => listarZonas(), []);
  const pessoas = useMemo(() => utilizadoresConhecidos(usuario), [usuario]);

  const salvar = (e) => {
    e.preventDefault();
    const falhas = validarCobrador({ ...form, id: actual?.id });
    setErros(falhas);
    if (Object.keys(falhas).length) return setAviso({ erro: true, texto: "Reveja os campos assinalados." });
    try {
      const cobrador = guardarCobrador({ ...form, id: actual?.id }, usuario);
      navigate(`${CAMINHO_COB}/cobradores`, { replace: true });
      setAviso({ texto: `${cobrador.nome_completo} ${actual ? "actualizado" : "registado"} com sucesso.` });
    } catch (erro) {
      setAviso({ erro: true, texto: erro.message });
    }
  };

  if (id && !actual) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><UserRound size={16} /> Cobrador não encontrado</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/cobradores`)}><ArrowLeft size={16} /> Voltar</button>
      </div>
    );
  }

  return (
    <form className="cli-page cli-form-entrada" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><UserRound size={16} /> {actual ? "Editar cobrador" : "Novo cobrador"}</span>
        </div>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/cobradores`)}><ArrowLeft size={16} /> Voltar</button>
      </header>

      <section className="cli-section">
        <h2><UserRound size={18} /> Dados do cobrador</h2>
        <div className="cli-grid">
          <Campo label="Utilizador de acesso *" erro={erros.utilizador}>
            <MenuSuspenso valor={form.utilizador} pesquisavel opcoes={opcoesDe(pessoas.length ? pessoas : [usuario?.nome].filter(Boolean), "Seleccione")} onChange={(v) => set("utilizador", v)} />
          </Campo>
          <Campo label="Nome completo *" erro={erros.nome_completo}>
            <input value={form.nome_completo} onChange={(e) => set("nome_completo", e.target.value)} placeholder="Nome do cobrador" />
          </Campo>
          <Campo label="Documento *" erro={erros.documento}>
            <input value={form.documento} onChange={(e) => set("documento", e.target.value.toUpperCase())} placeholder="Número do documento" />
          </Campo>
          <Campo label="Telefone principal *" erro={erros.telefone_principal}>
            <input value={form.telefone_principal} onChange={(e) => set("telefone_principal", soTelefone(e.target.value))} placeholder="84xxxxxxx" />
          </Campo>
          <Campo label="Telefone alternativo" erro={erros.telefone_alternativo}>
            <input value={form.telefone_alternativo} onChange={(e) => set("telefone_alternativo", soTelefone(e.target.value))} placeholder="Opcional" />
          </Campo>
          <Campo label="Email" erro={erros.email}>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@dominio.com" />
          </Campo>
          <Campo label="Zona / território *" erro={erros.zona_id}>
            <MenuSuspenso valor={form.zona_id} pesquisavel opcoes={[{ id: "", label: "Seleccione" }, ...zonas.map((z) => ({ id: String(z.id), label: `${z.nome} · ${z.codigo}` }))]} onChange={(v) => set("zona_id", v)} />
          </Campo>
          <Campo label="Meta mensal (MT)" erro={erros.meta_mensal}>
            <input value={form.meta_mensal} onChange={(e) => set("meta_mensal", soMontante(e.target.value))} placeholder="0,00" />
          </Campo>
          <Campo label="Comissão (%)" erro={erros.comissao_percentual}>
            <input value={form.comissao_percentual} onChange={(e) => set("comissao_percentual", soMontante(e.target.value))} placeholder="0" />
          </Campo>
          <Campo label="Data de admissão" erro={erros.data_admissao}>
            <input type="date" value={form.data_admissao || ""} onChange={(e) => set("data_admissao", e.target.value)} />
          </Campo>
          <Campo label="Estado *" erro={erros.status}>
            <MenuSuspenso valor={form.status} opcoes={ESTADOS_COBRADOR.map((s) => ({ id: s, label: s }))} onChange={(v) => set("status", v)} />
          </Campo>
          <Campo label="Observações" full erro={erros.observacoes}>
            <textarea rows={3} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </Campo>
        </div>
      </section>
      <div className="mod-form-acoes">
        <button type="submit" className="cli-btn-novo"><Save size={16} /> {actual ? "Guardar alterações" : "Registar cobrador"}</button>
        <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/cobradores`)}>Cancelar</button>
      </div>
      <MensagemModal aviso={aviso} onFechar={() => { if (!aviso?.erro) navigate(`${CAMINHO_COB}/cobradores`); else setAviso(null); }} />
    </form>
  );
};

export default CobrancasCobradorFormulario;
