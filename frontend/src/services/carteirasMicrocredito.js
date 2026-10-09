import {
  CHAVES_CARTEIRA, aplicarLancamentos, arredondar, carteiraOperacional, formatarMT, gravarCarteiras, gravarLista, lerLista, listarCarteiras,
  listarEmprestimos, proximoCodigo, saldoDisponivel,
} from "./emprestimosMicrocredito";
import { hojeIso, listarPagamentos } from "./pagamentosMicrocredito";

export const TIPOS_CARTEIRA = ["Caixa", "Mpesa", "E-Mola", "Banco", "Outro"];
export const ESTADOS_CARTEIRA = ["Ativa", "Inativa", "Bloqueada", "Encerrada"];
export const ESTADOS_CARTEIRA_FORM = ["Ativa", "Inativa", "Bloqueada"];
export const MOEDAS = ["MZN"];
export const TIPOS_TRANSACAO = ["Entrada", "Saída", "Transferência"];
export const SUBTIPOS_TRANSACAO = [
  "Pagamento Empréstimo", "Desembolso Empréstimo", "Despesa", "Transferência Interna", "Depósito", "Levantamento", "Comissão", "Multa", "Estorno", "Ajuste",
];
export const SUBTIPOS_MANUAIS = {
  Entrada: ["Depósito", "Comissão", "Multa", "Ajuste"],
  "Saída": ["Despesa", "Levantamento", "Comissão", "Ajuste"],
  "Transferência": ["Transferência Interna"],
};
export const SUBTIPOS_AUTOMATICOS = ["Pagamento Empréstimo", "Desembolso Empréstimo", "Estorno"];
export const CATEGORIAS_DESPESA = ["Transporte", "Material", "Salário", "Renda", "Água", "Energia", "Internet", "Manutenção", "Marketing", "Outro"];
export const ESTADOS_DESPESA = ["Pendente", "Aprovada", "Paga", "Rejeitada", "Cancelada"];
export const ESTADOS_TRANSACAO = ["Confirmada", "Pendente", "Cancelada", "Estornada"];
export const ESTADOS_TRANSFERENCIA = ["Pendente", "Concluída", "Cancelada", "Falhou"];

export const REGRAS_CARTEIRA = {
  comprovativoAcima: 10000,
  aprovacaoAcima: 50000,
  maxTexto: 5000,
  maxComprovativoMB: 5,
};

const PERFIS_GESTOR = ["admin", "gestor"];
export const eGestor = (utilizador) => PERFIS_GESTOR.includes(String(utilizador?.tipo || "").toLowerCase());

const nomeDe = (utilizador) => utilizador?.nome || "Sistema";
const agoraIso = () => new Date().toISOString();
const texto = (v) => String(v ?? "").trim();
const numero = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

const dataHora = (dataIso) => {
  if (!dataIso) return agoraIso();
  if (dataIso === hojeIso()) return agoraIso();
  return new Date(`${dataIso}T${new Date().toTimeString().slice(0, 8)}`).toISOString();
};

export const obterCarteira = (id) => listarCarteiras().find((c) => String(c.id) === String(id)) || null;

export const codigoCarteiraExiste = (codigo, ignorarId) =>
  listarCarteiras().some((c) => String(c.id) !== String(ignorarId || "") && texto(c.codigo).toUpperCase() === texto(codigo).toUpperCase());

export const listarTransacoes = () =>
  lerLista(CHAVES_CARTEIRA.transacoes).sort((a, b) => String(b.data_transacao).localeCompare(String(a.data_transacao)) || String(b.codigo_transacao).localeCompare(String(a.codigo_transacao)));

export const obterTransacao = (id) => lerLista(CHAVES_CARTEIRA.transacoes).find((t) => String(t.id) === String(id)) || null;

export const listarMovimentos = (carteiraId) =>
  lerLista(CHAVES_CARTEIRA.movimentos)
    .filter((m) => !carteiraId || String(m.wallet_id) === String(carteiraId))
    .sort((a, b) => String(b.data_movimento).localeCompare(String(a.data_movimento)));

export const listarTransferencias = () =>
  lerLista(CHAVES_CARTEIRA.transferencias).sort((a, b) => String(b.data_transferencia).localeCompare(String(a.data_transferencia)));

export const listarDespesas = () =>
  lerLista(CHAVES_CARTEIRA.despesas).sort((a, b) => String(b.data_despesa).localeCompare(String(a.data_despesa)) || String(b.data_registo).localeCompare(String(a.data_registo)));

export const obterDespesa = (id) => lerLista(CHAVES_CARTEIRA.despesas).find((d) => String(d.id) === String(id)) || null;

export const listarFechos = (carteiraId) =>
  lerLista(CHAVES_CARTEIRA.fechos)
    .filter((f) => !carteiraId || String(f.wallet_id) === String(carteiraId))
    .sort((a, b) => String(b.data_registo).localeCompare(String(a.data_registo)));

const temMovimentos = (carteiraId) => lerLista(CHAVES_CARTEIRA.movimentos).some((m) => String(m.wallet_id) === String(carteiraId));

export const podeEditarSaldoInicial = (carteira) => !carteira?.id || !temMovimentos(carteira.id);

// ---------- Carteiras ----------

const IBAN_MZ = /^MZ\d{2}\d{21}$/;

export const formatarIban = (valor) => {
  const limpo = String(valor || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 25);
  return limpo.replace(/(.{4})/g, "$1 ").trim();
};

export const validarCarteira = (dados) => {
  const erros = {};
  if (!texto(dados.nome)) erros.nome = "Indique o nome da carteira.";
  else if (texto(dados.nome).length > 100) erros.nome = "Máximo de 100 caracteres.";
  const codigo = texto(dados.codigo).toUpperCase();
  if (!codigo) erros.codigo = "Indique o código.";
  else if (!/^[A-Z0-9_-]{2,20}$/.test(codigo)) erros.codigo = "Use 2 a 20 letras, números, - ou _.";
  else if (codigoCarteiraExiste(codigo, dados.id)) erros.codigo = "Já existe uma carteira com este código.";
  if (!TIPOS_CARTEIRA.includes(dados.tipo)) erros.tipo = "Seleccione o tipo.";
  if (!MOEDAS.includes(dados.moeda)) erros.moeda = "Seleccione a moeda.";
  if (dados.tipo === "Banco") {
    if (!texto(dados.numero_conta)) erros.numero_conta = "Indique o número da conta.";
    else if (texto(dados.numero_conta).length > 50) erros.numero_conta = "Máximo de 50 caracteres.";
    const iban = String(dados.iban || "").replace(/\s/g, "").toUpperCase();
    if (!iban) erros.iban = "Indique o IBAN.";
    else if (!IBAN_MZ.test(iban)) erros.iban = "Formato: MZ00 0000 0000 0000 0000 0000 0.";
    if (!texto(dados.titular)) erros.titular = "Indique o titular da conta.";
  }
  const inicial = Number(dados.saldo_inicial);
  if (dados.saldo_inicial === "" || !Number.isFinite(inicial) || inicial < 0) erros.saldo_inicial = "Indique um saldo inicial válido (0 ou mais).";
  const minimo = numero(dados.limite_minimo);
  const maximo = numero(dados.limite_maximo);
  if (minimo !== null && (!Number.isFinite(minimo) || minimo < 0)) erros.limite_minimo = "Valor inválido.";
  if (maximo !== null && (!Number.isFinite(maximo) || maximo < 0)) erros.limite_maximo = "Valor inválido.";
  if (minimo !== null && maximo !== null && maximo <= minimo) erros.limite_maximo = "Tem de ser maior que o limite mínimo.";
  const bloqueado = numero(dados.saldo_bloqueado);
  if (bloqueado !== null && (!Number.isFinite(bloqueado) || bloqueado < 0)) erros.saldo_bloqueado = "Valor inválido.";
  if (!ESTADOS_CARTEIRA.includes(dados.status)) erros.status = "Seleccione o estado.";
  if (String(dados.observacoes || "").length > REGRAS_CARTEIRA.maxTexto) erros.observacoes = "Máximo de 5000 caracteres.";
  if (String(dados.descricao || "").length > REGRAS_CARTEIRA.maxTexto) erros.descricao = "Máximo de 5000 caracteres.";
  return erros;
};

export const guardarCarteira = (dados, utilizador) => {
  const erros = validarCarteira(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const lista = listarCarteiras();
  const agora = agoraIso();
  const banco = dados.tipo === "Banco";
  const base = {
    nome: texto(dados.nome),
    codigo: texto(dados.codigo).toUpperCase(),
    tipo: dados.tipo,
    logo: dados.logo || "",
    logo_ficheiro: dados.logo_ficheiro || "",
    descricao: texto(dados.descricao),
    numero_conta: banco ? texto(dados.numero_conta) : "",
    iban: banco ? formatarIban(dados.iban) : "",
    titular: banco ? texto(dados.titular) : "",
    agencia: banco ? texto(dados.agencia) : "",
    moeda: dados.moeda,
    limite_minimo: numero(dados.limite_minimo),
    limite_maximo: numero(dados.limite_maximo),
    saldo_bloqueado: numero(dados.saldo_bloqueado) || 0,
    responsavel: texto(dados.responsavel),
    status: dados.status,
    observacoes: texto(dados.observacoes),
    data_atualizacao: agora,
  };
  if (dados.id) {
    const actual = lista.find((c) => String(c.id) === String(dados.id));
    if (!actual) throw new Error("Carteira não encontrada.");
    const inicial = Number(dados.saldo_inicial);
    const mudarInicial = podeEditarSaldoInicial(actual) && Math.abs(inicial - Number(actual.saldo_inicial || 0)) > 0.005;
    const actualizada = {
      ...actual,
      ...base,
      saldo_inicial: mudarInicial ? inicial : actual.saldo_inicial,
      saldo: mudarInicial ? arredondar(Number(actual.saldo || 0) + inicial - Number(actual.saldo_inicial || 0)) : actual.saldo,
    };
    gravarCarteiras(lista.map((c) => (String(c.id) === String(actual.id) ? actualizada : c)));
    return actualizada;
  }
  const id = lista.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
  const nova = {
    ...base,
    id,
    saldo_inicial: arredondar(Number(dados.saldo_inicial)),
    saldo: arredondar(Number(dados.saldo_inicial)),
    data_registo: agora,
    criado_por: nomeDe(utilizador),
  };
  gravarCarteiras([...lista, nova]);
  return nova;
};

export const bloqueiosEliminarCarteira = (carteira) => {
  const motivos = [];
  if (temMovimentos(carteira.id)) motivos.push("tem movimentos registados");
  if (listarEmprestimos().some((e) => String(e.carteira_id) === String(carteira.id))) motivos.push("está associada a empréstimos");
  if (listarPagamentos().some((p) => String(p.carteira_id) === String(carteira.id))) motivos.push("recebeu pagamentos");
  if (listarDespesas().some((d) => String(d.wallet_id) === String(carteira.id))) motivos.push("tem despesas");
  return motivos;
};

export const eliminarCarteira = (id) => {
  const carteira = obterCarteira(id);
  if (!carteira) throw new Error("Carteira não encontrada.");
  const motivos = bloqueiosEliminarCarteira(carteira);
  if (motivos.length) throw new Error(`Não é possível eliminar: a carteira ${motivos.join(", ")}. Altere o estado para «Encerrada».`);
  gravarCarteiras(listarCarteiras().filter((c) => String(c.id) !== String(id)));
};

export const encerrarCarteira = (id) => {
  const carteira = obterCarteira(id);
  if (!carteira) throw new Error("Carteira não encontrada.");
  if (Math.abs(Number(carteira.saldo || 0)) > 0.005) throw new Error(`Transfira o saldo de ${formatarMT(carteira.saldo)} antes de encerrar a carteira.`);
  const agora = agoraIso();
  gravarCarteiras(listarCarteiras().map((c) => (String(c.id) === String(id) ? { ...c, status: "Encerrada", data_atualizacao: agora } : c)));
};

export const alertasCarteira = (c) => {
  const alertas = [];
  if (c.limite_minimo !== null && c.limite_minimo !== undefined && Number(c.saldo) < Number(c.limite_minimo)) {
    alertas.push({ tipo: "minimo", texto: `Saldo abaixo do limite mínimo (${formatarMT(c.limite_minimo)})` });
  }
  if (c.limite_maximo !== null && c.limite_maximo !== undefined && Number(c.limite_maximo) > 0 && Number(c.saldo) > Number(c.limite_maximo)) {
    alertas.push({ tipo: "maximo", texto: `Saldo acima do limite máximo (${formatarMT(c.limite_maximo)})` });
  }
  return alertas;
};

const noPeriodo = (iso, de, ate) => {
  const dia = String(iso || "").slice(0, 10);
  return (!de || dia >= de) && (!ate || dia <= ate);
};

export const inicioDoMes = () => `${hojeIso().slice(0, 7)}-01`;

export const fluxoCarteira = (carteiraId, de, ate) => {
  const movimentos = listarMovimentos(carteiraId).filter((m) => noPeriodo(m.data_movimento, de, ate));
  const entradas = arredondar(movimentos.filter((m) => m.sinal > 0).reduce((s, m) => s + m.valor, 0));
  const saidas = arredondar(movimentos.filter((m) => m.sinal < 0).reduce((s, m) => s + m.valor, 0));
  return { entradas, saidas, fluxo: arredondar(entradas - saidas), total: movimentos.length };
};

export const conciliacaoSistema = (carteira) => {
  const { entradas, saidas } = fluxoCarteira(carteira.id);
  const calculado = arredondar(Number(carteira.saldo_inicial || 0) + entradas - saidas);
  return { calculado, diferenca: arredondar(Number(carteira.saldo || 0) - calculado) };
};

export const resumoCarteiras = () => {
  const carteiras = listarCarteiras();
  const activas = carteiras.filter(carteiraOperacional);
  const mes = fluxoCarteira(null, inicioDoMes(), hojeIso());
  return {
    total: carteiras.length,
    activas: activas.length,
    saldoTotal: arredondar(activas.reduce((s, c) => s + Number(c.saldo || 0), 0)),
    saldoInicial: arredondar(carteiras.reduce((s, c) => s + Number(c.saldo_inicial || 0), 0)),
    bloqueado: arredondar(activas.reduce((s, c) => s + Number(c.saldo_bloqueado || 0), 0)),
    alertas: carteiras.filter((c) => c.status !== "Encerrada").flatMap((c) => alertasCarteira(c).map((a) => ({ ...a, carteira: c }))),
    mes,
  };
};

export const fluxoDiario = (dias = 14, carteiraId = null) => {
  const hoje = new Date(`${hojeIso()}T00:00:00`);
  const serie = Array.from({ length: dias }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - (dias - 1 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { dia: iso, entradas: 0, saidas: 0 };
  });
  const indice = Object.fromEntries(serie.map((s, i) => [s.dia, i]));
  listarMovimentos(carteiraId).forEach((m) => {
    const i = indice[String(m.data_movimento).slice(0, 10)];
    if (i === undefined) return;
    if (m.sinal > 0) serie[i].entradas = arredondar(serie[i].entradas + m.valor);
    else serie[i].saidas = arredondar(serie[i].saidas + m.valor);
  });
  return serie;
};

// ---------- Transacções ----------

const exigirOperacional = (carteira, papel = "A carteira") => {
  if (!carteira) throw new Error(`${papel} não foi encontrada.`);
  if (!carteiraOperacional(carteira)) throw new Error(`${papel} ${carteira.nome} está ${String(carteira.status).toLowerCase()}.`);
};

export const validarTransacao = (dados) => {
  const erros = {};
  const carteira = obterCarteira(dados.wallet_id);
  if (!carteira) erros.wallet_id = "Seleccione a carteira.";
  else if (!carteiraOperacional(carteira)) erros.wallet_id = `A carteira está ${String(carteira.status).toLowerCase()}.`;
  if (!TIPOS_TRANSACAO.includes(dados.tipo)) erros.tipo = "Seleccione o tipo.";
  if (!(SUBTIPOS_MANUAIS[dados.tipo] || []).includes(dados.subtipo)) erros.subtipo = "Seleccione o subtipo.";
  const valor = Number(dados.valor);
  const taxa = Number(dados.taxa || 0);
  if (!Number.isFinite(valor) || valor < 1) erros.valor = "O valor mínimo é 1 MT.";
  else if (carteira && dados.tipo !== "Entrada" && valor + (dados.tipo === "Transferência" ? taxa : 0) > saldoDisponivel(carteira) + 0.005) {
    erros.valor = `Excede o saldo disponível (${formatarMT(saldoDisponivel(carteira))}).`;
  }
  if (!texto(dados.descricao)) erros.descricao = "Descreva a transacção.";
  else if (texto(dados.descricao).length > REGRAS_CARTEIRA.maxTexto) erros.descricao = "Máximo de 5000 caracteres.";
  if (dados.subtipo === "Despesa") {
    if (!CATEGORIAS_DESPESA.includes(dados.categoria)) erros.categoria = "A categoria é obrigatória para despesas.";
    if (valor > REGRAS_CARTEIRA.aprovacaoAcima) erros.valor = `Despesas acima de ${formatarMT(REGRAS_CARTEIRA.aprovacaoAcima)} exigem aprovação: registe-as no menu Despesas.`;
    else if (valor > REGRAS_CARTEIRA.comprovativoAcima && !dados.comprovativo) erros.comprovativo = `Despesas acima de ${formatarMT(REGRAS_CARTEIRA.comprovativoAcima)} exigem comprovativo.`;
  }
  if (!dados.data) erros.data = "Indique a data.";
  else if (dados.data > hojeIso()) erros.data = "A data não pode ser futura.";
  if (dados.tipo === "Transferência") {
    const destino = obterCarteira(dados.wallet_destino_id);
    if (!destino) erros.wallet_destino_id = "Seleccione a carteira de destino.";
    else if (String(destino.id) === String(dados.wallet_id)) erros.wallet_destino_id = "A carteira de destino tem de ser diferente da origem.";
    else if (!carteiraOperacional(destino)) erros.wallet_destino_id = `A carteira de destino está ${String(destino.status).toLowerCase()}.`;
    if (!Number.isFinite(taxa) || taxa < 0) erros.taxa = "Taxa inválida.";
  }
  if (String(dados.referencia || "").length > 100) erros.referencia = "Máximo de 100 caracteres.";
  if (String(dados.observacoes || "").length > REGRAS_CARTEIRA.maxTexto) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

export const registarTransacao = (dados, utilizador) => {
  const erros = validarTransacao(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  if (dados.tipo === "Transferência") {
    const transferencia = registarTransferencia({
      wallet_origem_id: dados.wallet_id,
      wallet_destino_id: dados.wallet_destino_id,
      valor: dados.valor,
      taxa: dados.taxa,
      descricao: dados.descricao,
      data: dados.data,
      referencia: dados.referencia,
      comprovativo: dados.comprovativo,
      observacoes: dados.observacoes,
    }, utilizador);
    return obterTransacao(transferencia.transaction_ids[0]);
  }
  if (dados.subtipo === "Despesa") {
    const despesa = registarDespesa({
      wallet_id: dados.wallet_id,
      categoria: dados.categoria,
      descricao: dados.descricao,
      valor: dados.valor,
      data_despesa: dados.data,
      numero_factura: dados.referencia,
      comprovativo: dados.comprovativo,
      observacoes: dados.observacoes,
      pagar_agora: true,
    }, utilizador);
    return obterTransacao(despesa.transaction_id);
  }
  const valor = arredondar(Number(dados.valor));
  const [transacao] = aplicarLancamentos([{
    carteiraId: dados.wallet_id,
    delta: dados.tipo === "Entrada" ? valor : -valor,
    detalhe: {
      tipo: dados.tipo,
      subtipo: dados.subtipo,
      descricao: texto(dados.descricao),
      categoria: dados.categoria || null,
      referencia: texto(dados.referencia) || null,
      data: dataHora(dados.data),
      comprovativo: dados.comprovativo || null,
      observacoes: texto(dados.observacoes),
      utilizador: nomeDe(utilizador),
    },
  }]);
  return transacao;
};

const marcarTransacoes = (ids, mudar) => {
  const alvo = new Set(ids.map(String));
  const agora = agoraIso();
  gravarLista(CHAVES_CARTEIRA.transacoes, lerLista(CHAVES_CARTEIRA.transacoes).map((t) => (alvo.has(String(t.id)) ? { ...mudar(t), data_atualizacao: agora } : t)));
};

export const podeEstornarTransacao = (t) =>
  Boolean(t) && t.status === "Confirmada" && !SUBTIPOS_AUTOMATICOS.includes(t.subtipo) && !t.estorno_de;

export const motivoSemEstorno = (t) => {
  if (!t) return "";
  if (t.status !== "Confirmada") return `Transacção ${t.status.toLowerCase()}.`;
  if (t.subtipo === "Pagamento Empréstimo") return "Estorne o pagamento no Histórico de Pagamentos.";
  if (t.subtipo === "Desembolso Empréstimo") return "Os desembolsos são geridos no menu Empréstimos.";
  if (t.estorno_de || t.subtipo === "Estorno") return "É um lançamento de estorno.";
  return "";
};

export const estornarTransacao = (id, motivo, utilizador) => {
  const t = obterTransacao(id);
  if (!podeEstornarTransacao(t)) throw new Error(motivoSemEstorno(t) || "Esta transacção não pode ser estornada.");
  if (texto(motivo).length < 5) throw new Error("Escreva a justificação do estorno (mínimo 5 caracteres).");
  if (t.transfer_id) return estornarTransferencia(t.transfer_id, motivo, utilizador);
  if (t.expense_id) return cancelarDespesa(t.expense_id, motivo, utilizador);
  const [estorno] = aplicarLancamentos([{
    carteiraId: t.wallet_id,
    delta: -t.sinal * t.valor,
    detalhe: { tipo: t.sinal > 0 ? "Saída" : "Entrada", subtipo: "Estorno", descricao: `Estorno ${t.codigo_transacao}: ${texto(motivo)}`, estorno_de: t.id, utilizador: nomeDe(utilizador), forcar: t.sinal < 0 },
  }]);
  marcarTransacoes([t.id], (x) => ({ ...x, status: "Estornada", estorno: { motivo: texto(motivo), por: nomeDe(utilizador), data: agoraIso(), transaction_id: estorno.id } }));
  return obterTransacao(t.id);
};

// ---------- Transferências ----------

export const registarTransferencia = (dados, utilizador) => {
  const origem = obterCarteira(dados.wallet_origem_id);
  const destino = obterCarteira(dados.wallet_destino_id);
  exigirOperacional(origem, "A carteira de origem");
  exigirOperacional(destino, "A carteira de destino");
  if (String(origem.id) === String(destino.id)) throw new Error("A carteira de destino tem de ser diferente da origem.");
  const valor = arredondar(Number(dados.valor));
  const taxa = arredondar(Number(dados.taxa || 0));
  if (!(valor >= 1)) throw new Error("O valor mínimo é 1 MT.");
  const total = arredondar(valor + taxa);
  if (total > saldoDisponivel(origem) + 0.005) throw new Error(`A carteira ${origem.nome} não tem saldo disponível para ${formatarMT(total)}.`);
  const lista = listarTransferencias();
  const id = crypto.randomUUID();
  const codigo = proximoCodigo(CHAVES_CARTEIRA.transferencias, "codigo_transferencia", "TRF");
  const data = dataHora(dados.data);
  const nome = nomeDe(utilizador);
  const comum = { transfer_id: id, data, referencia: texto(dados.referencia) || codigo, comprovativo: dados.comprovativo || null, observacoes: texto(dados.observacoes), utilizador: nome };
  const transacoes = aplicarLancamentos([
    { carteiraId: origem.id, delta: -valor, detalhe: { ...comum, tipo: "Transferência", subtipo: "Transferência Interna", descricao: `Transf. p/ ${destino.nome}: ${texto(dados.descricao)}`, wallet_destino_id: destino.id } },
    { carteiraId: destino.id, delta: valor, detalhe: { ...comum, tipo: "Transferência", subtipo: "Transferência Interna", descricao: `Transf. de ${origem.nome}: ${texto(dados.descricao)}`, wallet_destino_id: origem.id } },
    ...(taxa > 0 ? [{ carteiraId: origem.id, delta: -taxa, detalhe: { ...comum, tipo: "Saída", subtipo: "Comissão", categoria: "Taxa de transferência", descricao: `Taxa da transferência ${codigo}` } }] : []),
  ]);
  const agora = agoraIso();
  const transferencia = {
    id,
    codigo_transferencia: codigo,
    wallet_origem_id: origem.id,
    wallet_destino_id: destino.id,
    valor,
    taxa,
    valor_total: total,
    descricao: texto(dados.descricao),
    data_transferencia: data,
    comprovativo: dados.comprovativo || null,
    status: "Concluída",
    observacoes: texto(dados.observacoes),
    transaction_ids: transacoes.map((t) => t.id),
    registado_por: nome,
    data_registo: agora,
    data_atualizacao: agora,
  };
  gravarLista(CHAVES_CARTEIRA.transferencias, [...lista, transferencia]);
  return transferencia;
};

export const estornarTransferencia = (id, motivo, utilizador) => {
  const lista = listarTransferencias();
  const t = lista.find((x) => String(x.id) === String(id));
  if (!t || t.status !== "Concluída") throw new Error("Só transferências concluídas podem ser estornadas.");
  if (texto(motivo).length < 5) throw new Error("Escreva a justificação do estorno (mínimo 5 caracteres).");
  const nome = nomeDe(utilizador);
  const detalhe = { tipo: "Transferência", subtipo: "Estorno", transfer_id: t.id, utilizador: nome, forcar: true };
  aplicarLancamentos([
    { carteiraId: t.wallet_destino_id, delta: -t.valor, detalhe: { ...detalhe, forcar: false, descricao: `Estorno ${t.codigo_transferencia}: ${texto(motivo)}` } },
    { carteiraId: t.wallet_origem_id, delta: t.valor + Number(t.taxa || 0), detalhe: { ...detalhe, descricao: `Estorno ${t.codigo_transferencia}: ${texto(motivo)}` } },
  ]);
  marcarTransacoes(t.transaction_ids || [], (x) => ({ ...x, status: "Estornada" }));
  const agora = agoraIso();
  gravarLista(CHAVES_CARTEIRA.transferencias, lista.map((x) => (String(x.id) === String(id) ? { ...x, status: "Cancelada", estorno: { motivo: texto(motivo), por: nome, data: agora }, data_atualizacao: agora } : x)));
  return obterTransacao(t.transaction_ids?.[0]);
};

// ---------- Despesas ----------

export const exigeComprovativo = (valor) => Number(valor) > REGRAS_CARTEIRA.comprovativoAcima;
export const exigeAprovacao = (valor) => Number(valor) > REGRAS_CARTEIRA.aprovacaoAcima;

export const validarDespesa = (dados) => {
  const erros = {};
  const carteira = obterCarteira(dados.wallet_id);
  if (!carteira) erros.wallet_id = "Seleccione a carteira.";
  else if (!carteiraOperacional(carteira)) erros.wallet_id = `A carteira está ${String(carteira.status).toLowerCase()}.`;
  if (!CATEGORIAS_DESPESA.includes(dados.categoria)) erros.categoria = "Seleccione a categoria.";
  if (!texto(dados.descricao)) erros.descricao = "Descreva a despesa.";
  else if (texto(dados.descricao).length > REGRAS_CARTEIRA.maxTexto) erros.descricao = "Máximo de 5000 caracteres.";
  const valor = Number(dados.valor);
  const imediata = dados.pagar_agora && !exigeAprovacao(valor);
  if (!Number.isFinite(valor) || valor < 1) erros.valor = "O valor mínimo é 1 MT.";
  else if (carteira && imediata && valor > saldoDisponivel(carteira) + 0.005) erros.valor = `Excede o saldo disponível (${formatarMT(saldoDisponivel(carteira))}).`;
  if (exigeComprovativo(valor) && !dados.comprovativo) erros.comprovativo = `Despesas acima de ${formatarMT(REGRAS_CARTEIRA.comprovativoAcima)} exigem comprovativo.`;
  if (!dados.data_despesa) erros.data_despesa = "Indique a data da despesa.";
  else if (dados.data_despesa > hojeIso()) erros.data_despesa = "A data não pode ser futura.";
  if (String(dados.fornecedor || "").length > 200) erros.fornecedor = "Máximo de 200 caracteres.";
  if (String(dados.numero_factura || "").length > 50) erros.numero_factura = "Máximo de 50 caracteres.";
  if (String(dados.observacoes || "").length > REGRAS_CARTEIRA.maxTexto) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

const gravarDespesa = (id, mudar) => {
  const lista = lerLista(CHAVES_CARTEIRA.despesas);
  const idx = lista.findIndex((d) => String(d.id) === String(id));
  if (idx < 0) throw new Error("Despesa não encontrada.");
  lista[idx] = { ...mudar(lista[idx]), data_atualizacao: agoraIso() };
  gravarLista(CHAVES_CARTEIRA.despesas, lista);
  return lista[idx];
};

const debitarDespesa = (d, nome) => {
  const [transacao] = aplicarLancamentos([{
    carteiraId: d.wallet_id,
    delta: -d.valor,
    detalhe: {
      subtipo: "Despesa",
      categoria: d.categoria,
      descricao: `Despesa: ${d.categoria}${d.descricao ? ` · ${d.descricao}` : ""}`,
      referencia: d.numero_factura || d.codigo_despesa,
      expense_id: d.id,
      comprovativo: d.comprovativo,
      data: dataHora(d.data_despesa),
      utilizador: nome,
    },
  }]);
  return transacao;
};

export const registarDespesa = (dados, utilizador) => {
  const erros = validarDespesa(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const agora = agoraIso();
  const nome = nomeDe(utilizador);
  const valor = arredondar(Number(dados.valor));
  const despesa = {
    id: crypto.randomUUID(),
    codigo_despesa: proximoCodigo(CHAVES_CARTEIRA.despesas, "codigo_despesa", "DES"),
    wallet_id: Number(dados.wallet_id) || dados.wallet_id,
    categoria: dados.categoria,
    descricao: texto(dados.descricao),
    valor,
    data_despesa: dados.data_despesa,
    fornecedor: texto(dados.fornecedor),
    numero_factura: texto(dados.numero_factura),
    comprovativo: dados.comprovativo || null,
    status: "Pendente",
    exige_aprovacao: exigeAprovacao(valor),
    aprovado_por: null,
    data_aprovacao: null,
    transaction_id: null,
    observacoes: texto(dados.observacoes),
    historico: [{ data: agora, accao: "Despesa registada", por: nome }],
    registado_por: nome,
    data_registo: agora,
    data_atualizacao: agora,
  };
  gravarLista(CHAVES_CARTEIRA.despesas, [...lerLista(CHAVES_CARTEIRA.despesas), despesa]);
  if (dados.pagar_agora && !despesa.exige_aprovacao) {
    try {
      return pagarDespesa(despesa.id, utilizador);
    } catch (erro) {
      gravarLista(CHAVES_CARTEIRA.despesas, lerLista(CHAVES_CARTEIRA.despesas).filter((d) => d.id !== despesa.id));
      throw erro;
    }
  }
  return despesa;
};

export const aprovarDespesa = (id, utilizador) => {
  if (!eGestor(utilizador)) throw new Error(`Só o gestor pode aprovar despesas acima de ${formatarMT(REGRAS_CARTEIRA.aprovacaoAcima)}.`);
  const nome = nomeDe(utilizador);
  const agora = agoraIso();
  return gravarDespesa(id, (d) => {
    if (d.status !== "Pendente") throw new Error("Só despesas pendentes podem ser aprovadas.");
    return { ...d, status: "Aprovada", aprovado_por: nome, data_aprovacao: agora, historico: [...(d.historico || []), { data: agora, accao: "Despesa aprovada", por: nome }] };
  });
};

export const rejeitarDespesa = (id, motivo, utilizador) => {
  if (!eGestor(utilizador)) throw new Error("Só o gestor pode rejeitar despesas.");
  if (texto(motivo).length < 5) throw new Error("Indique o motivo da rejeição (mínimo 5 caracteres).");
  const nome = nomeDe(utilizador);
  const agora = agoraIso();
  return gravarDespesa(id, (d) => {
    if (!["Pendente", "Aprovada"].includes(d.status)) throw new Error("Só despesas pendentes ou aprovadas podem ser rejeitadas.");
    return { ...d, status: "Rejeitada", motivo_rejeicao: texto(motivo), historico: [...(d.historico || []), { data: agora, accao: `Despesa rejeitada: ${texto(motivo)}`, por: nome }] };
  });
};

export const pagarDespesa = (id, utilizador) => {
  const d = obterDespesa(id);
  if (!d) throw new Error("Despesa não encontrada.");
  if (d.exige_aprovacao ? d.status !== "Aprovada" : !["Pendente", "Aprovada"].includes(d.status)) {
    throw new Error(d.exige_aprovacao && d.status === "Pendente" ? "Esta despesa aguarda aprovação do gestor." : `Não é possível pagar uma despesa «${d.status}».`);
  }
  const nome = nomeDe(utilizador);
  const transacao = debitarDespesa(d, nome);
  const agora = agoraIso();
  return gravarDespesa(id, (x) => ({ ...x, status: "Paga", transaction_id: transacao.id, data_pagamento: agora, historico: [...(x.historico || []), { data: agora, accao: `Paga pela carteira (${transacao.codigo_transacao})`, por: nome }] }));
};

export const cancelarDespesa = (id, motivo, utilizador) => {
  const d = obterDespesa(id);
  if (!d) throw new Error("Despesa não encontrada.");
  if (!["Pendente", "Aprovada", "Paga"].includes(d.status)) throw new Error(`Não é possível cancelar uma despesa «${d.status}».`);
  if (texto(motivo).length < 5) throw new Error("Indique o motivo do cancelamento (mínimo 5 caracteres).");
  const nome = nomeDe(utilizador);
  const agora = agoraIso();
  let reversao = null;
  if (d.status === "Paga") {
    [reversao] = aplicarLancamentos([{
      carteiraId: d.wallet_id,
      delta: d.valor,
      detalhe: { subtipo: "Estorno", categoria: d.categoria, descricao: `Reversão despesa ${d.codigo_despesa}: ${texto(motivo)}`, expense_id: d.id, estorno_de: d.transaction_id, utilizador: nome, forcar: true },
    }]);
    if (d.transaction_id) marcarTransacoes([d.transaction_id], (t) => ({ ...t, status: "Estornada" }));
  }
  gravarDespesa(id, (x) => ({
    ...x,
    status: "Cancelada",
    motivo_cancelamento: texto(motivo),
    historico: [...(x.historico || []), { data: agora, accao: `Despesa cancelada${reversao ? " e valor devolvido à carteira" : ""}: ${texto(motivo)}`, por: nome }],
  }));
  return reversao ? obterTransacao(d.transaction_id) : obterDespesa(id);
};

export const eliminarDespesa = (id) => {
  const d = obterDespesa(id);
  if (!d) throw new Error("Despesa não encontrada.");
  if (d.status === "Paga") throw new Error("Cancele a despesa paga antes de a eliminar, para devolver o valor à carteira.");
  gravarLista(CHAVES_CARTEIRA.despesas, lerLista(CHAVES_CARTEIRA.despesas).filter((x) => String(x.id) !== String(id)));
  return d;
};

export const resumoDespesas = () => {
  const lista = listarDespesas();
  const mes = hojeIso().slice(0, 7);
  const pagasMes = lista.filter((d) => d.status === "Paga" && String(d.data_despesa).startsWith(mes));
  const porCategoria = CATEGORIAS_DESPESA.map((categoria) => ({
    categoria,
    total: arredondar(pagasMes.filter((d) => d.categoria === categoria).reduce((s, d) => s + d.valor, 0)),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  return {
    total: lista.length,
    pagoMes: arredondar(pagasMes.reduce((s, d) => s + d.valor, 0)),
    pagasMes: pagasMes.length,
    pendentes: lista.filter((d) => d.status === "Pendente").length,
    aguardamAprovacao: lista.filter((d) => d.status === "Pendente" && d.exige_aprovacao).length,
    aprovadas: lista.filter((d) => d.status === "Aprovada").length,
    porCategoria,
  };
};

// ---------- Fecho de caixa e conciliação ----------

export const registarFecho = ({ wallet_id, tipo, saldo_contado, observacoes, ajustar }, utilizador) => {
  const carteira = obterCarteira(wallet_id);
  if (!carteira) throw new Error("Carteira não encontrada.");
  const contado = Number(saldo_contado);
  if (saldo_contado === "" || !Number.isFinite(contado) || contado < 0) throw new Error("Indique o saldo contado/extracto (0 ou mais).");
  const nome = nomeDe(utilizador);
  const agora = agoraIso();
  const diferenca = arredondar(contado - Number(carteira.saldo || 0));
  let ajuste = null;
  if (ajustar && Math.abs(diferenca) > 0.005) {
    [ajuste] = aplicarLancamentos([{
      carteiraId: carteira.id,
      delta: diferenca,
      detalhe: { subtipo: "Ajuste", descricao: `${tipo === "Conciliação" ? "Conciliação bancária" : "Fecho de caixa"}: diferença de ${formatarMT(diferenca)}`, utilizador: nome, forcar: diferenca > 0 },
    }]);
  }
  const fecho = {
    id: crypto.randomUUID(),
    codigo: proximoCodigo(CHAVES_CARTEIRA.fechos, "codigo", tipo === "Conciliação" ? "CON" : "FCH"),
    wallet_id: carteira.id,
    tipo: tipo === "Conciliação" ? "Conciliação" : "Fecho de caixa",
    data: hojeIso(),
    saldo_sistema: Number(carteira.saldo || 0),
    saldo_contado: arredondar(contado),
    diferenca,
    ajustado: Boolean(ajuste),
    transaction_id: ajuste?.id || null,
    fluxo_dia: fluxoCarteira(carteira.id, hojeIso(), hojeIso()),
    observacoes: texto(observacoes),
    registado_por: nome,
    data_registo: agora,
  };
  gravarLista(CHAVES_CARTEIRA.fechos, [...lerLista(CHAVES_CARTEIRA.fechos), fecho]);
  return fecho;
};

export const fechoDeHoje = (carteiraId) => listarFechos(carteiraId).find((f) => f.data === hojeIso() && f.tipo === "Fecho de caixa") || null;

export { hojeIso };
