import { useContext, useMemo, useState } from "react";
import { ArrowLeftRight, BadgeCheck, CalendarDays, CircleDollarSign, FileText, Plus, Scale, Search, Undo2, Wallet } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import LogoCarteira from "../emprestimos/LogoCarteira";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Abas, Campo, Filtro, Kpi, MensagemModal, ModalFormulario, Paginacao, Vazio } from "../comum/ElementosModulo";
import { dataHoraCurta, lerFicheiro, paginar, soMontante, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipMovimento, ChipTransacao, ChipTransferencia, ChipValor } from "./ChipsCarteira";
import {
  CATEGORIAS_DESPESA, estornarTransacao, estornarTransferencia, listarMovimentos, listarTransacoes,
  listarTransferencias, motivoSemEstorno, podeEstornarTransacao, REGRAS_CARTEIRA, registarTransacao, resumoCarteiras,
  SUBTIPOS_MANUAIS, TIPOS_TRANSACAO,
} from "../../services/carteirasMicrocredito";
import { formatarMT, listarCarteiras, saldoDisponivel } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Carteiras.css";

const POR = 12;

const CarteirasMovimentos = () => {
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [aba, setAba] = useState("movimentos");
  const [busca, setBusca] = useState("");
  const [carteiraId, setCarteiraId] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [formAberto, setFormAberto] = useState(null);
  const [estorno, setEstorno] = useState(null);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const carteiras = useMemo(() => Object.fromEntries(listarCarteiras().map((c) => [String(c.id), c])), [versao]);
  const resumo = useMemo(() => resumoCarteiras(), [versao]);
  const movimentos = useMemo(() => listarMovimentos(carteiraId || null), [versao, carteiraId]);
  const transacoes = useMemo(() => listarTransacoes().filter((t) => !carteiraId || String(t.wallet_id) === String(carteiraId)), [versao, carteiraId]);
  const transferencias = useMemo(() => listarTransferencias().filter((t) => !carteiraId || [String(t.wallet_origem_id), String(t.wallet_destino_id)].includes(String(carteiraId))), [versao, carteiraId]);

  const fonte = aba === "transferencias" ? transferencias : aba === "transacoes" ? transacoes : movimentos;
  const visiveis = fonte.filter((x) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return [x.descricao, x.codigo_transacao, x.codigo_transferencia, x.categoria, x.referencia].join(" ").toLowerCase().includes(q);
  });
  const page = paginar(visiveis, pagina, POR);

  const correrEstorno = (motivo) => {
    try {
      if (estorno.transfer_id || estorno.codigo_transferencia) estornarTransferencia(estorno.transfer_id || estorno.id, motivo, usuario);
      else estornarTransacao(estorno.id, motivo, usuario);
      setEstorno(null);
      setVersao((v) => v + 1);
      setAviso({ texto: "Estorno registado." });
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><ArrowLeftRight size={16} /> Movimentos e transferências</span>
        </div>
        <button type="button" className="cli-btn-novo" onClick={() => setFormAberto({ tipo: "Entrada", subtipo: "Depósito", wallet_id: carteiraId, valor: "", descricao: "", data: hojeIso(), categoria: "", referencia: "", wallet_destino_id: "", taxa: "", observacoes: "", comprovativo: null })}><Plus size={16} /> Nova transacção</button>
      </header>

      <div className="pag-kpis">
        <Kpi icone={Wallet} rotulo="Saldo total" valor={formatarMT(resumo.saldoTotal)} detalhe="carteiras activas" />
        <Kpi icone={Wallet} rotulo="Entradas do mês" valor={formatarMT(resumo.mes.entradas)} detalhe="créditos" tom="is-azul" atraso={60} />
        <Kpi icone={Wallet} rotulo="Saídas do mês" valor={formatarMT(resumo.mes.saidas)} detalhe="débitos" tom="is-vermelho" atraso={120} />
        <Kpi icone={Wallet} rotulo="Fluxo do mês" valor={formatarMT(resumo.mes.fluxo)} detalhe={`${resumo.mes.total} movimentos`} atraso={180} />
      </div>

      <Abas activa={aba} onMudar={(id) => { setAba(id); setPagina(1); }} abas={[
        { id: "movimentos", rotulo: "Extrato", icone: Wallet, contagem: movimentos.length },
        { id: "transacoes", rotulo: "Transacções", icone: ArrowLeftRight, contagem: transacoes.length },
        { id: "transferencias", rotulo: "Transferências", icone: ArrowLeftRight, contagem: transferencias.length },
      ]} />

      <section className="cli-filtros">
        <label className="cli-busca"><Search size={16} /><input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar descrição ou código" /></label>
        <Filtro icone={Wallet} rotulo="Carteira" valor={carteiraId} aberto={menu === "carteira"} onToggle={() => setMenu(menu === "carteira" ? null : "carteira")} opcoes={[{ id: "", label: "Todas" }, ...Object.values(carteiras).map((c) => ({ id: String(c.id), label: c.nome }))]} onEscolher={(v) => { setCarteiraId(v); setPagina(1); setMenu(null); }} />
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><CalendarDays size={14} /> Data</span></th>
              <th><span className="cli-th"><Wallet size={14} /> Carteira</span></th>
              <th><span className="cli-th"><ArrowLeftRight size={14} /> Tipo</span></th>
              <th><span className="cli-th"><FileText size={14} /> Descrição</span></th>
              <th><span className="cli-th"><CircleDollarSign size={14} /> Valor</span></th>
              {aba === "movimentos" ? <th><span className="cli-th"><Scale size={14} /> Saldo</span></th> : <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>}
              {aba !== "movimentos" ? <th><span className="cli-th"><Undo2 size={14} /> Acções</span></th> : null}
            </tr>
          </thead>
          <tbody>
            {page.itens.length === 0 ? (
              <tr className="cli-empty"><td colSpan={7}><Vazio icone={Wallet} titulo="Sem movimentos neste filtro." /></td></tr>
            ) : page.itens.map((x, i) => {
              const cart = carteiras[String(x.wallet_id || x.wallet_origem_id)];
              return (
                <tr key={x.id} style={{ animationDelay: `${i * 25}ms` }}>
                  <td>{dataHoraCurta(x.data_movimento || x.data_transacao || x.data_transferencia)}</td>
                  <td>
                    <span className="pag-cliente-celula">
                      {cart ? <LogoCarteira carteira={cart} /> : null}
                      <span>{cart?.nome || "—"}{x.wallet_destino_id ? ` → ${carteiras[String(x.wallet_destino_id)]?.nome || ""}` : ""}</span>
                    </span>
                  </td>
                  <td><ChipMovimento tipo={x.tipo_movimento || x.tipo} /></td>
                  <td>{x.descricao}{x.codigo_transacao ? ` · ${x.codigo_transacao}` : ""}{x.codigo_transferencia ? ` · ${x.codigo_transferencia}` : ""}</td>
                  <td className={`car-linha-sinal ${(x.sinal ?? (x.tipo === "Entrada" ? 1 : -1)) > 0 ? "is-entrada" : "is-saida"}`}>
                    {(x.sinal ?? (x.tipo === "Entrada" ? 1 : -1)) > 0 ? "+" : "−"}{formatarMT(x.valor)}
                  </td>
                  {aba === "movimentos" ? <td><ChipValor valor={x.saldo_posterior} tom="is-cinza" /></td> : <td>{x.codigo_transferencia ? <ChipTransferencia estado={x.status} /> : <ChipTransacao estado={x.status} />}</td>}
                  {aba !== "movimentos" ? (
                    <td>
                      {(x.codigo_transferencia && x.status === "Concluída") || podeEstornarTransacao(x) ? (
                        <button type="button" className="cli-btn ghost" onClick={() => setEstorno(x)}><Undo2 size={14} /> Estornar</button>
                      ) : x.codigo_transacao && motivoSemEstorno(x) ? null : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Paginacao inicio={page.inicio} porPagina={POR} total={visiveis.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />

      {formAberto ? <FormTransacao form={formAberto} setForm={setFormAberto} carteiras={Object.values(carteiras)} onFechar={() => setFormAberto(null)} onOk={(dados) => {
        try {
          const t = registarTransacao(dados, usuario);
          setFormAberto(null);
          setVersao((v) => v + 1);
          setAviso({ texto: `Transacção ${t.codigo_transacao} registada com sucesso!` });
        } catch (e) { setAviso({ erro: true, texto: e.message }); }
      }} /> : null}

      {estorno ? (
        <ModalFormulario icone={Undo2} titulo="Estornar" onFechar={() => setEstorno(null)} accoes={<><button type="button" className="cli-btn ghost" onClick={() => setEstorno(null)}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => { const m = document.getElementById("car-motivo-estorno")?.value || ""; correrEstorno(m); }}>Confirmar</button></>}>
          <Campo label="Justificação"><textarea id="car-motivo-estorno" rows={3} placeholder="Mínimo 5 caracteres" /></Campo>
        </ModalFormulario>
      ) : null}
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

const FormTransacao = ({ form, setForm, carteiras, onFechar, onOk }) => {
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));
  const origem = carteiras.find((c) => String(c.id) === String(form.wallet_id));
  const subtipos = SUBTIPOS_MANUAIS[form.tipo] || [];
  return (
    <ModalFormulario icone={Wallet} titulo="Nova transacção" largura={720} onFechar={onFechar} accoes={<><button type="button" className="cli-btn ghost" onClick={onFechar}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => onOk(form)}>Registar transacção</button></>}>
      <div className="cli-grid">
        <Campo label="Carteira *">
          <MenuSuspenso valor={String(form.wallet_id || "")} opcoes={[{ id: "", label: "Seleccione" }, ...carteiras.filter((c) => c.status === "Ativa").map((c) => ({ id: String(c.id), label: `${c.nome} · ${formatarMT(c.saldo)}` }))]} onChange={(v) => set("wallet_id", v)} />
        </Campo>
        <Campo label="Saldo actual"><input readOnly value={origem ? formatarMT(saldoDisponivel(origem)) : "—"} /></Campo>
        <Campo label="Tipo *">
          <MenuSuspenso valor={form.tipo} opcoes={TIPOS_TRANSACAO.map((t) => ({ id: t, label: t }))} onChange={(v) => setForm((a) => ({ ...a, tipo: v, subtipo: (SUBTIPOS_MANUAIS[v] || [])[0] || "" }))} />
        </Campo>
        <Campo label="Subtipo *">
          <MenuSuspenso valor={form.subtipo} opcoes={subtipos.map((s) => ({ id: s, label: s }))} onChange={(v) => set("subtipo", v)} />
        </Campo>
        <Campo label="Valor (MT) *"><input value={form.valor} onChange={(e) => set("valor", soMontante(e.target.value))} /></Campo>
        {form.tipo === "Transferência" ? (
          <>
            <Campo label="Carteira destino *">
              <MenuSuspenso valor={String(form.wallet_destino_id || "")} opcoes={[{ id: "", label: "Seleccione" }, ...carteiras.filter((c) => c.status === "Ativa" && String(c.id) !== String(form.wallet_id)).map((c) => ({ id: String(c.id), label: c.nome }))]} onChange={(v) => set("wallet_destino_id", v)} />
            </Campo>
            <Campo label="Taxa"><input value={form.taxa} onChange={(e) => set("taxa", soMontante(e.target.value))} /></Campo>
          </>
        ) : null}
        {form.subtipo === "Despesa" ? (
          <Campo label="Categoria *"><MenuSuspenso valor={form.categoria} opcoes={CATEGORIAS_DESPESA.map((c) => ({ id: c, label: c }))} onChange={(v) => set("categoria", v)} /></Campo>
        ) : null}
        <Campo label="Data *"><input type="date" max={hojeIso()} value={form.data} onChange={(e) => set("data", e.target.value)} /></Campo>
        <Campo label="Referência"><input value={form.referencia} onChange={(e) => set("referencia", e.target.value)} /></Campo>
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

export default CarteirasMovimentos;
