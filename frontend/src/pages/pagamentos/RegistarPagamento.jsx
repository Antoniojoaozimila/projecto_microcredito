import { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, BadgeCheck, Banknote, CalendarClock, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, Clock, CreditCard, Download,
  Eye, FileCheck2, FileText, Gauge, Hash, History, IdCard, Info, Landmark, LayoutDashboard, ListOrdered, Loader2, Paperclip, Percent, Phone,
  PiggyBank, Printer, Receipt, ScrollText, Sparkles, Stamp, StickyNote, Tag, TrendingUp, Upload, User, Wallet, WalletCards, X,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import AvatarCliente from "../clientes/AvatarCliente";
import LogoCarteira from "../emprestimos/LogoCarteira";
import { ICONES_TIPO, LOGOS_CARTEIRAS } from "../emprestimos/logosCarteiras";
import PesquisaEmprestimo from "./PesquisaEmprestimo";
import { descarregarReciboPagamento, imprimirReciboPagamento } from "./reciboPagamento";
import { guardarLista } from "../../services/anexosLocais";
import { REGRAS, calcularMapaOperacao, classeEstado, formatarData, formatarMT, carteirasOperacionais } from "../../services/emprestimosMicrocredito";
import {
  FORMAS_PAGAMENTO, MAX_COMPROVATIVO_MB, TIPOS_PAGAMENTO, carteiraSugerida, dadosDoRecibo, dataMinimaPagamento, emprestimosParaPagamento,
  hojeIso, horaActual, registarPagamento, simularPagamento, sugerirTipo, validarPagamento,
} from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "./Pagamentos.css";

const inicial = (loanId = "") => ({
  loan_id: loanId,
  installment_id: "",
  valor_pago: "",
  data_pagamento: hojeIso(),
  hora_pagamento: horaActual(),
  forma_pagamento: "Dinheiro",
  referencia_transacao: "",
  carteira_id: "",
  tipo_pagamento: "",
  comprovativo: null,
  observacoes: "",
});

const soMontante = (valor) => {
  const limpo = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  return resto.length ? `${inteiro}.${resto.join("").slice(0, 2)}` : inteiro;
};

const FORMAS_VISUAIS = {
  Dinheiro: { icon: Banknote },
  "E-Mola": { logo: "emola" },
  Mpesa: { logo: "mpesa" },
  "Transferência Bancária": { icon: Landmark },
  Cheque: { icon: ScrollText },
};

const TIPOS_ACEITES = ["image/jpeg", "image/png", "application/pdf"];

const Campo = ({ icon: Icon, label, erro, children, full, extra }) => (
  <div className={`cli-field${full ? " full" : ""}`}>
    <label>{Icon ? <Icon size={15} /> : null}{label}{extra}</label>
    {children}
    {erro ? <small>{erro}</small> : null}
  </div>
);

const Dado = ({ icon: Icon, rotulo, valor, tom }) => (
  <div className={`pag-dado${tom ? ` is-${tom}` : ""}`}>
    <span className="pag-dado-icone"><Icon size={16} /></span>
    <span>
      <small>{rotulo}</small>
      <strong>{valor}</strong>
    </span>
  </div>
);

const LinhaResumo = ({ icon: Icon, rotulo, valor, destaque }) => (
  <li className={destaque ? "is-destaque" : ""}>
    <span><Icon size={15} /> {rotulo}</span>
    <strong>{valor}</strong>
  </li>
);

const RegistarPagamento = () => {
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const emprestimos = useMemo(() => (versao >= 0 ? emprestimosParaPagamento() : []), [versao]);
  const carteiras = useMemo(() => (versao >= 0 ? carteirasOperacionais() : []), [versao]);
  const [form, setForm] = useState(() => {
    const pedido = parametros.get("emprestimo") || "";
    return inicial(emprestimos.some((e) => String(e.id) === pedido) ? pedido : "");
  });
  const [tipoManual, setTipoManual] = useState(false);
  const [carteiraManual, setCarteiraManual] = useState(false);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState("");
  const [aGravar, setAGravar] = useState(false);
  const [registado, setRegistado] = useState(null);
  const [arrastar, setArrastar] = useState(false);

  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const emprestimo = emprestimos.find((e) => String(e.id) === String(form.loan_id));
  const cliente = emprestimo?.cliente;
  const mapa = emprestimo ? calcularMapaOperacao(emprestimo, form.data_pagamento || hojeIso()) : null;
  const valorNumero = Number(form.valor_pago) || 0;

  const tipoSugerido = emprestimo ? sugerirTipo(emprestimo, { installmentId: form.installment_id, valor: form.valor_pago, dataPagamento: form.data_pagamento }) : "Pagamento de Parcela";
  const tipo = tipoManual && form.tipo_pagamento ? form.tipo_pagamento : tipoSugerido;
  const simulacao = useMemo(
    () => (emprestimo ? simularPagamento(emprestimo, { installmentId: form.installment_id, valor: form.valor_pago, dataPagamento: form.data_pagamento, tipo }) : null),
    [emprestimo, form.installment_id, form.valor_pago, form.data_pagamento, tipo]
  );
  const resumo = simulacao?.resumo || emprestimo?.resumo || null;
  const parcelaAlvo = resumo ? (form.installment_id ? resumo.abertas.find((p) => String(p.id) === String(form.installment_id)) : resumo.proximo) : null;
  const sugerida = carteiraSugerida(form.forma_pagamento);
  const carteiraId = carteiraManual || !sugerida ? form.carteira_id : String(sugerida.id);
  const carteira = carteiras.find((c) => String(c.id) === String(carteiraId));
  const dados = { ...form, tipo_pagamento: tipo, carteira_id: carteiraId };

  const escolherEmprestimo = (id) => {
    const novo = emprestimos.find((e) => String(e.id) === String(id));
    setForm((atual) => ({ ...atual, loan_id: id, installment_id: "", valor_pago: novo?.resumo.proximo ? String(novo.resumo.proximo.total_devido) : "" }));
    setTipoManual(false);
    setErros({});
  };

  const escolherParcela = (id) => {
    const parcela = resumo?.abertas.find((p) => String(p.id) === String(id)) || resumo?.proximo;
    setForm((atual) => ({ ...atual, installment_id: id, valor_pago: parcela ? String(parcela.total_devido) : atual.valor_pago }));
    setTipoManual(false);
  };

  const anexar = (ficheiro) => {
    if (!ficheiro) return;
    if (!TIPOS_ACEITES.includes(ficheiro.type)) {
      setErros((e) => ({ ...e, comprovativo: "Formato inválido. Use JPG, PNG ou PDF." }));
      return;
    }
    if (ficheiro.size > MAX_COMPROVATIVO_MB * 1024 * 1024) {
      setErros((e) => ({ ...e, comprovativo: `O ficheiro excede ${MAX_COMPROVATIVO_MB}MB.` }));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      set("comprovativo", { nome: ficheiro.name, tipo: ficheiro.type, tamanho: ficheiro.size, conteudo: leitor.result });
      setErros((e) => ({ ...e, comprovativo: undefined }));
    };
    leitor.onerror = () => setErros((e) => ({ ...e, comprovativo: "Não foi possível ler o ficheiro." }));
    leitor.readAsDataURL(ficheiro);
  };

  const confirmar = async (evento) => {
    evento.preventDefault();
    if (aGravar) return;
    const falhas = validarPagamento(dados);
    setErros(falhas);
    if (Object.keys(falhas).length) {
      setAviso("Reveja os campos assinalados.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setAviso("");
    setAGravar(true);
    try {
      const [comprovativo] = form.comprovativo ? await guardarLista([form.comprovativo]) : [null];
      const pagamento = registarPagamento({ ...dados, comprovativo }, usuario);
      setRegistado(dadosDoRecibo(pagamento));
    } catch (erro) {
      setAviso(erro.message || "Não foi possível registar o pagamento.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setAGravar(false);
    }
  };

  const recibo = async (accao) => {
    try {
      await accao(registado);
    } catch {
      setAviso("Não foi possível gerar o recibo.");
    }
  };

  const novoPagamento = () => {
    setRegistado(null);
    setForm(inicial());
    setTipoManual(false);
    setCarteiraManual(false);
    setErros({});
    setVersao((v) => v + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressoDepois = simulacao && valorNumero > 0 ? simulacao.progressoDepois : resumo?.progresso || 0;
  const pag = registado?.pagamento;
  const quitado = pag?.estado_emprestimo_apos === "Quitado";

  return (
    <form className="cli-page" onSubmit={confirmar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><CreditCard size={16} /> Registar pagamento</span>
          <span className="cli-pill cli-pill-caminho">
            <LayoutDashboard size={16} /> Dashboard
            <ChevronRight size={14} />
            <CreditCard size={16} /> Pagamentos
            <ChevronRight size={14} />
            <Receipt size={16} /> Registar
          </span>
        </div>
      </header>
      {aviso ? <p className="cli-erro emp-aviso"><AlertTriangle size={15} /> {aviso}</p> : null}

      <div className="pag-layout">
        <div className="cli-form-entrada pag-principal">
          <section className="cli-section">
            <h2><FileText size={18} /> Empréstimo</h2>
            <div className="cli-grid">
              <Campo icon={FileText} label="Empréstimo *" erro={erros.loan_id} full>
                <PesquisaEmprestimo emprestimos={emprestimos} valor={form.loan_id} onChange={escolherEmprestimo} />
              </Campo>
            </div>
            {emprestimo ? (
              <div className="pag-dados">
                <Dado icon={Hash} rotulo="Nº Contrato" valor={emprestimo.numero_contrato} />
                <Dado icon={User} rotulo="Nome do Cliente" valor={cliente?.nome_completo || "—"} />
                <Dado icon={Wallet} rotulo="Valor Pendente" valor={formatarMT(resumo.saldo)} tom="verde" />
                <Dado icon={Gauge} rotulo="Score" valor={cliente ? `${cliente.score ?? "—"} · ${cliente.perfil_risco || "—"}` : "—"} />
              </div>
            ) : null}
            {mapa ? (
              <>
                <div className="pag-dados">
                  <Dado icon={Wallet} rotulo="Capital em risco" valor={formatarMT(mapa.capital)} />
                  <Dado icon={TrendingUp} rotulo="Juros" valor={formatarMT(mapa.juros)} />
                  <Dado icon={Percent} rotulo="Juro de mora diário" valor={formatarMT(mapa.moraDiaria)} />
                  <Dado icon={CalendarDays} rotulo="Dias vencidos" valor={String(mapa.diasVencidos)} />
                  <Dado icon={CircleDollarSign} rotulo="Saldo com juros de mora" valor={formatarMT(mapa.saldoComMora)} tom="verde" />
                </div>
                <div className="emp-linha-selo">
                  <span className="cli-info-icone"><Stamp size={17} /></span>
                  <span>
                    <small>Imposto de selo a pagar</small>
                    <strong>{formatarMT(mapa.impostoSelo)}</strong>
                  </span>
                  <em>Linha separada: {mapa.taxaSelo.toLocaleString("pt-PT")}% do saldo com juros de mora. Não entra nesse saldo nem no valor deste pagamento.</em>
                </div>
              </>
            ) : null}
          </section>

          {emprestimo ? (
            <section className="cli-section">
              <h2><ListOrdered size={18} /> Parcela</h2>
              <div className="cli-grid">
                <Campo icon={ListOrdered} label="Parcela específica" full>
                  <MenuSuspenso
                    valor={form.installment_id}
                    onChange={escolherParcela}
                    opcoes={[
                      { id: "", label: "Automático: aplicar às parcelas mais antigas" },
                      ...resumo.abertas.map((p) => ({
                        id: p.id,
                        label: `Parcela ${p.num_parcela}/${emprestimo.num_parcelas} · vence ${formatarData(p.data_vencimento)} · ${formatarMT(p.total_devido)}${p.dias_atraso ? ` · ${p.dias_atraso} dia(s) em atraso` : ""}`,
                      })),
                    ]}
                  />
                </Campo>
              </div>
              {parcelaAlvo ? (
                <div className="pag-dados pag-dados-5">
                  <Dado icon={Hash} rotulo="Nº" valor={`${parcelaAlvo.num_parcela}/${emprestimo.num_parcelas}`} />
                  <Dado icon={CalendarDays} rotulo="Vencimento" valor={formatarData(parcelaAlvo.data_vencimento)} />
                  <Dado icon={CircleDollarSign} rotulo="Valor" valor={formatarMT(parcelaAlvo.valor_parcela)} />
                  <Dado icon={Clock} rotulo="Dias em Atraso" valor={parcelaAlvo.dias_atraso} tom={parcelaAlvo.dias_atraso ? "vermelho" : ""} />
                  <Dado icon={AlertTriangle} rotulo="Multa" valor={formatarMT(parcelaAlvo.multa_pendente)} tom={parcelaAlvo.multa_pendente ? "vermelho" : ""} />
                </div>
              ) : null}
              {parcelaAlvo && Number(parcelaAlvo.valor_pago || 0) > 0 ? (
                <p className="emp-nota"><Info size={15} /> Esta parcela já tem {formatarMT(parcelaAlvo.valor_pago)} pagos. Falta {formatarMT(parcelaAlvo.em_falta)}.</p>
              ) : null}
            </section>
          ) : null}

          <section className="cli-section">
            <h2><CircleDollarSign size={18} /> Dados do pagamento</h2>
            <div className="cli-grid emp-grid-3">
              <Campo icon={CircleDollarSign} label="Valor (MT) *" erro={erros.valor_pago}>
                <input inputMode="decimal" value={form.valor_pago} onChange={(e) => set("valor_pago", soMontante(e.target.value))} placeholder="0.00" disabled={!emprestimo} />
                {emprestimo ? (
                  <span className="pag-atalhos">
                    {parcelaAlvo ? <button type="button" onClick={() => set("valor_pago", String(parcelaAlvo.total_devido))}>Parcela</button> : null}
                    <button type="button" onClick={() => set("valor_pago", String(resumo.maximo))}>Total {formatarMT(resumo.maximo)}</button>
                  </span>
                ) : null}
              </Campo>
              <Campo icon={CalendarDays} label="Data do pagamento *" erro={erros.data_pagamento}>
                <input type="date" className="emp-data" min={dataMinimaPagamento()} max={hojeIso()} value={form.data_pagamento} onChange={(e) => set("data_pagamento", e.target.value)} />
              </Campo>
              <Campo icon={Clock} label="Hora" erro={erros.hora_pagamento}>
                <input type="time" className="emp-data" value={form.hora_pagamento} onChange={(e) => set("hora_pagamento", e.target.value)} />
              </Campo>
            </div>

            <div className="cli-field full pag-bloco">
              <label><CreditCard size={15} /> Forma de pagamento *</label>
              <div className="pag-formas">
                {FORMAS_PAGAMENTO.map((forma, indice) => {
                  const visual = FORMAS_VISUAIS[forma];
                  const Icone = visual.icon;
                  const activa = form.forma_pagamento === forma;
                  return (
                    <button
                      key={forma}
                      type="button"
                      aria-pressed={activa}
                      className={`pag-forma${activa ? " is-active" : ""}`}
                      style={{ animationDelay: `${indice * 40}ms` }}
                      onClick={() => { set("forma_pagamento", forma); setCarteiraManual(false); }}
                    >
                      <span className="pag-forma-logo">{visual.logo ? <img src={LOGOS_CARTEIRAS[visual.logo]} alt="" /> : <Icone size={22} />}</span>
                      <span>{forma}</span>
                      <CheckCircle2 size={15} className="pag-forma-check" />
                    </button>
                  );
                })}
              </div>
              {erros.forma_pagamento ? <small>{erros.forma_pagamento}</small> : null}
            </div>

            <div className="cli-grid">
              <Campo
                icon={Tag}
                label={form.forma_pagamento === "Dinheiro" ? "Referência da transacção" : "Referência da transacção *"}
                erro={erros.referencia_transacao}
              >
                <input
                  value={form.referencia_transacao}
                  maxLength={100}
                  onChange={(e) => set("referencia_transacao", e.target.value)}
                  placeholder={form.forma_pagamento === "Cheque" ? "Nº do cheque" : form.forma_pagamento === "Dinheiro" ? "Opcional" : "Ex: ID da transacção"}
                />
              </Campo>
              <Campo
                icon={Receipt}
                label="Tipo de pagamento *"
                erro={erros.tipo_pagamento}
                extra={!tipoManual || tipo === tipoSugerido ? <span className="pag-sugerido"><Sparkles size={11} /> Sugerido</span> : null}
              >
                <MenuSuspenso
                  valor={tipo}
                  opcoes={TIPOS_PAGAMENTO.map((t) => ({ id: t, label: t }))}
                  onChange={(valor) => { set("tipo_pagamento", valor); setTipoManual(true); }}
                />
              </Campo>
            </div>

            <div className="cli-field full pag-bloco">
              <label>
                <WalletCards size={15} /> Carteira de recebimento *
                {sugerida && !carteiraManual ? <span className="pag-sugerido"><Sparkles size={11} /> Escolhida pela forma de pagamento</span> : null}
              </label>
              <div className="emp-carteiras pag-carteiras">
                {carteiras.map((c, indice) => {
                  const activa = String(c.id) === String(carteiraId);
                  const IconeTipo = ICONES_TIPO[c.tipo] || Wallet;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={activa}
                      className={`emp-carteira${activa ? " is-active" : ""}`}
                      style={{ animationDelay: `${indice * 40}ms` }}
                      onClick={() => { set("carteira_id", String(c.id)); setCarteiraManual(true); }}
                    >
                      <span className="emp-carteira-check"><CheckCircle2 size={18} /></span>
                      <LogoCarteira carteira={c} />
                      <span className="emp-carteira-texto">
                        <strong>{c.nome}</strong>
                        <span className="emp-carteira-tipo"><IconeTipo size={12} /> {c.tipo || "Carteira"}</span>
                      </span>
                      <span className="emp-carteira-saldo">
                        <small>Saldo</small>
                        <strong>{formatarMT(c.saldo)}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
              {erros.carteira_id ? <small>{erros.carteira_id}</small> : null}
              {carteira && valorNumero > 0 ? (
                <div className="emp-debito pag-credito">
                  <LogoCarteira carteira={carteira} />
                  <BadgeCheck size={18} />
                  <span>
                    <small>Resumo do crédito</small>
                    <strong>Carteira {carteira.nome}: +{formatarMT(valorNumero)} (novo saldo: {formatarMT(carteira.saldo + valorNumero)})</strong>
                  </span>
                </div>
              ) : null}
            </div>

            <div className="cli-grid">
              <Campo icon={Paperclip} label={`Comprovativo (JPG, PNG ou PDF, até ${MAX_COMPROVATIVO_MB}MB)`} erro={erros.comprovativo} full>
                {form.comprovativo ? (
                  <div className="pag-ficheiro">
                    <span className="pag-ficheiro-icone">{form.comprovativo.tipo === "application/pdf" ? <FileText size={20} /> : <img src={form.comprovativo.conteudo} alt="" />}</span>
                    <span>
                      <strong>{form.comprovativo.nome}</strong>
                      <small>{(form.comprovativo.tamanho / 1024).toFixed(0)} KB</small>
                    </span>
                    <button type="button" aria-label="Remover comprovativo" onClick={() => set("comprovativo", null)}><X size={15} /></button>
                  </div>
                ) : (
                  <label
                    className={`pag-zona${arrastar ? " is-arrastar" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setArrastar(true); }}
                    onDragLeave={() => setArrastar(false)}
                    onDrop={(e) => { e.preventDefault(); setArrastar(false); anexar(e.dataTransfer.files?.[0]); }}
                  >
                    <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => { anexar(e.target.files?.[0]); e.target.value = ""; }} />
                    <span className="pag-zona-icone"><Upload size={20} /></span>
                    <span><strong>Clique para carregar</strong> ou arraste o ficheiro para aqui</span>
                  </label>
                )}
              </Campo>
              <Campo icon={StickyNote} label="Observações" erro={erros.observacoes} full extra={<span className="pag-contador">{form.observacoes.length}/5000</span>}>
                <textarea rows={3} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Informações adicionais sobre o pagamento" />
              </Campo>
            </div>
          </section>

          {simulacao && simulacao.porParcela.length ? (
            <section className="cli-section">
              <h2><PiggyBank size={18} /> Alocação automática</h2>
              <p className="cli-suave pag-ordem">Ordem aplicada: Multa, depois Juros, depois Principal, e o restante passa às parcelas seguintes.</p>
              <div className="cli-table-wrap">
                <table className="cli-table pag-alocacao">
                  <thead>
                    <tr><th>Parcela</th><th>Vencimento</th><th>Multa</th><th>Juros</th><th>Principal</th><th>Estado após</th></tr>
                  </thead>
                  <tbody>
                    {simulacao.porParcela.map((l, indice) => (
                      <tr key={l.installment_id} style={{ animationDelay: `${indice * 40}ms` }}>
                        <td><strong>{l.num_parcela}/{emprestimo.num_parcelas}</strong></td>
                        <td>{formatarData(l.data_vencimento)}</td>
                        <td className={l.multa ? "pag-vermelho" : ""}>{formatarMT(l.multa)}</td>
                        <td>{formatarMT(l.juros)}</td>
                        <td>{formatarMT(l.principal)}</td>
                        <td><span className={`emp-estado ${l.quita ? "is-activo" : "is-pendente"}`}>{l.quita ? "Pago" : "Parcialmente Pago"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan={2}>Total</th>
                      <td>{formatarMT(simulacao.totalMulta)}</td>
                      <td>{formatarMT(simulacao.totalJuros)}</td>
                      <td>{formatarMT(simulacao.totalPrincipal)}</td>
                      <td>{formatarMT(valorNumero)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {simulacao.sobra > 0 ? <p className="cli-erro"><AlertTriangle size={15} /> Sobram {formatarMT(simulacao.sobra)} sem parcela para alocar.</p> : null}
            </section>
          ) : null}

          <div className="cli-actions">
            <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/pagamentos")}><X size={16} /> Cancelar</button>
            <button type="submit" className="cli-btn-novo" disabled={aGravar || !emprestimo}>
              {aGravar ? <Loader2 size={16} className="emp-girar" /> : <CheckCircle2 size={16} />} {aGravar ? "A registar..." : "Confirmar Pagamento"}
            </button>
          </div>
        </div>

        <aside className="pag-lateral">
          <section className="cli-section pag-resumo">
            <h2><TrendingUp size={18} /> Resumo</h2>
            {resumo ? (
              <>
                <div className="pag-resumo-cliente">
                  <AvatarCliente cliente={cliente} tamanho={40} />
                  <span>
                    <strong>{cliente?.nome_completo || "Cliente"}</strong>
                    <small>{emprestimo.numero_contrato} · <span className={`emp-estado ${classeEstado(emprestimo.status)}`}>{emprestimo.status}</span></small>
                  </span>
                </div>
                <ul className="pag-resumo-lista">
                  <LinhaResumo icon={CircleDollarSign} rotulo="Valor Emprestado" valor={formatarMT(resumo.valorEmprestado)} />
                  <LinhaResumo icon={Percent} rotulo="Total Juros" valor={formatarMT(resumo.totalJuros)} />
                  <LinhaResumo icon={Wallet} rotulo="Total a Receber" valor={formatarMT(resumo.totalReceber)} />
                  <LinhaResumo icon={BadgeCheck} rotulo="Total Pago" valor={formatarMT(resumo.totalPago)} />
                  <LinhaResumo icon={PiggyBank} rotulo="Saldo Devedor" valor={formatarMT(resumo.saldo)} destaque />
                  {resumo.multas > 0 ? <LinhaResumo icon={AlertTriangle} rotulo="Multas pendentes" valor={formatarMT(resumo.multas)} /> : null}
                </ul>
                <div className="pag-progresso">
                  <div className="pag-progresso-topo">
                    <span>Progresso</span>
                    <strong>{progressoDepois.toFixed(1)}%</strong>
                  </div>
                  <div className="pag-barra">
                    <i style={{ width: `${resumo.progresso}%` }} />
                    {valorNumero > 0 ? <b style={{ left: `${resumo.progresso}%`, width: `${Math.max(0, progressoDepois - resumo.progresso)}%` }} /> : null}
                  </div>
                  <small>{formatarMT(simulacao && valorNumero > 0 ? simulacao.totalPagoDepois : resumo.totalPago)} de {formatarMT(resumo.totalReceber)}</small>
                </div>
                <div className="pag-proximo">
                  <CalendarClock size={18} />
                  <span>
                    <small>Próximo Vencimento</small>
                    <strong>{resumo.proximo ? `${formatarData(resumo.proximo.data_vencimento)} · ${formatarMT(resumo.proximo.total_devido)}` : "—"}</strong>
                  </span>
                </div>
                {simulacao && valorNumero > 0 ? (
                  <div className={`pag-depois${simulacao.quitaEmprestimo ? " is-quitado" : ""}`}>
                    <small>Após este pagamento</small>
                    <strong>{simulacao.quitaEmprestimo ? "Empréstimo QUITADO" : `Novo saldo: ${formatarMT(simulacao.saldoDepois)}`}</strong>
                    {simulacao.totalMulta > 0 ? <span>Inclui {formatarMT(simulacao.totalMulta)} de multa ({REGRAS.multaDiaria}% ao dia)</span> : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="pag-resumo-vazio"><FileText size={28} /> Seleccione um empréstimo para ver o resumo.</p>
            )}
          </section>
        </aside>
      </div>

      {registado ? createPortal(
        <div className="cli-modal-fundo emp-recibo-fundo" role="presentation">
          <div className="cli-modal emp-recibo" role="dialog" aria-modal="true" aria-labelledby="pag-recibo-titulo">
            <span className="cli-modal-icone"><CheckCircle2 size={32} /></span>
            <p>Operação concluída</p>
            <h2 id="pag-recibo-titulo">Pagamento {pag.numero_recibo} registado com sucesso!</h2>
            <small className="emp-recibo-sub">
              {quitado ? "O empréstimo ficou quitado." : `Saldo devedor actual: ${formatarMT(pag.saldo_devedor_apos)}.`} A notificação por SMS/Email ficará activa quando o serviço de mensagens for configurado.
            </small>

            <div className="emp-recibo-cartao">
              <div className="emp-recibo-topo">
                <span><Receipt size={16} /> Recibo de pagamento</span>
                <strong>{pag.numero_recibo}</strong>
              </div>
              <div className="emp-recibo-cliente">
                <AvatarCliente cliente={registado.cliente} tamanho={46} />
                <span>
                  <strong>{registado.cliente?.nome_completo}</strong>
                  <span className="emp-recibo-cliente-linha">
                    <span><IdCard size={12} /> {registado.cliente?.documento_tipo} {registado.cliente?.documento_numero}</span>
                    <span><Phone size={12} /> {registado.cliente?.telefone_principal}</span>
                  </span>
                </span>
              </div>
              <table className="emp-recibo-tabela">
                <tbody>
                  {[
                    { icon: FileText, rotulo: "Contrato", valor: registado.emprestimo?.numero_contrato },
                    { icon: Hash, rotulo: "Parcela", valor: pag.num_parcela ? `${pag.num_parcela}/${pag.total_parcelas}` : "—" },
                    { icon: CalendarDays, rotulo: "Data", valor: `${formatarData(pag.data_pagamento)}${pag.hora_pagamento ? ` · ${pag.hora_pagamento}` : ""}` },
                    { icon: CreditCard, rotulo: "Forma", valor: pag.forma_pagamento },
                    { icon: Tag, rotulo: "Referência", valor: pag.referencia_transacao || "—" },
                    {
                      icon: WalletCards,
                      rotulo: "Carteira",
                      valor: <span className="emp-recibo-carteira">{registado.carteira ? <LogoCarteira carteira={registado.carteira} /> : null}{registado.carteira?.nome || "—"}</span>,
                    },
                    { icon: AlertTriangle, rotulo: "Multa", valor: formatarMT(pag.valor_multa) },
                    { icon: PiggyBank, rotulo: "Saldo devedor", valor: quitado ? "QUITADO" : formatarMT(pag.saldo_devedor_apos) },
                  ].map(({ icon: IconeLinha, rotulo, valor }, indice) => (
                    <tr key={rotulo} style={{ animationDelay: `${150 + indice * 45}ms` }}>
                      <th><span><IconeLinha size={14} /></span>{rotulo}</th>
                      <td>{valor}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th><span><Wallet size={15} /></span>Valor pago</th>
                    <td>{formatarMT(pag.valor_pago)}</td>
                  </tr>
                </tfoot>
              </table>
              <span className={`emp-estado ${quitado ? "is-quitado" : "is-activo"} emp-recibo-estado`}>
                <FileCheck2 size={12} /> {pag.status}{quitado ? " · Empréstimo quitado" : ` · ${pag.tipo_pagamento}`}
              </span>
            </div>

            <div className="emp-recibo-accoes">
              {[
                { icon: Download, titulo: "Descarregar recibo", texto: "Guardar em PDF", accao: () => recibo(descarregarReciboPagamento), principal: true },
                { icon: Printer, titulo: "Imprimir", texto: "Enviar para a impressora", accao: () => recibo(imprimirReciboPagamento) },
                { icon: Eye, titulo: "Ver empréstimo", texto: "Abrir a ficha completa", accao: () => navigate(`/imperial/dashboard/emprestimos/${pag.loan_id}`) },
                { icon: History, titulo: "Histórico", texto: "Lista de pagamentos", accao: () => navigate("/imperial/dashboard/pagamentos") },
              ].map(({ icon: IconeAccao, titulo, texto, accao, principal }, indice) => (
                <button
                  key={titulo}
                  type="button"
                  className={`emp-recibo-accao${principal ? " is-principal" : ""}`}
                  style={{ animationDelay: `${350 + indice * 60}ms` }}
                  onClick={accao}
                >
                  <span className="emp-recibo-accao-icone"><IconeAccao size={18} /></span>
                  <span className="emp-recibo-accao-texto"><strong>{titulo}</strong><small>{texto}</small></span>
                  <ChevronRight size={16} className="emp-recibo-accao-seta" />
                </button>
              ))}
            </div>
            <button type="button" className="emp-recibo-novo" onClick={novoPagamento}>
              <span className="emp-recibo-novo-icone"><CreditCard size={16} /></span>
              Registar outro pagamento
            </button>
          </div>
        </div>,
        document.body
      ) : null}
    </form>
  );
};

export default RegistarPagamento;
