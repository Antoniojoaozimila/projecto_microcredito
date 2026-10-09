import { listarClientes, obterCliente } from "./clientesMicrocredito";
import { lerConfig } from "./configuracoesMicrocredito";

const CHAVE_EMPRESTIMOS = "microcredito-emprestimos-v1";
const CHAVE_CARTEIRAS = "microcredito-carteiras-v2";

const numeroConfig = (chave, padrao) => {
  const valor = Number(lerConfig()[chave]);
  return Number.isFinite(valor) ? valor : padrao;
};

export const regrasActuais = () => {
  const config = lerConfig();
  return {
    valorMinimo: numeroConfig("valor_minimo_emprestimo", 100),
    valorMaximo: numeroConfig("valor_maximo_emprestimo", 1000000),
    prazoMinimo: numeroConfig("prazo_minimo_parcelas", 1),
    prazoMaximo: numeroConfig("prazo_maximo_parcelas", 52),
    idadeMinima: numeroConfig("idade_minima_cliente", 18),
    idadeMaxima: numeroConfig("idade_maxima_cliente", 70),
    scoreMinimo: numeroConfig("score_minimo_aprovacao", 400),
    maxActivos: numeroConfig("max_emprestimos_ativos", 2),
    garantiaAcima: numeroConfig("garantia_obrigatoria_acima", 50000),
    aprovacaoGestorAcima: numeroConfig("aprovacao_gestor_acima", 100000),
    diasCarencia: numeroConfig("dias_carencia", 0),
    multaDiaria: numeroConfig("taxa_multa_atraso", 2),
    taxaPadrao: numeroConfig("taxa_juros_padrao", 20),
    tipoJurosPadrao: config.tipo_juros_padrao || "Simples",
    sistemaPadrao: config.sistema_amortizacao_padrao || "Tabela Price",
    diasPenhor: numeroConfig("dias_para_penhor", 90),
    diasExecucao: numeroConfig("dias_para_execucao", 180),
    maxClientesRota: numeroConfig("max_clientes_rota", 15),
    raioMaxKm: numeroConfig("raio_max_cobranca_km", 20),
    metaMensal: numeroConfig("meta_mensal_cobrador", 500000),
    comissaoCobrador: numeroConfig("comissao_cobrador", 5),
    diasLembreteAntes: numeroConfig("dias_lembrete_antes", 3),
    diasLembreteApos: numeroConfig("dias_lembrete_apos", 1),
    moeda: config.moeda_padrao || "MZN",
    nomeEmpresa: config.nome_empresa || "Mukuru Finance",
  };
};

export const REGRAS = new Proxy({}, {
  get: (_alvo, chave) => regrasActuais()[chave],
});

export const MODALIDADES = [
  { id: "Diária", dias: 1, max: 365, periodo: "ao dia", antigos: ["Diário"] },
  { id: "Semanal", dias: 7, max: 52, periodo: "por semana" },
  { id: "Quinzenal", dias: 15, max: 52, periodo: "por quinzena" },
  { id: "Mensal", meses: 1, max: 60, periodo: "ao mês" },
  { id: "Trimestral", meses: 3, max: 20, periodo: "por trimestre" },
  { id: "Semestral", meses: 6, max: 10, periodo: "por semestre" },
  { id: "Anual", meses: 12, max: 10, periodo: "ao ano" },
];

export const obterModalidade = (id) => MODALIDADES.find((m) => m.id === id || m.antigos?.includes(id));

export const periodoTaxa = (emprestimo) =>
  emprestimo?.taxa_periodo || (emprestimo?.data_registo ? "ao ano" : obterModalidade(emprestimo?.modalidade)?.periodo || "ao mês");

export const TIPOS_JUROS = [
  { id: "Simples", label: "Juros Simples" },
  { id: "Composto", label: "Juros Compostos" },
  { id: "Saldo", label: "Sobre Saldo Devedor" },
  { id: "Outro", label: "Outros" },
];

export const SISTEMAS = [
  { id: "Tabela Price", label: "Tabela Price (Parcelas Fixas)" },
  { id: "SAC", label: "SAC (Amortização Constante)" },
  { id: "Americano", label: "Americano" },
  { id: "Bullet", label: "Bullet (Pagamento Único)" },
  { id: "Outro", label: "Outros" },
];

export const OUTRO = "Outro";

export const TIPOS_GARANTIA = [
  "Sem Garantia (Crédito Pessoal)",
  "Aval/Fiador",
  "Bem Móvel (Carro, Moto, etc)",
  "Bem Imóvel (Casa, Terreno)",
  "Cheque Caução",
  "Outros",
];

export const SEM_GARANTIA = TIPOS_GARANTIA[0];
export const GARANTIA_OUTROS = "Outros";

const CARTEIRAS_INICIAIS = [
  { id: 1, nome: "Caixa", tipo: "Numerário", logo: "caixa", saldo: 80419 },
  { id: 2, nome: "M-Pesa", tipo: "Carteira móvel", logo: "mpesa", saldo: 150000 },
  { id: 3, nome: "E-Mola", tipo: "Carteira móvel", logo: "emola", saldo: 95000 },
  { id: 5, nome: "Mkesh", tipo: "Carteira móvel", logo: "mkesh", saldo: 60000 },
  { id: 6, nome: "BCI", tipo: "Banco", logo: "bci", saldo: 500000 },
  { id: 7, nome: "Millennium bim", tipo: "Banco", logo: "bim", saldo: 450000 },
  { id: 8, nome: "Standard Bank", tipo: "Banco", logo: "standard", saldo: 400000 },
  { id: 9, nome: "Banco Letshego", tipo: "Banco", logo: "letshego", saldo: 250000 },
  { id: 10, nome: "Moza", tipo: "Banco", logo: "moza", saldo: 300000 },
];

export const rotuloJuros = (tipo) =>
  tipo === "Simples" ? "Juros simples" : tipo === "Composto" ? "Juros compostos" : tipo === "Saldo" ? "Juros sobre saldo devedor" : tipo || "—";

const lerJson = (chave, padrao) => {
  try {
    const bruto = localStorage.getItem(chave);
    const valor = bruto ? JSON.parse(bruto) : padrao;
    return Array.isArray(valor) ? valor : padrao;
  } catch {
    return padrao;
  }
};

const gravarJson = (chave, valor) => {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    if (erro?.name === "QuotaExceededError") throw new Error("O armazenamento do navegador está cheio. Não foi possível gravar os dados.");
    throw erro;
  }
};

export const CHAVES_CARTEIRA = {
  carteiras: CHAVE_CARTEIRAS,
  transacoes: "microcredito-transacoes-v1",
  movimentos: "microcredito-carteiras-movimentos-v1",
  transferencias: "microcredito-transferencias-v1",
  despesas: "microcredito-despesas-v1",
  fechos: "microcredito-carteiras-fechos-v1",
};

const TIPO_POR_LOGO = { caixa: "Caixa", mpesa: "Mpesa", emola: "E-Mola", mkesh: "Outro" };
const TIPOS_ANTIGOS = { "Numerário": "Caixa", "Carteira móvel": "Outro" };
const CODIGOS_INICIAIS = { caixa: "CAIXA", mpesa: "MPESA", emola: "EMOLA", mkesh: "MKESH", bci: "BCI", bim: "BIM", standard: "SBM", letshego: "LETSHEGO", moza: "MOZA" };

const normalizarCarteira = (c, agora) => {
  if (c.codigo && c.status) return c;
  const tipo = TIPO_POR_LOGO[c.logo] || TIPOS_ANTIGOS[c.tipo] || (c.tipo === "Banco" ? "Banco" : c.tipo || "Outro");
  return {
    descricao: "",
    numero_conta: "",
    iban: "",
    titular: "",
    agencia: "",
    saldo_bloqueado: 0,
    moeda: "MZN",
    limite_minimo: null,
    limite_maximo: null,
    responsavel: "",
    observacoes: "",
    data_registo: agora,
    criado_por: "Sistema",
    ...c,
    codigo: c.codigo || CODIGOS_INICIAIS[c.logo] || String(c.nome || "CART").normalize("NFD").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20),
    tipo,
    saldo_inicial: c.saldo_inicial ?? Number(c.saldo || 0),
    status: c.status || "Ativa",
    data_atualizacao: c.data_atualizacao || agora,
  };
};

export const listarCarteiras = () => {
  const guardadas = lerJson(CHAVE_CARTEIRAS, null);
  const agora = new Date().toISOString();
  if (guardadas) {
    if (guardadas.every((c) => c.codigo && c.status)) return guardadas;
    const normalizadas = guardadas.map((c) => normalizarCarteira(c, agora));
    gravarJson(CHAVE_CARTEIRAS, normalizadas);
    return normalizadas;
  }
  const antigas = lerJson("microcredito-carteiras-v1", []);
  const iniciais = CARTEIRAS_INICIAIS.map((c) => {
    const antiga = antigas.find((a) => a.id === c.id && a.nome === c.nome);
    return normalizarCarteira(antiga ? { ...c, saldo: antiga.saldo } : c, agora);
  });
  gravarJson(CHAVE_CARTEIRAS, iniciais);
  return iniciais;
};

export const gravarCarteiras = (lista) => gravarJson(CHAVE_CARTEIRAS, lista);

export const saldoDisponivel = (carteira) => arredondar(Number(carteira?.saldo || 0) - Number(carteira?.saldo_bloqueado || 0));

export const carteiraOperacional = (carteira) => carteira?.status === "Ativa";

export const carteirasOperacionais = () => listarCarteiras().filter(carteiraOperacional);

const proximoCodigoDe = (lista, campo, sigla) => {
  const prefixo = `${sigla}-${new Date().getFullYear()}-`;
  const maior = lista
    .map((x) => String(x[campo] || ""))
    .filter((n) => n.startsWith(prefixo))
    .reduce((m, n) => Math.max(m, Number(n.slice(prefixo.length)) || 0), 0);
  return `${prefixo}${String(maior + 1).padStart(6, "0")}`;
};

export const proximoCodigo = (chave, campo, sigla) => proximoCodigoDe(lerJson(chave, []), campo, sigla);

export const lerLista = (chave) => lerJson(chave, []);

export const gravarLista = (chave, lista) => gravarJson(chave, lista);

export const aplicarLancamentos = (lancamentos) => {
  const carteiras = listarCarteiras();
  const transacoes = lerJson(CHAVES_CARTEIRA.transacoes, []);
  const movimentos = lerJson(CHAVES_CARTEIRA.movimentos, []);
  const agora = new Date().toISOString();
  const saldos = Object.fromEntries(carteiras.map((c) => [String(c.id), Number(c.saldo || 0)]));
  const criadas = [];

  lancamentos.forEach(({ carteiraId, delta, detalhe = {} }) => {
    const carteira = carteiras.find((c) => String(c.id) === String(carteiraId));
    if (!carteira) throw new Error("Carteira não encontrada.");
    const valor = arredondar(Number(delta) || 0);
    if (!valor) return;
    if (!detalhe.forcar && !carteiraOperacional(carteira)) throw new Error(`A carteira ${carteira.nome} está ${String(carteira.status).toLowerCase()} e não aceita operações.`);
    const anterior = saldos[String(carteira.id)];
    const posterior = arredondar(anterior + valor);
    const minimo = detalhe.forcar ? 0 : Number(carteira.saldo_bloqueado || 0);
    if (valor < 0 && posterior < minimo - 0.005) {
      throw new Error(`A carteira ${carteira.nome} não tem saldo disponível suficiente (disponível: ${formatarMT(anterior - minimo)}).`);
    }
    saldos[String(carteira.id)] = posterior;
    const data = detalhe.data || agora;
    const tipo = detalhe.tipo || (valor > 0 ? "Entrada" : "Saída");
    const transacao = {
      id: crypto.randomUUID(),
      codigo_transacao: proximoCodigoDe([...transacoes, ...criadas.map((c) => c.transacao)], "codigo_transacao", "TRX"),
      wallet_id: carteira.id,
      tipo,
      subtipo: detalhe.subtipo || "Ajuste",
      sinal: valor > 0 ? 1 : -1,
      valor: Math.abs(valor),
      saldo_anterior: anterior,
      saldo_posterior: posterior,
      descricao: detalhe.descricao || tipo,
      categoria: detalhe.categoria || null,
      referencia: detalhe.referencia || null,
      payment_id: detalhe.payment_id || null,
      loan_id: detalhe.loan_id || null,
      expense_id: detalhe.expense_id || null,
      transfer_id: detalhe.transfer_id || null,
      wallet_destino_id: detalhe.wallet_destino_id || null,
      estorno_de: detalhe.estorno_de || null,
      data_transacao: data,
      comprovativo: detalhe.comprovativo || null,
      status: "Confirmada",
      observacoes: detalhe.observacoes || "",
      registado_por: detalhe.utilizador || "Sistema",
      data_registo: agora,
      data_atualizacao: agora,
    };
    const movimento = {
      id: crypto.randomUUID(),
      wallet_id: carteira.id,
      transaction_id: transacao.id,
      transfer_id: transacao.transfer_id,
      expense_id: transacao.expense_id,
      tipo_movimento: tipo,
      sinal: transacao.sinal,
      valor: transacao.valor,
      saldo_anterior: anterior,
      saldo_posterior: posterior,
      descricao: transacao.descricao,
      data_movimento: data,
      registado_por: transacao.registado_por,
    };
    criadas.push({ transacao, movimento });
  });

  gravarJson(CHAVE_CARTEIRAS, carteiras.map((c) => (saldos[String(c.id)] !== Number(c.saldo || 0) ? { ...c, saldo: saldos[String(c.id)], data_atualizacao: agora } : c)));
  gravarJson(CHAVES_CARTEIRA.transacoes, [...transacoes, ...criadas.map((c) => c.transacao)]);
  gravarJson(CHAVES_CARTEIRA.movimentos, [...movimentos, ...criadas.map((c) => c.movimento)]);
  return criadas.map((c) => c.transacao);
};

export const ajustarSaldoCarteira = (id, delta, detalhe = {}) => {
  aplicarLancamentos([{ carteiraId: id, delta, detalhe }]);
  return listarCarteiras().find((c) => String(c.id) === String(id));
};

const ler = () => lerJson(CHAVE_EMPRESTIMOS, []);
const gravar = (lista) => gravarJson(CHAVE_EMPRESTIMOS, lista);

export const diasEntre = (inicio, fim) =>
  Math.max(0, Math.floor((new Date(`${String(fim).slice(0, 10)}T00:00:00`) - new Date(`${String(inicio).slice(0, 10)}T00:00:00`)) / 86400000));

export const multaCalculada = (parcela, dataIso) =>
  arredondar(Number(parcela.valor_parcela || 0) * (REGRAS.multaDiaria / 100) * diasEntre(parcela.data_vencimento, dataIso));

export const multaPendente = (parcela, dataIso) => Math.max(0, arredondar(multaCalculada(parcela, dataIso) - Number(parcela.multa_paga || 0)));

/** 0,04% — taxa do imposto de selo no mapa do cliente, aplicada ao saldo com juro de mora. */
export const TAXA_IMPOSTO_SELO = 0.04;

/**
 * Mapa da operação, na lógica do mapa do cliente.
 * Juros = juros contratuais ainda em dívida (num período único, capital × taxa).
 * Mora diária = (capital em risco + juros) × taxa do contrato / 30.
 * Saldo com mora = capital + juros + (mora diária × dias vencidos).
 * Imposto de selo = esse saldo × 0,04%, fora do saldo.
 */
export const calcularMapaOperacao = (emprestimo, dataIso = new Date().toISOString().slice(0, 10)) => {
  const dia = String(dataIso || "").slice(0, 10);
  const abertas = (emprestimo?.parcelas || []).filter((p) => p.status !== "Pago" && p.status !== "Cancelado");
  const capital = arredondar(abertas.reduce((s, p) => s + Math.max(0, Number(p.valor_principal || 0) - Number(p.principal_pago || 0)), 0));
  const juros = arredondar(abertas.reduce((s, p) => s + Math.max(0, Number(p.valor_juros || 0) - Number(p.juros_pago || 0)), 0));
  const taxa = Number(emprestimo?.taxa_juros || 0) / 100;
  const moraDiariaValor = (capital + juros) * taxa / 30;
  const diasVencidos = abertas.reduce((maximo, p) => {
    if (!p.data_vencimento || String(p.data_vencimento).slice(0, 10) >= dia) return maximo;
    return Math.max(maximo, diasEntre(p.data_vencimento, dia));
  }, 0);
  const moraAcumulada = arredondar(moraDiariaValor * diasVencidos);
  const saldoComMora = arredondar(capital + juros + moraAcumulada);
  const impostoSelo = arredondar(saldoComMora * (TAXA_IMPOSTO_SELO / 100));
  return {
    capital,
    juros,
    taxa: Number(emprestimo?.taxa_juros || 0),
    moraDiaria: arredondar(moraDiariaValor),
    diasVencidos,
    moraAcumulada,
    saldoComMora,
    impostoSelo,
    taxaSelo: TAXA_IMPOSTO_SELO,
  };
};

export const actualizarAtrasos = (emprestimo, hoje = new Date()) => {
  const dia = hoje.toISOString().slice(0, 10);
  let emAtraso = false;
  const parcelas = (emprestimo.parcelas || []).map((p) => {
    if (p.status === "Pago" || p.status === "Cancelado" || emprestimo.status !== "Ativo") return p;
    if (p.data_vencimento < dia) {
      const dias = diasEntre(p.data_vencimento, dia);
      emAtraso = true;
      return {
        ...p,
        status: p.valor_pago > 0 ? "Parcialmente Pago" : "Atrasado",
        dias_atraso: dias,
        multa: multaPendente(p, dia),
      };
    }
    return p;
  });
  return {
    ...emprestimo,
    parcelas,
    status: emprestimo.status === "Ativo" && emAtraso ? "Em Atraso" : emprestimo.status,
  };
};

export const listarEmprestimos = () =>
  ler()
    .map((e) => actualizarAtrasos(e))
    .sort((a, b) => String(b.data_registo).localeCompare(String(a.data_registo)));

export const obterEmprestimo = (id) => {
  const e = ler().find((item) => String(item.id) === String(id));
  return e ? actualizarAtrasos(e) : null;
};

const ESTADOS_ACTIVOS = ["Pendente", "Ativo", "Em Atraso", "Vencido"];

export const emprestimosActivosDoCliente = (clientId) =>
  listarEmprestimos().filter((e) => String(e.client_id) === String(clientId) && ESTADOS_ACTIVOS.includes(e.status));

export const limiteDisponivel = (cliente) => {
  if (!cliente) return 0;
  const usado = emprestimosActivosDoCliente(cliente.id).reduce((soma, e) => soma + Number(e.saldo_devedor || 0), 0);
  return Math.max(0, Number(cliente.limite_credito || 0) - usado);
};

export const clientesParaEmprestimo = () =>
  listarClientes().map((c) => ({
    ...c,
    limite_disponivel: limiteDisponivel(c),
    emprestimos_activos: emprestimosActivosDoCliente(c.id).length,
  }));

export const arredondar = (valor) => Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

const somarPeriodo = (inicio, modalidade, indice, diaVencimento) => {
  const data = new Date(`${inicio}T00:00:00`);
  const regra = obterModalidade(modalidade);
  if (regra?.meses) {
    const primeiro = /^\d{4}-\d{2}-\d{2}$/.test(String(diaVencimento || "")) ? new Date(`${diaVencimento}T00:00:00`) : null;
    const base = primeiro || data;
    const alvo = new Date(base.getFullYear(), base.getMonth() + regra.meses * (primeiro ? indice - 1 : indice), 1);
    const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    alvo.setDate(Math.min(primeiro ? primeiro.getDate() : Number(diaVencimento) || data.getDate(), ultimoDia));
    return alvo;
  }
  const dias = regra?.dias || 30;
  data.setDate(data.getDate() + dias * indice);
  return data;
};

const paraIso = (data) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

export const calcularEmprestimo = ({ valor, taxa, parcelas, modalidade, tipoJuros: tipoEscolhido, sistema: sistemaEscolhido, dataInicio, diaVencimento }) => {
  const tipoJuros = ["Composto", "Saldo"].includes(tipoEscolhido) ? tipoEscolhido : "Simples";
  const sistema = SISTEMAS.some((s) => s.id === sistemaEscolhido && s.id !== OUTRO) ? sistemaEscolhido : "Tabela Price";
  const principal = Number(valor) || 0;
  const n = Math.max(0, Math.floor(Number(parcelas) || 0));
  const i = (Number(taxa) || 0) / 100;

  if (!principal || !n || !dataInicio) {
    return { cronograma: [], totalJuros: 0, totalReceber: principal, valorParcela: 0, ultimoVencimento: dataInicio || "" };
  }

  const datas = Array.from({ length: n }, (_, k) => paraIso(somarPeriodo(dataInicio, modalidade, k + 1, diaVencimento)));
  const cronograma = [];
  let saldo = principal;

  if (tipoJuros === "Simples" && sistema === "Tabela Price") {
    const juros = arredondar(principal * i * n);
    const jurosParcela = arredondar(juros / n);
    const principalParcela = arredondar(principal / n);
    for (let k = 0; k < n; k += 1) {
      const ultima = k === n - 1;
      const amort = ultima ? arredondar(saldo) : principalParcela;
      const jurosK = ultima ? arredondar(juros - jurosParcela * (n - 1)) : jurosParcela;
      saldo = arredondar(saldo - amort);
      cronograma.push({ num_parcela: k + 1, valor_parcela: arredondar(amort + jurosK), valor_juros: jurosK, valor_principal: amort, saldo_apos_pagamento: Math.max(0, saldo), data_vencimento: datas[k] });
    }
  } else if (sistema === "Tabela Price") {
    const parcela = i === 0 ? principal / n : (principal * i) / (1 - (1 + i) ** -n);
    for (let k = 0; k < n; k += 1) {
      const jurosK = arredondar(saldo * i);
      const amort = k === n - 1 ? arredondar(saldo) : arredondar(parcela - jurosK);
      saldo = arredondar(saldo - amort);
      cronograma.push({ num_parcela: k + 1, valor_parcela: arredondar(amort + jurosK), valor_juros: jurosK, valor_principal: amort, saldo_apos_pagamento: Math.max(0, saldo), data_vencimento: datas[k] });
    }
  } else if (sistema === "SAC") {
    const amortBase = arredondar(principal / n);
    for (let k = 0; k < n; k += 1) {
      const jurosK = arredondar(tipoJuros === "Simples" ? principal * i : saldo * i);
      const amort = k === n - 1 ? arredondar(saldo) : amortBase;
      saldo = arredondar(saldo - amort);
      cronograma.push({ num_parcela: k + 1, valor_parcela: arredondar(amort + jurosK), valor_juros: jurosK, valor_principal: amort, saldo_apos_pagamento: Math.max(0, saldo), data_vencimento: datas[k] });
    }
  } else if (sistema === "Americano") {
    const jurosBase = arredondar(principal * i);
    const jurosTotal = arredondar(principal * i * n);
    for (let k = 0; k < n; k += 1) {
      const ultima = k === n - 1;
      const amort = ultima ? principal : 0;
      const jurosK = ultima ? arredondar(jurosTotal - jurosBase * (n - 1)) : jurosBase;
      cronograma.push({ num_parcela: k + 1, valor_parcela: arredondar(amort + jurosK), valor_juros: jurosK, valor_principal: amort, saldo_apos_pagamento: ultima ? 0 : principal, data_vencimento: datas[k] });
    }
  } else {
    const juros = tipoJuros === "Composto" ? principal * ((1 + i) ** n - 1) : principal * i * n;
    cronograma.push({ num_parcela: 1, valor_parcela: arredondar(principal + juros), valor_juros: arredondar(juros), valor_principal: principal, saldo_apos_pagamento: 0, data_vencimento: datas[n - 1] });
  }

  const totalJuros = arredondar(cronograma.reduce((s, p) => s + p.valor_juros, 0));
  const totalReceber = arredondar(principal + totalJuros);
  return {
    cronograma,
    totalJuros,
    totalReceber,
    valorParcela: cronograma[0]?.valor_parcela || 0,
    ultimoVencimento: cronograma[cronograma.length - 1]?.data_vencimento || dataInicio,
  };
};

const proximoContrato = (lista) => {
  const ano = new Date().getFullYear();
  const prefixo = `EMP-${ano}-`;
  const maior = lista
    .map((e) => String(e.numero_contrato || ""))
    .filter((n) => n.startsWith(prefixo))
    .reduce((m, n) => Math.max(m, Number(n.slice(prefixo.length)) || 0), 0);
  return `${prefixo}${String(maior + 1).padStart(6, "0")}`;
};

export const validarCriacao = (dados) => {
  const erros = {};
  const cliente = obterCliente(dados.client_id);
  const valor = Number(dados.valor_emprestado);
  if (!cliente) {
    erros.client_id = "Seleccione o cliente.";
    return erros;
  }
  if (!cliente.cliente_ativo) erros.client_id = "Este cliente está inactivo e não pode receber empréstimos.";
  if (Number(cliente.score) < REGRAS.scoreMinimo) erros.client_id = `Clientes com score abaixo de ${REGRAS.scoreMinimo} não podem pedir empréstimos.`;
  if (emprestimosActivosDoCliente(cliente.id).length >= REGRAS.maxActivos) erros.client_id = `O cliente já tem ${REGRAS.maxActivos} empréstimos activos.`;
  const limite = limiteDisponivel(cliente);
  if (!Number.isFinite(valor) || valor < REGRAS.valorMinimo) erros.valor_emprestado = `O valor mínimo é ${REGRAS.valorMinimo} MT.`;
  else if (valor > REGRAS.valorMaximo) erros.valor_emprestado = `O valor máximo é ${formatarMT(REGRAS.valorMaximo)}.`;
  else if (valor > limite) erros.valor_emprestado = `Excede o limite disponível do cliente (${formatarMT(limite)}).`;
  const modalidade = obterModalidade(dados.modalidade);
  const n = Number(dados.num_parcelas);
  const prazoMaximo = Math.min(REGRAS.prazoMaximo, modalidade?.max || REGRAS.prazoMaximo);
  if (!modalidade) erros.modalidade = "Seleccione a modalidade.";
  if (!Number.isInteger(n) || n < REGRAS.prazoMinimo || n > prazoMaximo) erros.num_parcelas = `Entre ${REGRAS.prazoMinimo} e ${prazoMaximo} parcelas.`;
  const taxa = Number(dados.taxa_juros);
  if (!Number.isFinite(taxa) || taxa < 0 || taxa > 999) erros.taxa_juros = "Indique uma taxa válida.";
  const hoje = new Date().toISOString().slice(0, 10);
  if (!dados.data_inicio || dados.data_inicio < hoje) erros.data_inicio = "Use a data de hoje ou uma data futura.";
  if (modalidade?.meses) {
    if (!dados.dia_vencimento) erros.dia_vencimento = "Escolha a data do primeiro vencimento.";
    else if (dados.data_inicio && dados.dia_vencimento <= dados.data_inicio) erros.dia_vencimento = "Deve ser posterior à data de início.";
    else if (dados.data_inicio && REGRAS.diasCarencia > 0 && diasEntre(dados.data_inicio, dados.dia_vencimento) < REGRAS.diasCarencia) {
      erros.dia_vencimento = `A carência configurada é de ${REGRAS.diasCarencia} dia(s).`;
    }
  }
  if (dados.tipo_juros === OUTRO && !String(dados.tipo_juros_outro || "").trim()) erros.tipo_juros = "Indique o tipo de juros.";
  if (dados.sistema_amortizacao === OUTRO && !String(dados.sistema_outro || "").trim()) erros.sistema_amortizacao = "Indique o sistema de amortização.";
  if (!dados.garantia_tipo) erros.garantia_tipo = "Seleccione o tipo de garantia.";
  if (dados.garantia_tipo === GARANTIA_OUTROS && !String(dados.garantia_outra || "").trim()) erros.garantia_outra = "Indique o tipo de garantia.";
  if (valor > REGRAS.garantiaAcima && dados.garantia_tipo === SEM_GARANTIA) erros.garantia_tipo = `Empréstimos acima de ${formatarMT(REGRAS.garantiaAcima)} exigem garantia.`;
  if (dados.garantia_tipo && dados.garantia_tipo !== SEM_GARANTIA) {
    if (!String(dados.garantia_descricao || "").trim()) erros.garantia_descricao = "Descreva a garantia.";
    if (!(Number(dados.garantia_valor) > 0)) erros.garantia_valor = "Indique o valor estimado.";
    if (!dados.garantia_documentos?.length) erros.garantia_documentos = "Anexe os documentos da garantia.";
  }
  const carteira = listarCarteiras().find((c) => String(c.id) === String(dados.carteira_id));
  if (!carteira) erros.carteira_id = "Seleccione a carteira.";
  else if (!carteiraOperacional(carteira)) erros.carteira_id = `A carteira está ${String(carteira.status).toLowerCase()}.`;
  else if (saldoDisponivel(carteira) < valor) erros.carteira_id = "A carteira não tem saldo disponível suficiente.";
  if (String(dados.observacoes || "").length > 5000) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

export const criarEmprestimo = (dados, utilizador) => {
  const lista = ler();
  const agora = new Date().toISOString();
  const calculo = calcularEmprestimo({
    valor: dados.valor_emprestado,
    taxa: dados.taxa_juros,
    parcelas: dados.num_parcelas,
    modalidade: dados.modalidade,
    tipoJuros: dados.tipo_juros,
    sistema: dados.sistema_amortizacao,
    dataInicio: dados.data_inicio,
    diaVencimento: dados.dia_vencimento,
  });
  const id = crypto.randomUUID();
  const novo = {
    ...dados,
    id,
    numero_contrato: proximoContrato(lista),
    moeda: REGRAS.moeda,
    valor_emprestado: Number(dados.valor_emprestado),
    taxa_juros: Number(dados.taxa_juros),
    taxa_periodo: obterModalidade(dados.modalidade)?.periodo || "ao mês",
    num_parcelas: calculo.cronograma.length,
    valor_parcela: calculo.valorParcela,
    valor_total_juros: calculo.totalJuros,
    valor_total_receber: calculo.totalReceber,
    valor_pago: 0,
    saldo_devedor: calculo.totalReceber,
    tipo_juros: dados.tipo_juros === OUTRO ? dados.tipo_juros_outro.trim() : dados.tipo_juros,
    sistema_amortizacao: dados.sistema_amortizacao === OUTRO ? dados.sistema_outro.trim() : dados.sistema_amortizacao,
    garantia_tipo: dados.garantia_tipo === GARANTIA_OUTROS ? dados.garantia_outra.trim() : dados.garantia_tipo,
    data_vencimento: calculo.ultimoVencimento,
    data_primeiro_vencimento: calculo.cronograma[0]?.data_vencimento || null,
    dia_vencimento: obterModalidade(dados.modalidade)?.meses ? Number(String(dados.dia_vencimento).slice(8, 10)) : null,
    status: "Pendente",
    fase_atual: "Análise",
    exige_gestor: Number(dados.valor_emprestado) > REGRAS.aprovacaoGestorAcima,
    parcelas: calculo.cronograma.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      loan_id: id,
      data_pagamento: null,
      valor_pago: 0,
      status: "Pendente",
      dias_atraso: 0,
      multa: 0,
      data_registo: agora,
      data_atualizacao: agora,
    })),
    historico: [{ data: agora, accao: "Empréstimo criado", por: utilizador?.nome || "Sistema" }],
    data_registo: agora,
    data_atualizacao: agora,
    criado_por: utilizador?.nome || "Sistema",
  };
  lista.push(novo);
  gravar(lista);
  return novo;
};

export const alterarEmprestimo = (id, mudar) => alterar(id, mudar);

const alterar = (id, mudar) => {
  const lista = ler();
  const idx = lista.findIndex((e) => String(e.id) === String(id));
  if (idx < 0) throw new Error("Empréstimo não encontrado.");
  lista[idx] = { ...mudar(lista[idx]), data_atualizacao: new Date().toISOString() };
  gravar(lista);
  return lista[idx];
};

export const aprovarEmprestimo = (id, utilizador) => {
  const emprestimo = obterEmprestimo(id);
  if (!emprestimo || emprestimo.status !== "Pendente") throw new Error("Só empréstimos pendentes podem ser aprovados.");
  if (emprestimo.exige_gestor && !["admin", "gestor"].includes(String(utilizador?.tipo || "").toLowerCase())) {
    throw new Error(`Empréstimos acima de ${formatarMT(REGRAS.aprovacaoGestorAcima)} exigem aprovação do gestor.`);
  }
  if (Number(emprestimo.valor_emprestado) > REGRAS.garantiaAcima) {
    const coberto = lerJson(CHAVES_LIGADAS.garantias, [])
      .filter((g) => String(g.loan_id) === String(id) && g.status === "Ativa")
      .reduce((s, g) => s + (Number(g.valor_avaliado || 0) || Number(g.valor_estimado || 0)), 0);
    if (coberto < Number(emprestimo.valor_emprestado)) {
      throw new Error(`Empréstimos acima de ${formatarMT(REGRAS.garantiaAcima)} exigem garantia activa de pelo menos ${formatarMT(emprestimo.valor_emprestado)} (actual: ${formatarMT(coberto)}). Registe e aprove a garantia no menu Garantias.`);
    }
  }
  const carteira = listarCarteiras().find((c) => String(c.id) === String(emprestimo.carteira_id));
  if (!carteira || saldoDisponivel(carteira) < emprestimo.valor_emprestado) throw new Error("A carteira não tem saldo suficiente para o desembolso.");
  const agora = new Date().toISOString();
  const nome = utilizador?.nome || "Sistema";
  aplicarLancamentos([{
    carteiraId: carteira.id,
    delta: -Number(emprestimo.valor_emprestado),
    detalhe: { subtipo: "Desembolso Empréstimo", descricao: `Desembolso ${emprestimo.numero_contrato}`, loan_id: emprestimo.id, utilizador: nome },
  }]);
  return alterar(id, (e) => ({
    ...e,
    status: "Ativo",
    fase_atual: "Em Curso",
    aprovado_por: nome,
    data_aprovacao: agora,
    desembolsado_por: nome,
    data_desembolso: agora,
    documento_contrato: `${e.numero_contrato}.pdf`,
    historico: [
      ...(e.historico || []),
      { data: agora, accao: "Empréstimo aprovado", por: nome },
      { data: agora, accao: `Desembolso de ${formatarMT(e.valor_emprestado)} pela carteira ${carteira.nome}`, por: nome },
      { data: agora, accao: "Contrato gerado", por: nome },
    ],
  }));
};

export const rejeitarEmprestimo = (id, utilizador, motivo) => {
  const agora = new Date().toISOString();
  return alterar(id, (e) => {
    if (e.status !== "Pendente") throw new Error("Só empréstimos pendentes podem ser rejeitados.");
    return {
      ...e,
      status: "Rejeitado",
      fase_atual: "Concluído",
      parcelas: e.parcelas.map((p) => ({ ...p, status: "Cancelado" })),
      historico: [...(e.historico || []), { data: agora, accao: `Empréstimo rejeitado${motivo ? `: ${motivo}` : ""}`, por: utilizador?.nome || "Sistema" }],
    };
  });
};

export const cancelarEmprestimo = (id, utilizador) => {
  const agora = new Date().toISOString();
  return alterar(id, (e) => {
    if (e.status !== "Pendente") throw new Error("Só empréstimos pendentes podem ser cancelados.");
    return {
      ...e,
      status: "Cancelado",
      fase_atual: "Concluído",
      parcelas: e.parcelas.map((p) => ({ ...p, status: "Cancelado" })),
      historico: [...(e.historico || []), { data: agora, accao: "Empréstimo cancelado", por: utilizador?.nome || "Sistema" }],
    };
  });
};

export const CHAVES_LIGADAS = {
  pagamentos: "microcredito-pagamentos-v1",
  alocacoes: "microcredito-alocacoes-v1",
  garantias: "microcredito-garantias-v1",
  avalistas: "microcredito-avalistas-v1",
  movimentosGarantia: "microcredito-garantias-movimentos-v1",
};

export const eliminarEmprestimo = (id) => {
  const emprestimo = ler().find((e) => String(e.id) === String(id));
  if (!emprestimo) throw new Error("Empréstimo não encontrado.");
  const pagamentos = lerJson(CHAVES_LIGADAS.pagamentos, []).filter((p) => String(p.loan_id) === String(id));
  const deltas = {};
  const somar = (carteira, valor) => { deltas[carteira] = arredondar((deltas[carteira] || 0) + valor); };
  if (emprestimo.data_desembolso) somar(emprestimo.carteira_id, Number(emprestimo.valor_emprestado || 0));
  pagamentos.filter((p) => p.status === "Confirmado").forEach((p) => somar(p.carteira_id, -Number(p.valor_pago || 0)));
  const carteiras = listarCarteiras();
  Object.entries(deltas).forEach(([carteira, delta]) => {
    const c = carteiras.find((x) => String(x.id) === String(carteira));
    if (c && c.saldo + delta < 0) throw new Error(`A carteira ${c.nome} não tem saldo para reverter os pagamentos deste empréstimo.`);
  });
  aplicarLancamentos(Object.entries(deltas).map(([carteira, delta]) => ({
    carteiraId: carteira,
    delta,
    detalhe: { tipo: delta > 0 ? "Entrada" : "Saída", subtipo: "Estorno", descricao: `Eliminação do empréstimo ${emprestimo.numero_contrato}`, loan_id: emprestimo.id, forcar: true },
  })));
  const idsPagamentos = new Set(pagamentos.map((p) => String(p.id)));
  const garantias = lerJson(CHAVES_LIGADAS.garantias, []);
  const idsGarantias = new Set(garantias.filter((g) => String(g.loan_id) === String(id)).map((g) => String(g.id)));
  gravarJson(CHAVES_LIGADAS.pagamentos, lerJson(CHAVES_LIGADAS.pagamentos, []).filter((p) => !idsPagamentos.has(String(p.id))));
  gravarJson(CHAVES_LIGADAS.alocacoes, lerJson(CHAVES_LIGADAS.alocacoes, []).filter((a) => !idsPagamentos.has(String(a.payment_id))));
  gravarJson(CHAVES_LIGADAS.garantias, garantias.filter((g) => !idsGarantias.has(String(g.id))));
  gravarJson(CHAVES_LIGADAS.avalistas, lerJson(CHAVES_LIGADAS.avalistas, []).filter((a) => !idsGarantias.has(String(a.guarantee_id))));
  gravarJson(CHAVES_LIGADAS.movimentosGarantia, lerJson(CHAVES_LIGADAS.movimentosGarantia, []).filter((m) => !idsGarantias.has(String(m.guarantee_id))));
  gravar(ler().filter((e) => String(e.id) !== String(id)));
  return { pagamentos: pagamentos.length, garantias: idsGarantias.size };
};

export const classeEstado = (estado) =>
  ({
    Pendente: "is-pendente",
    Ativo: "is-activo",
    "Em Atraso": "is-atraso",
    Vencido: "is-atraso",
    Quitado: "is-quitado",
    Cancelado: "is-cancelado",
    Rejeitado: "is-cancelado",
  })[estado] || "";

export const formatarMT = (valor) =>
  `${Number(valor || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

export const formatarData = (iso) => {
  if (!iso) return "—";
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};
