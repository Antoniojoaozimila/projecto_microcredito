import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BadgeCheck, Briefcase, CalendarClock, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, FileText,
  Gauge, HandCoins, Hash, LayoutDashboard, Layers, Loader2, Paperclip, PenLine, Percent, Save, Shield,
  StickyNote, TrendingUp, User, Wallet, WalletCards, X,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import PesquisaCliente from "./PesquisaCliente";
import { ICONES_TIPO } from "./logosCarteiras";
import LogoCarteira from "./LogoCarteira";
import { guardarLista } from "../../services/anexosLocais";
import { SECTORES_ACTIVIDADE } from "../../services/reporteBM";
import {
  GARANTIA_OUTROS, MODALIDADES, OUTRO, REGRAS, SEM_GARANTIA, SISTEMAS, TIPOS_GARANTIA, TIPOS_JUROS,
  calcularEmprestimo, clientesParaEmprestimo, obterModalidade, criarEmprestimo, formatarData, formatarMT, carteirasOperacionais, validarCriacao,
} from "../../services/emprestimosMicrocredito";
import "../clientes/ClienteModulo.css";
import "./Emprestimos.css";

const hoje = () => new Date().toISOString().slice(0, 10);

const inicial = () => ({
  client_id: "",
  valor_emprestado: "",
  modalidade: "Mensal",
  num_parcelas: "",
  taxa_juros: String(REGRAS.taxaPadrao),
  tipo_juros: REGRAS.tipoJurosPadrao,
  tipo_juros_outro: "",
  data_inicio: hoje(),
  sistema_amortizacao: REGRAS.sistemaPadrao,
  sistema_outro: "",
  dia_vencimento: "",
  garantia_tipo: "",
  garantia_outra: "",
  garantia_descricao: "",
  garantia_valor: "",
  garantia_documentos: [],
  carteira_id: "",
  sector_atividade: "",
  observacoes: "",
});

const soMontante = (valor) => {
  const limpo = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  return resto.length ? `${inteiro}.${resto.join("").slice(0, 2)}` : inteiro;
};

const soDigitos = (valor) => String(valor || "").replace(/\D/g, "");

const lerFicheiro = (ficheiro) =>
  new Promise((resolve, reject) => {
    if (ficheiro.size > 10 * 1024 * 1024) {
      reject(new Error(`${ficheiro.name} excede 10MB.`));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => resolve({ nome: ficheiro.name, tipo: ficheiro.type, conteudo: leitor.result });
    leitor.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
    leitor.readAsDataURL(ficheiro);
  });

const Campo = ({ icon: Icon, label, erro, children, full }) => (
  <div className={`cli-field${full ? " full" : ""}`}>
    <label>{Icon ? <Icon size={15} /> : null}{label}</label>
    {children}
    {erro ? <small>{erro}</small> : null}
  </div>
);

const amanha = (data) => {
  const d = new Date(`${data || hoje()}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const Resumo = ({ icon: Icon, rotulo, valor, destaque }) => (
  <div className={`emp-resumo-item${destaque ? " is-destaque" : ""}`}>
    <span className="emp-resumo-icone"><Icon size={18} /></span>
    <span>
      <small>{rotulo}</small>
      <strong>{valor}</strong>
    </span>
  </div>
);

const EmprestimoFormulario = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(inicial);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState("");
  const [aGravar, setAGravar] = useState(false);
  const [versao, setVersao] = useState(0);
  const clientes = useMemo(() => (versao >= 0 ? clientesParaEmprestimo() : []), [versao]);
  const carteiras = useMemo(() => (versao >= 0 ? carteirasOperacionais() : []), [versao]);

  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const cliente = clientes.find((c) => String(c.id) === String(form.client_id));
  const carteira = carteiras.find((c) => String(c.id) === String(form.carteira_id));
  const modalidade = obterModalidade(form.modalidade);
  const comGarantia = form.garantia_tipo && form.garantia_tipo !== SEM_GARANTIA;
  const maiorSaldo = Math.max(1, ...carteiras.map((c) => c.saldo));
  const valorNumero = Number(form.valor_emprestado) || 0;

  const calculo = useMemo(
    () =>
      calcularEmprestimo({
        valor: form.valor_emprestado,
        taxa: form.taxa_juros,
        parcelas: form.num_parcelas,
        modalidade: form.modalidade,
        tipoJuros: form.tipo_juros,
        sistema: form.sistema_amortizacao,
        dataInicio: form.data_inicio,
        diaVencimento: form.dia_vencimento,
      }),
    [form.valor_emprestado, form.taxa_juros, form.num_parcelas, form.modalidade, form.tipo_juros, form.sistema_amortizacao, form.data_inicio, form.dia_vencimento]
  );

  const anexar = async (ficheiros) => {
    setAviso("");
    try {
      const lidos = await Promise.all(Array.from(ficheiros || []).map(lerFicheiro));
      set("garantia_documentos", [...form.garantia_documentos, ...lidos]);
    } catch (erro) {
      setAviso(erro.message);
    }
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    if (aGravar) return;
    const falhas = validarCriacao(form);
    setErros(falhas);
    if (Object.keys(falhas).length) {
      setAviso("Reveja os campos assinalados.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setAviso("");
    setAGravar(true);
    try {
      const garantia_documentos = comGarantia ? await guardarLista(form.garantia_documentos) : [];
      const novo = criarEmprestimo({ ...form, garantia_documentos }, usuario);
      navigate(`/microcredito/dashboard/emprestimos/criado/${novo.id}`);
    } catch (erro) {
      setAviso(erro.message || "Não foi possível criar o empréstimo.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setAGravar(false);
    }
  };

  return (
    <form className="cli-page" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><HandCoins size={16} /> Novo empréstimo</span>
          <span className="cli-pill cli-pill-caminho">
            <LayoutDashboard size={16} /> Dashboard
            <ChevronRight size={14} />
            <HandCoins size={16} /> Empréstimos
            <ChevronRight size={14} />
            <FileText size={16} /> Novo
          </span>
        </div>
      </header>
      {aviso ? <p className="cli-erro emp-aviso"><AlertTriangle size={15} /> {aviso}</p> : null}

      <div className="cli-form-entrada">
        <section className="cli-section">
          <h2><User size={18} /> Cliente</h2>
          <div className="cli-grid">
            <Campo icon={User} label="Seleccionar cliente *" erro={erros.client_id} full>
              <PesquisaCliente clientes={clientes} valor={form.client_id} onChange={(valor) => set("client_id", valor)} />
            </Campo>
          </div>
          {cliente ? (
            <div className="emp-cliente-info">
              <Resumo icon={Gauge} rotulo="Score do cliente" valor={`${cliente.score} · Perfil ${cliente.perfil_risco}`} />
              <Resumo icon={Wallet} rotulo="Limite de crédito disponível" valor={formatarMT(cliente.limite_disponivel)} />
              <Resumo icon={Layers} rotulo="Empréstimos activos" valor={cliente.emprestimos_activos} />
            </div>
          ) : clientes.length === 0 ? (
            <p className="cli-suave emp-vazio">Ainda não há clientes registados. Crie um cliente primeiro.</p>
          ) : null}
        </section>

        {cliente ? <>
        <section className="cli-section">
          <h2><CircleDollarSign size={18} /> Dados do empréstimo</h2>
          <div className="cli-grid emp-grid-3">
            <Campo icon={CircleDollarSign} label="Valor (MT) *" erro={erros.valor_emprestado}>
              <input inputMode="decimal" value={form.valor_emprestado} onChange={(e) => set("valor_emprestado", soMontante(e.target.value))} placeholder="0.00" />
            </Campo>
            <Campo icon={CalendarClock} label="Modalidade *" erro={erros.modalidade}>
              <MenuSuspenso valor={form.modalidade} opcoes={MODALIDADES.map((m) => ({ id: m.id, label: m.id }))} onChange={(valor) => set("modalidade", valor)} />
            </Campo>
            <Campo icon={Hash} label="Nº de parcelas *" erro={erros.num_parcelas}>
              <input inputMode="numeric" value={form.num_parcelas} onChange={(e) => set("num_parcelas", soDigitos(e.target.value).slice(0, 3))} placeholder={`Máx. ${modalidade?.max || 52} parcelas`} />
            </Campo>
            <Campo icon={Percent} label="Taxa de Juros (%) *" erro={erros.taxa_juros}>
              <input inputMode="decimal" value={form.taxa_juros} onChange={(e) => set("taxa_juros", soMontante(e.target.value))} />
            </Campo>
            <Campo icon={TrendingUp} label="Tipo de juros *" erro={form.tipo_juros === OUTRO ? null : erros.tipo_juros}>
              <MenuSuspenso valor={form.tipo_juros} opcoes={TIPOS_JUROS} onChange={(valor) => set("tipo_juros", valor)} />
            </Campo>
            {form.tipo_juros === OUTRO ? (
              <Campo icon={PenLine} label="Especifique o tipo de juros *" erro={erros.tipo_juros}>
                <input value={form.tipo_juros_outro} maxLength={80} onChange={(e) => set("tipo_juros_outro", e.target.value)} placeholder="Ex: Juros sobre saldo diário" autoFocus />
              </Campo>
            ) : null}
            <Campo icon={CalendarDays} label="Data de início *" erro={erros.data_inicio}>
              <input type="date" min={hoje()} value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
            </Campo>
            <Campo icon={Briefcase} label="Sector de actividade / finalidade">
              <MenuSuspenso
                valor={form.sector_atividade}
                opcoes={[{ id: "", label: "Seleccione (opcional)" }, ...SECTORES_ACTIVIDADE.map((s) => ({ id: s, label: s }))]}
                onChange={(valor) => set("sector_atividade", valor)}
              />
            </Campo>
            <Campo icon={Layers} label="Sistema de amortização *" erro={form.sistema_amortizacao === OUTRO ? null : erros.sistema_amortizacao}>
              <MenuSuspenso valor={form.sistema_amortizacao} opcoes={SISTEMAS} onChange={(valor) => set("sistema_amortizacao", valor)} />
            </Campo>
            {form.sistema_amortizacao === OUTRO ? (
              <Campo icon={PenLine} label="Especifique o sistema *" erro={erros.sistema_amortizacao}>
                <input value={form.sistema_outro} maxLength={80} onChange={(e) => set("sistema_outro", e.target.value)} placeholder="Ex: Sistema Alemão" autoFocus />
              </Campo>
            ) : null}
            {modalidade?.meses ? (
              <Campo icon={CalendarDays} label="Data do 1.º vencimento *" erro={erros.dia_vencimento}>
                <input type="date" className="emp-data" min={amanha(form.data_inicio)} value={form.dia_vencimento} onChange={(e) => set("dia_vencimento", e.target.value)} />
              </Campo>
            ) : null}
            {form.tipo_juros === OUTRO || form.sistema_amortizacao === OUTRO ? (
              <p className="emp-nota emp-nota-grelha">
                <AlertTriangle size={15} /> Para opções personalizadas, o resumo e o cronograma são calculados com {form.tipo_juros === OUTRO ? "juros simples" : "o tipo de juros escolhido"}{form.sistema_amortizacao === OUTRO ? " e Tabela Price" : ""}.
              </p>
            ) : null}
          </div>
        </section>

        <section className="cli-section">
          <h2><TrendingUp size={18} /> Resumo do cálculo</h2>
          <div className="emp-resumo">
            <Resumo icon={CircleDollarSign} rotulo="Valor emprestado" valor={formatarMT(valorNumero)} />
            <Resumo icon={TrendingUp} rotulo="Total de juros" valor={formatarMT(calculo.totalJuros)} />
            <Resumo icon={Wallet} rotulo="Total a receber" valor={formatarMT(calculo.totalReceber)} destaque />
            <Resumo icon={CalendarClock} rotulo={form.sistema_amortizacao === "Tabela Price" ? "Valor da parcela" : "Primeira parcela"} valor={formatarMT(calculo.valorParcela)} />
            <Resumo icon={CalendarDays} rotulo="Último vencimento" valor={formatarData(calculo.ultimoVencimento)} />
          </div>
          {calculo.cronograma.length ? (
            <details className="emp-cronograma">
              <summary><CalendarDays size={15} /> Ver cronograma de {calculo.cronograma.length} parcela{calculo.cronograma.length === 1 ? "" : "s"}</summary>
              <div className="cli-table-wrap">
                <table className="cli-table">
                  <thead>
                    <tr><th>Nº</th><th>Vencimento</th><th>Parcela</th><th>Juros</th><th>Principal</th><th>Saldo</th></tr>
                  </thead>
                  <tbody>
                    {calculo.cronograma.map((p) => (
                      <tr key={p.num_parcela}>
                        <td>{p.num_parcela}</td>
                        <td>{formatarData(p.data_vencimento)}</td>
                        <td>{formatarMT(p.valor_parcela)}</td>
                        <td>{formatarMT(p.valor_juros)}</td>
                        <td>{formatarMT(p.valor_principal)}</td>
                        <td>{formatarMT(p.saldo_apos_pagamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
          {valorNumero > REGRAS.aprovacaoGestorAcima ? (
            <p className="emp-nota"><BadgeCheck size={15} /> Acima de {formatarMT(REGRAS.aprovacaoGestorAcima)}: este empréstimo exige aprovação do gestor.</p>
          ) : null}
        </section>

        <section className="cli-section">
          <h2><Shield size={18} /> Garantias</h2>
          <div className="cli-grid">
            <Campo icon={Shield} label="Tipo de garantia *" erro={erros.garantia_tipo} full>
              <MenuSuspenso
                valor={form.garantia_tipo}
                opcoes={[{ id: "", label: "Seleccione" }, ...TIPOS_GARANTIA.map((t) => ({ id: t, label: t }))]}
                onChange={(valor) => set("garantia_tipo", valor)}
              />
            </Campo>
            {form.garantia_tipo === GARANTIA_OUTROS ? (
              <Campo icon={PenLine} label="Especifique o tipo de garantia *" erro={erros.garantia_outra} full>
                <input value={form.garantia_outra} maxLength={100} onChange={(e) => set("garantia_outra", e.target.value)} placeholder="Ex: Penhor de equipamento, depósito caução" autoFocus />
              </Campo>
            ) : null}
            {comGarantia ? (
              <>
                <Campo icon={FileText} label="Descrição da garantia *" erro={erros.garantia_descricao}>
                  <input value={form.garantia_descricao} maxLength={255} onChange={(e) => set("garantia_descricao", e.target.value)} placeholder="Descrição do bem ou do avalista" />
                </Campo>
                <Campo icon={CircleDollarSign} label="Valor estimado (MT) *" erro={erros.garantia_valor}>
                  <input inputMode="decimal" value={form.garantia_valor} onChange={(e) => set("garantia_valor", soMontante(e.target.value))} placeholder="0.00" />
                </Campo>
                <Campo icon={Paperclip} label="Documentos da garantia *" erro={erros.garantia_documentos} full>
                  <input type="file" multiple accept="image/jpeg,image/png,application/pdf" onChange={(e) => anexar(e.target.files)} />
                  {form.garantia_documentos.length ? (
                    <div className="emp-anexos">
                      {form.garantia_documentos.map((doc, indice) => (
                        <span key={`${doc.nome}-${indice}`}>
                          <Paperclip size={13} /> {doc.nome}
                          <button type="button" aria-label="Remover" onClick={() => set("garantia_documentos", form.garantia_documentos.filter((_, i) => i !== indice))}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Campo>
              </>
            ) : null}
          </div>
        </section>

        <section className="cli-section">
          <h2><WalletCards size={18} /> Carteira de desembolso</h2>
          <div className="emp-carteiras">
            {carteiras.map((c, indice) => {
              const activa = String(c.id) === String(form.carteira_id);
              const insuficiente = valorNumero > c.saldo;
              const IconeTipo = ICONES_TIPO[c.tipo] || Wallet;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activa}
                  className={`emp-carteira${activa ? " is-active" : ""}${insuficiente ? " is-baixa" : ""}`}
                  style={{ animationDelay: `${indice * 45}ms` }}
                  onClick={() => set("carteira_id", String(c.id))}
                >
                  <span className="emp-carteira-check"><CheckCircle2 size={18} /></span>
                  <LogoCarteira carteira={c} />
                  <span className="emp-carteira-texto">
                    <strong>{c.nome}</strong>
                    <span className="emp-carteira-tipo"><IconeTipo size={12} /> {c.tipo || "Carteira"}</span>
                  </span>
                  <span className="emp-carteira-saldo">
                    <small>{insuficiente ? "Saldo insuficiente" : "Saldo disponível"}</small>
                    <strong>{formatarMT(c.saldo)}</strong>
                    <i><b style={{ width: `${Math.max(4, (c.saldo / maiorSaldo) * 100)}%` }} /></i>
                  </span>
                </button>
              );
            })}
          </div>
          {erros.carteira_id ? <small className="cli-erro">{erros.carteira_id}</small> : null}
          {carteira ? (
            <div className={`emp-debito${valorNumero > carteira.saldo ? " is-baixa" : ""}`}>
              <LogoCarteira carteira={carteira} />
              {valorNumero > carteira.saldo ? <AlertTriangle size={18} /> : <BadgeCheck size={18} />}
              <span>
                <small>Resumo do débito</small>
                <strong>Carteira {carteira.nome}: {formatarMT(valorNumero)} (saldo disponível: {formatarMT(carteira.saldo)})</strong>
              </span>
            </div>
          ) : null}
        </section>

        <section className="cli-section">
          <h2><StickyNote size={18} /> Observações</h2>
          <Campo icon={StickyNote} label="Observações" erro={erros.observacoes} full>
            <textarea rows={4} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Informações adicionais sobre o empréstimo" />
          </Campo>
        </section>
        </> : null}

        <div className="cli-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate("/microcredito/dashboard/emprestimos")}><X size={16} /> Cancelar</button>
          {cliente ? (
            <button type="submit" className="cli-btn-novo" disabled={aGravar}>
              {aGravar ? <Loader2 size={16} className="emp-girar" /> : <Save size={16} />} {aGravar ? "A criar..." : "Criar empréstimo"}
            </button>
          ) : null}
        </div>
      </div>

    </form>
  );
};

export default EmprestimoFormulario;
