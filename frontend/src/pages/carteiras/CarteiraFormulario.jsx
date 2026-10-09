import { useContext, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Landmark, Save, Wallet } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import { lerFicheiro, opcoesDe, soMontante } from "../comum/utilModulo";
import { ICONES_TIPO, LOGOS_CARTEIRAS, logoSugerido } from "../emprestimos/logosCarteiras";
import LogoCarteira from "../emprestimos/LogoCarteira";
import { CAMINHO_CAR, CORES_TIPO_CARTEIRA } from "./iconesCarteira";
import { ESTADOS_CARTEIRA_FORM, formatarIban, guardarCarteira, MOEDAS, obterCarteira, podeEditarSaldoInicial, TIPOS_CARTEIRA, validarCarteira } from "../../services/carteirasMicrocredito";
import { utilizadoresConhecidos } from "../../services/cobrancasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Carteiras.css";

const vazio = {
  nome: "", codigo: "", tipo: "Caixa", descricao: "", numero_conta: "", iban: "", titular: "", agencia: "",
  saldo_inicial: "0", limite_minimo: "", limite_maximo: "", saldo_bloqueado: "0", moeda: "MZN",
  responsavel: "", status: "Ativa", observacoes: "", logo: "", logo_ficheiro: "",
};

const LOGO_TIPO = { Mpesa: LOGOS_CARTEIRAS.mpesa, "E-Mola": LOGOS_CARTEIRAS.emola };

const CarteiraFormulario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const actual = id ? obterCarteira(id) : null;
  const [form, setForm] = useState(() => (actual ? {
    ...vazio, ...actual,
    saldo_inicial: String(actual.saldo_inicial ?? 0),
    limite_minimo: actual.limite_minimo ?? "",
    limite_maximo: actual.limite_maximo ?? "",
    saldo_bloqueado: actual.saldo_bloqueado ?? 0,
  } : vazio));
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));
  const pessoas = useMemo(() => utilizadoresConhecidos(usuario), [usuario]);
  const podeInicial = podeEditarSaldoInicial(actual);

  const salvar = (e) => {
    e.preventDefault();
    const dados = { ...form, id: actual?.id, logo: form.logo || logoSugerido(form.nome, form.tipo) };
    const falhas = validarCarteira(dados);
    setErros(falhas);
    if (Object.keys(falhas).length) return setAviso({ erro: true, texto: "Reveja os campos assinalados." });
    try {
      const carteira = guardarCarteira(dados, usuario);
      navigate(`${CAMINHO_CAR}/${carteira.id}`);
    } catch (erro) {
      setAviso({ erro: true, texto: erro.message });
    }
  };

  if (id && !actual) {
    return (
      <div className="cli-page">
        <span className="cli-pill">Carteira não encontrada</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_CAR}/gestao`)}><ArrowLeft size={16} /> Voltar</button>
      </div>
    );
  }

  return (
    <form className="cli-page cli-form-entrada" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Wallet size={16} /> {actual ? "Editar carteira" : "Nova carteira"}</span>
        </div>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_CAR}/gestao`)}><ArrowLeft size={16} /> Voltar</button>
      </header>

      <section className="cli-section">
        <h2><Wallet size={18} /> Informações básicas</h2>
        <Campo label="Tipo *" erro={erros.tipo} full>
          <div className="car-tipo-grelha">
            {TIPOS_CARTEIRA.map((tipo) => {
              const Icone = ICONES_TIPO[tipo] || Wallet;
              const img = LOGO_TIPO[tipo];
              return (
                <button key={tipo} type="button" className={`car-tipo${form.tipo === tipo ? " is-activo" : ""}`} style={{ "--tipo-cor": CORES_TIPO_CARTEIRA[tipo] }} onClick={() => setForm((a) => ({ ...a, tipo, logo: logoSugerido(a.nome, tipo) }))}>
                  {img ? <span className="car-tipo-logo"><img src={img} alt={tipo} /></span> : <span><Icone size={22} /></span>}
                  {tipo}
                </button>
              );
            })}
          </div>
        </Campo>
        <Campo label="Logotipo da carteira" full>
          <label className="car-logo-caixa">
            <span className="car-logo-preview">
              {form.logo_ficheiro || LOGOS_CARTEIRAS[form.logo] ? (
                <LogoCarteira carteira={form} />
              ) : (
                <em><Camera size={22} /></em>
              )}
              <span>
                <strong>Carregar logotipo</strong>
                <small>JPG, PNG ou WEBP até 5MB. Opcional.</small>
              </span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) return setAviso({ erro: true, texto: "O logotipo não pode exceder 5MB." });
                const lido = await lerFicheiro(f);
                set("logo_ficheiro", lido.conteudo);
              }}
            />
          </label>
        </Campo>
        <div className="cli-grid">
          <Campo label="Nome da carteira *" erro={erros.nome}>
            <input value={form.nome} onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value, logo: logoSugerido(e.target.value, a.tipo) }))} placeholder="Ex: Caixa Principal" />
          </Campo>
          <Campo label="Código *" erro={erros.codigo}>
            <input value={form.codigo} onChange={(e) => set("codigo", e.target.value.toUpperCase())} placeholder="CAIXA" />
          </Campo>
          <Campo label="Moeda *" erro={erros.moeda}>
            <MenuSuspenso valor={form.moeda} opcoes={MOEDAS.map((m) => ({ id: m, label: m }))} onChange={(v) => set("moeda", v)} />
          </Campo>
          <Campo label="Descrição" full erro={erros.descricao}>
            <textarea rows={2} maxLength={5000} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
          </Campo>
        </div>
      </section>

      {form.tipo === "Banco" ? (
        <section className="cli-section">
          <h2><Landmark size={18} /> Dados bancários</h2>
          <div className="cli-grid">
            <Campo label="Número da conta *" erro={erros.numero_conta}><input value={form.numero_conta} onChange={(e) => set("numero_conta", e.target.value)} /></Campo>
            <Campo label="IBAN *" erro={erros.iban}><input value={form.iban} onChange={(e) => set("iban", formatarIban(e.target.value))} placeholder="MZ00 0000 0000 0000 0000 0000 0" /></Campo>
            <Campo label="Titular *" erro={erros.titular}><input value={form.titular} onChange={(e) => set("titular", e.target.value)} /></Campo>
            <Campo label="Agência"><input value={form.agencia} onChange={(e) => set("agencia", e.target.value)} /></Campo>
          </div>
        </section>
      ) : null}

      <section className="cli-section">
        <h2>Saldos</h2>
        <div className="cli-grid">
          <Campo label="Saldo inicial (MT) *" erro={erros.saldo_inicial}>
            <input value={form.saldo_inicial} disabled={!podeInicial} onChange={(e) => set("saldo_inicial", soMontante(e.target.value))} />
            {!podeInicial ? <small>O saldo inicial deixa de ser editável depois do primeiro movimento.</small> : null}
          </Campo>
          <Campo label="Limite mínimo (MT)" erro={erros.limite_minimo}><input value={form.limite_minimo} onChange={(e) => set("limite_minimo", soMontante(e.target.value))} /></Campo>
          <Campo label="Limite máximo (MT)" erro={erros.limite_maximo}><input value={form.limite_maximo} onChange={(e) => set("limite_maximo", soMontante(e.target.value))} /></Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2>Responsável</h2>
        <div className="cli-grid">
          <Campo label="Responsável">
            <MenuSuspenso valor={form.responsavel} pesquisavel opcoes={opcoesDe(pessoas, "Seleccione")} onChange={(v) => set("responsavel", v)} />
          </Campo>
          <Campo label="Estado *" erro={erros.status}>
            <MenuSuspenso valor={form.status} opcoes={ESTADOS_CARTEIRA_FORM.map((s) => ({ id: s, label: s }))} onChange={(v) => set("status", v)} />
          </Campo>
          <Campo label="Observações" full erro={erros.observacoes}>
            <textarea rows={3} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </Campo>
        </div>
      </section>

      <div className="mod-form-acoes">
        <button type="submit" className="cli-btn-novo"><Save size={16} /> {actual ? "Guardar alterações" : "Criar carteira"}</button>
        <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_CAR}/gestao`)}>Cancelar</button>
      </div>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </form>
  );
};

export default CarteiraFormulario;
