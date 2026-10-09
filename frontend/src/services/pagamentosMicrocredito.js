import { obterCliente, listarClientes } from "./clientesMicrocredito";
import { eliminarAnexo } from "./anexosLocais";
import {
  REGRAS, ajustarSaldoCarteira, alterarEmprestimo, carteirasOperacionais, arredondar, diasEntre, formatarMT, listarCarteiras, listarEmprestimos,
  multaPendente, obterEmprestimo,
} from "./emprestimosMicrocredito";

const CHAVE_PAGAMENTOS = "microcredito-pagamentos-v1";
const CHAVE_ALOCACOES = "microcredito-alocacoes-v1";

export const FORMAS_PAGAMENTO = ["Dinheiro", "E-Mola", "Mpesa", "Transferência Bancária", "Cheque"];
export const TIPOS_PAGAMENTO = ["Pagamento de Parcela", "Pagamento Antecipado", "Pagamento Parcial", "Quitação Total", "Multa"];
export const ESTADOS_PAGAMENTO = ["Confirmado", "Pendente", "Cancelado", "Estornado"];
export const DIAS_RETROACTIVOS = 7;
export const HORAS_ESTORNO = 24;
export const MAX_COMPROVATIVO_MB = 5;

const CARTEIRA_SUGERIDA = { Dinheiro: "caixa", Mpesa: "mpesa", "E-Mola": "emola" };

const ESTADOS_PAGAVEIS = ["Ativo", "Em Atraso", "Vencido"];

const ler = (chave) => {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
};

const gravar = (chave, lista) => {
  try {
    localStorage.setItem(chave, JSON.stringify(lista));
  } catch (erro) {
    if (erro?.name === "QuotaExceededError") throw new Error("O armazenamento do navegador está cheio. Não foi possível gravar o pagamento.");
    throw erro;
  }
};

export const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const horaActual = () => new Date().toTimeString().slice(0, 5);

export const dataMinimaPagamento = () => {
  const d = new Date();
  d.setDate(d.getDate() - DIAS_RETROACTIVOS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const carteiraSugerida = (forma) => {
  const logo = CARTEIRA_SUGERIDA[forma];
  return logo ? carteirasOperacionais().find((c) => c.logo === logo) || null : null;
};

export const listarPagamentos = () =>
  ler(CHAVE_PAGAMENTOS).sort((a, b) => String(b.data_registo).localeCompare(String(a.data_registo)));

export const obterPagamento = (id) => ler(CHAVE_PAGAMENTOS).find((p) => String(p.id) === String(id)) || null;

export const listarAlocacoes = (paymentId) => ler(CHAVE_ALOCACOES).filter((a) => String(a.payment_id) === String(paymentId));

export const pagamentosDoEmprestimo = (loanId) => listarPagamentos().filter((p) => String(p.loan_id) === String(loanId));

export const parcelasAbertas = (emprestimo) =>
  (emprestimo?.parcelas || [])
    .filter((p) => p.status !== "Pago" && p.status !== "Cancelado")
    .sort((a, b) => a.num_parcela - b.num_parcela);

const pendentesDaParcela = (p, dataIso) => ({
  multa: multaPendente(p, dataIso),
  juros: Math.max(0, arredondar(Number(p.valor_juros || 0) - Number(p.juros_pago || 0))),
  principal: Math.max(0, arredondar(Number(p.valor_principal || 0) - Number(p.principal_pago || 0))),
});

export const detalheParcela = (p, dataIso = hojeIso()) => {
  const pend = pendentesDaParcela(p, dataIso);
  return {
    ...p,
    dias_atraso: diasEntre(p.data_vencimento, dataIso),
    multa_pendente: pend.multa,
    em_falta: arredondar(pend.juros + pend.principal),
    total_devido: arredondar(pend.multa + pend.juros + pend.principal),
  };
};

export const resumoEmprestimo = (emprestimo, dataIso = hojeIso()) => {
  if (!emprestimo) return null;
  const abertas = parcelasAbertas(emprestimo).map((p) => detalheParcela(p, dataIso));
  const multas = arredondar(abertas.reduce((s, p) => s + p.multa_pendente, 0));
  const totalPago = arredondar(Number(emprestimo.valor_pago || 0));
  const saldo = Math.max(0, arredondar(Number(emprestimo.valor_total_receber || 0) - totalPago));
  return {
    valorEmprestado: Number(emprestimo.valor_emprestado || 0),
    totalJuros: Number(emprestimo.valor_total_juros || 0),
    totalReceber: Number(emprestimo.valor_total_receber || 0),
    totalPago,
    multasPagas: arredondar(Number(emprestimo.multas_pagas || 0)),
    saldo,
    multas,
    maximo: arredondar(saldo + multas),
    progresso: emprestimo.valor_total_receber ? Math.min(100, (totalPago / emprestimo.valor_total_receber) * 100) : 0,
    proximo: abertas[0] || null,
    abertas,
  };
};

export const emprestimosParaPagamento = () => {
  const clientes = Object.fromEntries(listarClientes().map((c) => [c.id, c]));
  return listarEmprestimos()
    .filter((e) => ESTADOS_PAGAVEIS.includes(e.status))
    .map((e) => ({ ...e, cliente: clientes[e.client_id] || null, resumo: resumoEmprestimo(e) }));
};

export const simularPagamento = (emprestimo, { installmentId, valor, dataPagamento, tipo }) => {
  const dataIso = dataPagamento || hojeIso();
  const abertas = parcelasAbertas(emprestimo);
  const ordenadas = installmentId
    ? [...abertas.filter((p) => String(p.id) === String(installmentId)), ...abertas.filter((p) => String(p.id) !== String(installmentId))]
    : abertas;
  let restante = arredondar(Number(valor) || 0);
  const alocacoes = [];
  const porParcela = [];
  ordenadas.forEach((p) => {
    if (restante <= 0) return;
    const pend = pendentesDaParcela(p, dataIso);
    const linha = { installment_id: p.id, num_parcela: p.num_parcela, data_vencimento: p.data_vencimento, multa: 0, juros: 0, principal: 0 };
    const ordem = tipo === "Multa" ? [["Multa", "multa"]] : [["Multa", "multa"], ["Juros", "juros"], ["Principal", "principal"]];
    ordem.forEach(([tipoAlocacao, chave]) => {
      const valorAlocado = arredondar(Math.min(restante, pend[chave]));
      if (valorAlocado <= 0) return;
      linha[chave] = valorAlocado;
      restante = arredondar(restante - valorAlocado);
      alocacoes.push({ installment_id: p.id, num_parcela: p.num_parcela, tipo_alocacao: tipoAlocacao, valor_alocado: valorAlocado });
    });
    if (linha.multa + linha.juros + linha.principal > 0) {
      linha.quita = linha.juros >= pend.juros - 0.005 && linha.principal >= pend.principal - 0.005 && linha.multa >= pend.multa - 0.005;
      porParcela.push(linha);
    }
  });
  const totalMulta = arredondar(alocacoes.filter((a) => a.tipo_alocacao === "Multa").reduce((s, a) => s + a.valor_alocado, 0));
  const totalJuros = arredondar(alocacoes.filter((a) => a.tipo_alocacao === "Juros").reduce((s, a) => s + a.valor_alocado, 0));
  const totalPrincipal = arredondar(alocacoes.filter((a) => a.tipo_alocacao === "Principal").reduce((s, a) => s + a.valor_alocado, 0));
  const resumo = resumoEmprestimo(emprestimo, dataIso);
  const saldoDepois = Math.max(0, arredondar(resumo.saldo - totalJuros - totalPrincipal));
  const totalPagoDepois = arredondar(resumo.totalPago + totalJuros + totalPrincipal);
  return {
    alocacoes,
    porParcela,
    totalMulta,
    totalJuros,
    totalPrincipal,
    sobra: restante,
    saldoAntes: resumo.saldo,
    saldoDepois,
    totalPagoDepois,
    progressoDepois: resumo.totalReceber ? Math.min(100, (totalPagoDepois / resumo.totalReceber) * 100) : 0,
    quitaEmprestimo: saldoDepois <= 0.005 && resumo.saldo > 0,
    resumo,
  };
};

export const sugerirTipo = (emprestimo, { installmentId, valor, dataPagamento }) => {
  const dataIso = dataPagamento || hojeIso();
  const resumo = resumoEmprestimo(emprestimo, dataIso);
  const valorNum = Number(valor) || 0;
  if (!resumo || !valorNum) return "Pagamento de Parcela";
  if (valorNum >= resumo.maximo - 0.005) return "Quitação Total";
  const alvo = installmentId ? resumo.abertas.find((p) => String(p.id) === String(installmentId)) : resumo.proximo;
  if (!alvo) return "Pagamento de Parcela";
  if (valorNum < alvo.total_devido - 0.005) return "Pagamento Parcial";
  if (alvo.data_vencimento > dataIso) return "Pagamento Antecipado";
  return "Pagamento de Parcela";
};

export const validarPagamento = (dados) => {
  const erros = {};
  const emprestimo = obterEmprestimo(dados.loan_id);
  if (!emprestimo) {
    erros.loan_id = "Seleccione o empréstimo.";
    return erros;
  }
  if (!ESTADOS_PAGAVEIS.includes(emprestimo.status)) erros.loan_id = `Não é possível registar pagamentos num empréstimo «${emprestimo.status}».`;
  const hoje = hojeIso();
  if (!dados.data_pagamento) erros.data_pagamento = "Indique a data do pagamento.";
  else if (dados.data_pagamento > hoje) erros.data_pagamento = "A data não pode ser futura.";
  else if (dados.data_pagamento < dataMinimaPagamento()) erros.data_pagamento = `Só é possível registar até ${DIAS_RETROACTIVOS} dias para trás.`;
  const resumo = resumoEmprestimo(emprestimo, dados.data_pagamento || hoje);
  const valor = Number(dados.valor_pago);
  if (!Number.isFinite(valor) || valor < 1) erros.valor_pago = "O valor mínimo é 1 MT.";
  else if (valor > resumo.maximo + 0.005) erros.valor_pago = `Excede o total em dívida (${formatarMT(resumo.maximo)}).`;
  if (!FORMAS_PAGAMENTO.includes(dados.forma_pagamento)) erros.forma_pagamento = "Seleccione a forma de pagamento.";
  if (dados.forma_pagamento && dados.forma_pagamento !== "Dinheiro" && !String(dados.referencia_transacao || "").trim()) {
    erros.referencia_transacao = "Obrigatória para esta forma de pagamento.";
  }
  if (String(dados.referencia_transacao || "").length > 100) erros.referencia_transacao = "Máximo de 100 caracteres.";
  if (!carteirasOperacionais().some((c) => String(c.id) === String(dados.carteira_id))) erros.carteira_id = "Seleccione a carteira de recebimento.";
  if (!TIPOS_PAGAMENTO.includes(dados.tipo_pagamento)) erros.tipo_pagamento = "Seleccione o tipo de pagamento.";
  if (!erros.valor_pago && dados.tipo_pagamento) {
    const alvo = dados.installment_id ? resumo.abertas.find((p) => String(p.id) === String(dados.installment_id)) : resumo.proximo;
    if (dados.tipo_pagamento === "Multa") {
      if (resumo.multas <= 0) erros.tipo_pagamento = "Este empréstimo não tem multas por pagar.";
      else if (valor > resumo.multas + 0.005) erros.valor_pago = `As multas em dívida somam ${formatarMT(resumo.multas)}.`;
    }
    if (dados.tipo_pagamento === "Quitação Total" && Math.abs(valor - resumo.maximo) > 0.005) {
      erros.valor_pago = `Para quitar, o valor deve ser ${formatarMT(resumo.maximo)}.`;
    }
    if (dados.tipo_pagamento === "Pagamento Parcial" && alvo && valor >= alvo.total_devido - 0.005) {
      erros.tipo_pagamento = "O valor cobre a parcela inteira. Escolha «Pagamento de Parcela».";
    }
    if (dados.tipo_pagamento === "Pagamento Antecipado" && alvo && alvo.data_vencimento <= (dados.data_pagamento || hoje)) {
      erros.tipo_pagamento = "A parcela já venceu. Não é um pagamento antecipado.";
    }
  }
  if (String(dados.observacoes || "").length > 5000) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

const proximoRecibo = (lista) => {
  const prefixo = `REC-${new Date().getFullYear()}-`;
  const maior = lista
    .map((p) => String(p.numero_recibo || ""))
    .filter((n) => n.startsWith(prefixo))
    .reduce((m, n) => Math.max(m, Number(n.slice(prefixo.length)) || 0), 0);
  return `${prefixo}${String(maior + 1).padStart(6, "0")}`;
};

const aplicarNasParcelas = (parcelas, porParcela, sinal, dataPagamento) =>
  parcelas.map((p) => {
    const linha = porParcela.find((l) => String(l.installment_id) === String(p.id));
    if (!linha) return p;
    const juros_pago = Math.max(0, arredondar(Number(p.juros_pago || 0) + sinal * linha.juros));
    const principal_pago = Math.max(0, arredondar(Number(p.principal_pago || 0) + sinal * linha.principal));
    const multa_paga = Math.max(0, arredondar(Number(p.multa_paga || 0) + sinal * linha.multa));
    const valor_pago = arredondar(juros_pago + principal_pago);
    const liquidada = valor_pago >= Number(p.valor_parcela || 0) - 0.005;
    return {
      ...p,
      juros_pago,
      principal_pago,
      multa_paga,
      valor_pago,
      status: liquidada ? "Pago" : valor_pago > 0 || multa_paga > 0 ? "Parcialmente Pago" : "Pendente",
      data_pagamento: liquidada ? (sinal > 0 ? dataPagamento : p.data_pagamento) : null,
      data_atualizacao: new Date().toISOString(),
    };
  });

export const registarPagamento = (dados, utilizador) => {
  const erros = validarPagamento(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const emprestimo = obterEmprestimo(dados.loan_id);
  const simulacao = simularPagamento(emprestimo, {
    installmentId: dados.installment_id,
    valor: dados.valor_pago,
    dataPagamento: dados.data_pagamento,
    tipo: dados.tipo_pagamento,
  });
  if (!simulacao.alocacoes.length) throw new Error("Não há valores em dívida para alocar este pagamento.");
  if (simulacao.sobra > 0.005) throw new Error(`Sobram ${formatarMT(simulacao.sobra)} sem parcela para alocar. Reduza o valor.`);

  const lista = ler(CHAVE_PAGAMENTOS);
  const agora = new Date().toISOString();
  const nome = utilizador?.nome || "Sistema";
  const id = crypto.randomUUID();
  const carteira = ajustarSaldoCarteira(dados.carteira_id, Number(dados.valor_pago), {
    subtipo: "Pagamento Empréstimo", descricao: `Pagamento ${emprestimo.numero_contrato}`, loan_id: emprestimo.id, payment_id: id,
    referencia: String(dados.referencia_transacao || "").trim() || null, utilizador: nome,
  });
  const alvo = emprestimo.parcelas.find((p) => String(p.id) === String(dados.installment_id || simulacao.porParcela[0]?.installment_id));

  try {
    alterarEmprestimo(emprestimo.id, (e) => {
      const parcelas = aplicarNasParcelas(e.parcelas, simulacao.porParcela, 1, dados.data_pagamento);
      const valor_pago = arredondar(Number(e.valor_pago || 0) + simulacao.totalJuros + simulacao.totalPrincipal);
      const saldo_devedor = Math.max(0, arredondar(Number(e.valor_total_receber || 0) - valor_pago));
      const quitado = saldo_devedor <= 0.005;
      return {
        ...e,
        parcelas,
        valor_pago,
        saldo_devedor,
        multas_pagas: arredondar(Number(e.multas_pagas || 0) + simulacao.totalMulta),
        status: quitado ? "Quitado" : e.status,
        fase_atual: quitado ? "Concluído" : e.fase_atual,
        data_quitacao: quitado ? agora : e.data_quitacao || null,
        historico: [
          ...(e.historico || []),
          { data: agora, accao: `Pagamento de ${formatarMT(dados.valor_pago)} recebido (${dados.forma_pagamento})`, por: nome },
          ...(quitado ? [{ data: agora, accao: "Empréstimo quitado", por: nome }] : []),
        ],
      };
    });
  } catch (erro) {
    ajustarSaldoCarteira(dados.carteira_id, -Number(dados.valor_pago), { subtipo: "Estorno", descricao: `Anulação do pagamento ${emprestimo.numero_contrato} não concluído`, loan_id: emprestimo.id, payment_id: id, forcar: true });
    throw erro;
  }

  const actualizado = obterEmprestimo(emprestimo.id);
  const pagamento = {
    id,
    numero_recibo: proximoRecibo(lista),
    loan_id: emprestimo.id,
    client_id: emprestimo.client_id,
    installment_id: dados.installment_id || null,
    num_parcela: alvo?.num_parcela || null,
    total_parcelas: emprestimo.num_parcelas,
    parcelas_afectadas: simulacao.porParcela.map((l) => ({ ...l, estado: actualizado.parcelas.find((p) => p.id === l.installment_id)?.status })),
    valor_pago: arredondar(Number(dados.valor_pago)),
    valor_parcela: Number(alvo?.valor_parcela || 0),
    valor_juros_pago: simulacao.totalJuros,
    valor_principal_pago: simulacao.totalPrincipal,
    valor_multa: simulacao.totalMulta,
    saldo_antes: simulacao.saldoAntes,
    saldo_devedor_apos: actualizado.saldo_devedor,
    estado_emprestimo_apos: actualizado.status,
    data_pagamento: dados.data_pagamento,
    hora_pagamento: dados.hora_pagamento || null,
    forma_pagamento: dados.forma_pagamento,
    referencia_transacao: String(dados.referencia_transacao || "").trim() || null,
    carteira_id: carteira.id,
    tipo_pagamento: dados.tipo_pagamento,
    status: "Confirmado",
    comprovativo: dados.comprovativo || null,
    observacoes: String(dados.observacoes || "").trim(),
    registado_por: nome,
    data_registo: agora,
    data_atualizacao: agora,
  };
  gravar(CHAVE_PAGAMENTOS, [...lista, pagamento]);
  gravar(CHAVE_ALOCACOES, [
    ...ler(CHAVE_ALOCACOES),
    ...simulacao.alocacoes.map((a) => ({ id: crypto.randomUUID(), payment_id: id, ...a, data_registo: agora })),
  ]);
  return pagamento;
};

export const podeEstornar = (pagamento) =>
  pagamento?.status === "Confirmado" && Date.now() - new Date(pagamento.data_registo).getTime() <= HORAS_ESTORNO * 3600000;

export const estornarPagamento = (id, motivo, utilizador) => {
  const pagamento = obterPagamento(id);
  if (!pagamento) throw new Error("Pagamento não encontrado.");
  if (!podeEstornar(pagamento)) throw new Error(`Só é possível estornar pagamentos confirmados até ${HORAS_ESTORNO} horas após o registo.`);
  if (String(motivo || "").trim().length < 5) throw new Error("Escreva a justificação do estorno (mínimo 5 caracteres).");
  const agora = new Date().toISOString();
  const nome = utilizador?.nome || "Sistema";
  desfazerPagamento(pagamento, `Pagamento ${pagamento.numero_recibo} estornado: ${motivo.trim()}`, nome);
  const lista = ler(CHAVE_PAGAMENTOS).map((p) =>
    String(p.id) === String(id)
      ? { ...p, status: "Estornado", estorno: { motivo: motivo.trim(), por: nome, data: agora }, data_atualizacao: agora }
      : p
  );
  gravar(CHAVE_PAGAMENTOS, lista);
  return lista.find((p) => String(p.id) === String(id));
};

export const eliminarPagamento = (id, utilizador) => {
  const pagamento = obterPagamento(id);
  if (!pagamento) throw new Error("Pagamento não encontrado.");
  if (pagamento.status === "Confirmado" && obterEmprestimo(pagamento.loan_id)) {
    desfazerPagamento(pagamento, `Pagamento ${pagamento.numero_recibo} eliminado`, utilizador?.nome || "Sistema");
  }
  gravar(CHAVE_PAGAMENTOS, ler(CHAVE_PAGAMENTOS).filter((p) => String(p.id) !== String(id)));
  gravar(CHAVE_ALOCACOES, ler(CHAVE_ALOCACOES).filter((a) => String(a.payment_id) !== String(id)));
  if (pagamento.comprovativo?.anexo_id) eliminarAnexo(pagamento.comprovativo.anexo_id).catch(() => {});
};

const desfazerPagamento = (pagamento, accao, nome) => {
  const agora = new Date().toISOString();
  ajustarSaldoCarteira(pagamento.carteira_id, -pagamento.valor_pago, { subtipo: "Estorno", descricao: accao, loan_id: pagamento.loan_id, payment_id: pagamento.id, utilizador: nome, forcar: true });
  try {
    alterarEmprestimo(pagamento.loan_id, (e) => {
      const parcelas = aplicarNasParcelas(e.parcelas, pagamento.parcelas_afectadas || [], -1, null);
      const valor_pago = Math.max(0, arredondar(Number(e.valor_pago || 0) - pagamento.valor_juros_pago - pagamento.valor_principal_pago));
      const eraQuitado = e.status === "Quitado";
      return {
        ...e,
        parcelas,
        valor_pago,
        saldo_devedor: arredondar(Number(e.valor_total_receber || 0) - valor_pago),
        multas_pagas: Math.max(0, arredondar(Number(e.multas_pagas || 0) - pagamento.valor_multa)),
        status: eraQuitado ? "Ativo" : e.status,
        fase_atual: eraQuitado ? "Em Curso" : e.fase_atual,
        data_quitacao: eraQuitado ? null : e.data_quitacao || null,
        historico: [...(e.historico || []), { data: agora, accao, por: nome }],
      };
    });
  } catch (erro) {
    ajustarSaldoCarteira(pagamento.carteira_id, pagamento.valor_pago, { subtipo: "Ajuste", descricao: `Reposição do pagamento ${pagamento.numero_recibo}`, loan_id: pagamento.loan_id, payment_id: pagamento.id, forcar: true });
    throw erro;
  }
};

export const dadosDoRecibo = (pagamento) => {
  const emprestimo = obterEmprestimo(pagamento.loan_id);
  return {
    pagamento,
    emprestimo,
    cliente: obterCliente(pagamento.client_id),
    carteira: listarCarteiras().find((c) => String(c.id) === String(pagamento.carteira_id)) || null,
    alocacoes: listarAlocacoes(pagamento.id),
  };
};

export const classeEstadoPagamento = (estado) =>
  ({ Confirmado: "is-activo", Pendente: "is-pendente", Cancelado: "is-cancelado", Estornado: "is-atraso" })[estado] || "";

export { REGRAS };
