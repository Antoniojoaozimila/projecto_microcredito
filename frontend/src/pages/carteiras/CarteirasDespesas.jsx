import { useContext, useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, CheckCircle2, CircleDollarSign, Eye, FileText, Hash, Plus, Receipt, Search, Tag, Trash2, Wallet, XCircle } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import MenuSuspenso from "../clientes/MenuSuspenso";
import LogoCarteira from "../emprestimos/LogoCarteira";
import { Campo, Filtro, Kpi, MensagemModal, ModalFormulario, Paginacao, Vazio } from "../comum/ElementosModulo";
import { lerFicheiro, paginar, soMontante, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipDespesa, ChipValor } from "./ChipsCarteira";
import {
  aprovarDespesa, cancelarDespesa, CATEGORIAS_DESPESA, eGestor, eliminarDespesa, ESTADOS_DESPESA, listarDespesas,
  pagarDespesa, REGRAS_CARTEIRA, registarDespesa, rejeitarDespesa, resumoDespesas,
} from "../../services/carteirasMicrocredito";
import { formatarData, formatarMT, listarCarteiras, saldoDisponivel } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Carteiras.css";

const POR = 10;

const CarteirasDespesas = () => {
  const { usuario } = useContext(AuthContext);
  const gestor = eGestor(usuario);
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [form, setForm] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const carteiras = useMemo(() => Object.fromEntries(listarCarteiras().map((c) => [String(c.id), c])), [versao]);
  const lista = useMemo(() => listarDespesas(), [versao]);
  const resumo = useMemo(() => resumoDespesas(), [versao]);
  const visiveis = lista.filter((d) => {
    if (estado && d.status !== estado) return false;
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return [d.codigo_despesa, d.descricao, d.categoria, d.fornecedor, carteiras[String(d.wallet_id)]?.nome].join(" ").toLowerCase().includes(q);
  });
  const page = paginar(visiveis, pagina, POR);

  const correr = (fn, ok) => {
    try {
      fn();
      setMotivo(null);
      setVersao((v) => v + 1);
      if (ok) setAviso({ texto: ok });
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Receipt size={16} /> Despesas</span>
          <span className="cli-pill">{lista.length} despesa{lista.length === 1 ? "" : "s"}</span>
        </div>
        <button type="button" className="cli-btn-novo" onClick={() => setForm({ wallet_id: "", categoria: "", descricao: "", valor: "", data_despesa: hojeIso(), fornecedor: "", numero_factura: "", observacoes: "", comprovativo: null, pagar_agora: true })}><Plus size={16} /> Nova despesa</button>
      </header>

      <div className="pag-kpis">
        <Kpi icone={Receipt} rotulo="Pagas no mês" valor={formatarMT(resumo.pagoMes)} detalhe={`${resumo.pagasMes} lançamentos`} />
        <Kpi icone={Receipt} rotulo="Pendentes" valor={resumo.pendentes} detalhe="aguardam pagamento" tom="is-amarelo" atraso={60} />
        <Kpi icone={Receipt} rotulo="Aprovação" valor={resumo.aguardamAprovacao} detalhe={`acima de ${formatarMT(REGRAS_CARTEIRA.aprovacaoAcima)}`} tom="is-laranja" atraso={120} />
        <Kpi icone={Receipt} rotulo="Aprovadas" valor={resumo.aprovadas} detalhe="prontas a pagar" tom="is-azul" atraso={180} />
      </div>

      <section className="cli-filtros">
        <label className="cli-busca"><Search size={16} /><input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar código, descrição ou fornecedor" /></label>
        <Filtro icone={Receipt} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_DESPESA.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><Hash size={14} /> Código</span></th>
              <th><span className="cli-th"><CalendarDays size={14} /> Data</span></th>
              <th><span className="cli-th"><Wallet size={14} /> Carteira</span></th>
              <th><span className="cli-th"><Tag size={14} /> Categoria</span></th>
              <th><span className="cli-th"><FileText size={14} /> Descrição</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody>
            {page.itens.length === 0 ? (
              <tr className="cli-empty"><td colSpan={8}><Vazio icone={Receipt} titulo="Ainda não há despesas." /></td></tr>
            ) : page.itens.map((d, i) => {
              const c = carteiras[String(d.wallet_id)];
              return (
                <tr key={d.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <td><strong>{d.codigo_despesa}</strong></td>
                  <td>{formatarData(d.data_despesa)}</td>
                  <td><span className="pag-cliente-celula">{c ? <LogoCarteira carteira={c} /> : null}<span>{c?.nome || "—"}</span></span></td>
                  <td><span className="cli-chip is-cinza">{d.categoria}</span></td>
                  <td>{d.descricao}</td>
                  <td><ChipValor valor={d.valor} tom="is-vermelho" /></td>
                  <td><ChipDespesa estado={d.status} /></td>
                  <td>
                    <span className="pag-accoes">
                      {d.status === "Pendente" && d.exige_aprovacao && gestor ? <button type="button" title="Aprovar" onClick={() => correr(() => aprovarDespesa(d.id, usuario), `${d.codigo_despesa} aprovada.`)}><CheckCircle2 size={15} /></button> : null}
                      {d.status === "Pendente" && d.exige_aprovacao && gestor ? <button type="button" title="Rejeitar" onClick={() => setMotivo({ tipo: "rejeitar", d })}><XCircle size={15} /></button> : null}
                      {["Pendente", "Aprovada"].includes(d.status) && (!d.exige_aprovacao || d.status === "Aprovada") ? <button type="button" title="Pagar" onClick={() => correr(() => pagarDespesa(d.id, usuario), `${d.codigo_despesa} paga.`)}>Pagar</button> : null}
                      {["Pendente", "Aprovada", "Paga"].includes(d.status) ? <button type="button" title="Cancelar" onClick={() => setMotivo({ tipo: "cancelar", d })}><XCircle size={15} /></button> : null}
                      {d.status !== "Paga" ? <button type="button" className="is-perigo" title="Eliminar" onClick={() => setAEliminar(d)}><Trash2 size={15} /></button> : null}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Paginacao inicio={page.inicio} porPagina={POR} total={visiveis.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />

      {form ? <FormDespesa form={form} setForm={setForm} carteiras={Object.values(carteiras)} onFechar={() => setForm(null)} onOk={(dados) => {
        try {
          const d = registarDespesa(dados, usuario);
          setForm(null);
          setVersao((v) => v + 1);
          setAviso({ texto: `Despesa ${d.codigo_despesa} registada com sucesso!` });
        } catch (e) { setAviso({ erro: true, texto: e.message }); }
      }} /> : null}

      {motivo ? (
        <ModalFormulario icone={XCircle} titulo={motivo.tipo === "rejeitar" ? "Rejeitar despesa" : "Cancelar despesa"} onFechar={() => setMotivo(null)} accoes={<><button type="button" className="cli-btn ghost" onClick={() => setMotivo(null)}>Voltar</button><button type="button" className="cli-btn-novo" onClick={() => {
          const texto = document.getElementById("car-motivo-despesa")?.value || "";
          correr(() => (motivo.tipo === "rejeitar" ? rejeitarDespesa(motivo.d.id, texto, usuario) : cancelarDespesa(motivo.d.id, texto, usuario)), "Operação concluída.");
        }}>Confirmar</button></>}>
          <Campo label="Motivo"><textarea id="car-motivo-despesa" rows={3} placeholder="Mínimo 5 caracteres" /></Campo>
        </ModalFormulario>
      ) : null}

      {aEliminar ? (
        <ConfirmarEliminar titulo="Eliminar despesa" nome={aEliminar.codigo_despesa} aviso="A despesa será removida do histórico." onCancelar={() => setAEliminar(null)} onConfirmar={() => {
          try {
            eliminarDespesa(aEliminar.id);
            setAEliminar(null);
            setVersao((v) => v + 1);
            setAviso({ texto: `${aEliminar.codigo_despesa} eliminada.` });
          } catch (e) {
            setAEliminar(null);
            setAviso({ erro: true, texto: e.message });
          }
        }} />
      ) : null}
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

const FormDespesa = ({ form, setForm, carteiras, onFechar, onOk }) => {
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));
  const origem = carteiras.find((c) => String(c.id) === String(form.wallet_id));
  return (
    <ModalFormulario icone={Receipt} titulo="Nova despesa" largura={720} onFechar={onFechar} accoes={<><button type="button" className="cli-btn ghost" onClick={onFechar}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => onOk(form)}>Registar despesa</button></>}>
      <div className="cli-grid">
        <Campo label="Carteira *">
          <MenuSuspenso valor={String(form.wallet_id || "")} opcoes={[{ id: "", label: "Seleccione" }, ...carteiras.filter((c) => c.status === "Ativa").map((c) => ({ id: String(c.id), label: `${c.nome} · ${formatarMT(c.saldo)}` }))]} onChange={(v) => set("wallet_id", v)} />
        </Campo>
        <Campo label="Saldo actual"><input readOnly value={origem ? formatarMT(saldoDisponivel(origem)) : "—"} /></Campo>
        <Campo label="Categoria *"><MenuSuspenso valor={form.categoria} opcoes={[{ id: "", label: "Seleccione" }, ...CATEGORIAS_DESPESA.map((c) => ({ id: c, label: c }))]} onChange={(v) => set("categoria", v)} /></Campo>
        <Campo label="Valor (MT) *"><input value={form.valor} onChange={(e) => set("valor", soMontante(e.target.value))} /></Campo>
        <Campo label="Data *"><input type="date" max={hojeIso()} value={form.data_despesa} onChange={(e) => set("data_despesa", e.target.value)} /></Campo>
        <Campo label="Fornecedor"><input value={form.fornecedor} onChange={(e) => set("fornecedor", e.target.value)} /></Campo>
        <Campo label="Nº da factura"><input value={form.numero_factura} onChange={(e) => set("numero_factura", e.target.value)} /></Campo>
        <Campo label="Descrição *" full><textarea rows={2} maxLength={5000} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} /></Campo>
        <Campo label="Comprovativo (JPG, PNG ou PDF)" full>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > REGRAS_CARTEIRA.maxComprovativoMB * 1024 * 1024) return;
            set("comprovativo", await lerFicheiro(f));
          }} />
        </Campo>
        <Campo label="Observações" full><textarea rows={2} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Campo>
      </div>
    </ModalFormulario>
  );
};

export default CarteirasDespesas;
