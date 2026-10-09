import { listarClientes } from "./clientesMicrocredito";
import { formatarData, formatarMT, gravarLista, lerLista, listarCarteiras, listarEmprestimos, proximoCodigo } from "./emprestimosMicrocredito";
import { hojeIso, listarPagamentos } from "./pagamentosMicrocredito";
import { garantiasDetalhadas } from "./garantiasMicrocredito";
import { fluxoCarteira, listarDespesas, listarTransferencias } from "./carteirasMicrocredito";
import { listarCobradores, listarPromessas, listarZonas, relatorioPeriodo, zonaDoCliente } from "./cobrancasMicrocredito";

const CHAVE = "microcredito-relatorios-v1";
const CHAVE_AG = "microcredito-relatorios-agendas-v1";

export const TIPOS_RELATORIO = ["Financeiro", "Inadimplência", "Performance", "Clientes", "Carteiras", "Empréstimos", "Pagamentos", "Garantias", "Cobranças"];
export const FORMATOS = ["PDF", "Excel", "CSV"];

const dia = (iso) => String(iso || "").slice(0, 10);
const noPeriodo = (iso, de, ate) => {
  const d = dia(iso);
  return Boolean(d) && (!de || d >= de) && (!ate || d <= ate);
};
const soma = (lista, campo) => lista.reduce((s, x) => s + Number(x[campo] || 0), 0);
const pct = (a, b) => (Number(b) > 0 ? `${((Number(a) / Number(b)) * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%` : "0%");

const emprestimosPeriodo = (de, ate) => listarEmprestimos().filter((e) => !["Cancelado", "Rejeitado"].includes(e.status) && noPeriodo(e.data_inicio || e.data_desembolso || e.data_registo, de, ate));
const pagamentosPeriodo = (de, ate) => listarPagamentos().filter((p) => p.status === "Confirmado" && noPeriodo(p.data_pagamento, de, ate));

const linha = (valores) => ({ id: crypto.randomUUID(), valores });

const nomesClientes = () => Object.fromEntries(listarClientes().map((c) => [String(c.id), c.nome_completo]));

const financeiro = (f) => {
  const nomes = nomesClientes();
  const emprestimos = emprestimosPeriodo(f.de, f.ate).filter((e) => !f.carteiraId || String(e.carteira_id) === String(f.carteiraId));
  const pagamentos = pagamentosPeriodo(f.de, f.ate).filter((p) => !f.carteiraId || String(p.carteira_id) === String(f.carteiraId));
  const activos = listarEmprestimos().filter((e) => ["Ativo", "Em Atraso", "Vencido"].includes(e.status));
  const fluxo = fluxoCarteira(f.carteiraId || null, f.de, f.ate);
  const despesas = listarDespesas().filter((d) => d.status === "Paga" && noPeriodo(d.data_despesa, f.de, f.ate));
  const carteiras = listarCarteiras();
  return {
    titulo: "Relatório financeiro",
    kpis: [
      { rotulo: "Total emprestado", valor: formatarMT(soma(emprestimos, "valor_emprestado")), detalhe: `${emprestimos.length} contratos` },
      { rotulo: "Total pago", valor: formatarMT(soma(pagamentos, "valor_pago")), detalhe: `${pagamentos.length} recibos` },
      { rotulo: "Total pendente", valor: formatarMT(soma(activos, "saldo_devedor")), detalhe: "saldos em aberto" },
      { rotulo: "Fluxo de caixa", valor: formatarMT(fluxo.fluxo), detalhe: `Entradas ${formatarMT(fluxo.entradas)}` },
    ],
    grafico: carteiras.map((c) => ({ nome: c.nome, valor: Number(c.saldo || 0) })),
    graficoTitulo: "Saldo por carteira",
    colunas: ["Contrato", "Cliente", "Data", "Emprestado", "Pago", "Saldo", "Estado"],
    linhas: emprestimos.slice(0, 80).map((e) => linha([e.numero_contrato, nomes[String(e.client_id)] || "—", formatarData(e.data_inicio || e.data_desembolso || e.data_registo), formatarMT(e.valor_emprestado), formatarMT(e.valor_pago), formatarMT(e.saldo_devedor), e.status])),
    extra: `Juros ${formatarMT(soma(emprestimos, "valor_total_juros"))} · Multas ${formatarMT(soma(emprestimos, "multas_pagas"))} · Despesas ${formatarMT(soma(despesas, "valor"))}`,
  };
};

const inadimplencia = (f) => {
  const hoje = hojeIso();
  const zonas = listarZonas();
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const linhas = [];
  let valor = 0;
  let dias = 0;
  let n = 0;
  listarEmprestimos().filter((e) => ["Ativo", "Em Atraso", "Vencido"].includes(e.status)).forEach((e) => {
    const cliente = clientes[String(e.client_id)];
    const zona = zonaDoCliente(cliente, zonas);
    if (f.zonaId && String(zona?.id) !== String(f.zonaId)) return;
    (e.parcelas || []).filter((p) => p.data_vencimento < hoje && !["Pago", "Cancelado"].includes(p.status)).forEach((p) => {
      const atraso = Math.max(0, Math.round((new Date(`${hoje}T00:00:00`) - new Date(`${p.data_vencimento}T00:00:00`)) / 86400000));
      const devido = Number(p.valor_parcela || 0) - Number(p.valor_pago || 0);
      valor += Math.max(0, devido);
      dias += atraso;
      n += 1;
      linhas.push(linha([cliente?.nome_completo || "—", e.numero_contrato, `${p.num_parcela}`, formatarData(p.data_vencimento), String(atraso), formatarMT(Math.max(0, devido)), zona?.nome || "—"]));
    });
  });
  const aReceber = soma(listarEmprestimos().filter((e) => ["Ativo", "Em Atraso", "Vencido"].includes(e.status)), "saldo_devedor");
  return {
    titulo: "Relatório de inadimplência",
    kpis: [
      { rotulo: "Parcelas atrasadas", valor: String(n), detalhe: "em aberto" },
      { rotulo: "Valor pendente", valor: formatarMT(valor), detalhe: "soma em atraso" },
      { rotulo: "Dias médios", valor: n ? String(Math.round(dias / n)) : "0", detalhe: "média de atraso" },
      { rotulo: "Taxa", valor: pct(valor, aReceber), detalhe: "sobre o saldo a receber" },
    ],
    grafico: Object.values(linhas.reduce((m, l) => {
      const z = l.valores[6];
      m[z] = m[z] || { nome: z, valor: 0 };
      m[z].valor += 1;
      return m;
    }, {})),
    graficoTitulo: "Atrasos por zona",
    colunas: ["Cliente", "Contrato", "Parcela", "Vencimento", "Dias", "Em falta", "Zona"],
    linhas: linhas.slice(0, 100),
    extra: `${new Set(linhas.map((l) => l.valores[0])).size} clientes inadimplentes`,
  };
};

const performance = (f) => {
  const rel = relatorioPeriodo(f.de, f.ate);
  const porCobrador = rel.porCobrador.filter((c) => !f.cobradorId || String(c.id) === String(f.cobradorId));
  return {
    titulo: "Relatório de performance",
    kpis: [
      { rotulo: "Cobrado", valor: formatarMT(rel.totais.cobrado), detalhe: `${rel.totais.agendas} agendas` },
      { rotulo: "Taxa de sucesso", valor: pct(rel.totais.cobrado, rel.totais.esperado), detalhe: "do esperado" },
      { rotulo: "Comissões", valor: formatarMT(rel.totais.comissao), detalhe: "dos cobradores" },
      { rotulo: "Não cobrados", valor: String(rel.totais.naoCobrados), detalhe: "visitas sem pagamento" },
    ],
    grafico: porCobrador.map((c) => ({ nome: c.nome, valor: c.cobrado })),
    graficoTitulo: "Cobrado por cobrador",
    colunas: ["Cobrador", "Agendas", "Clientes", "Esperado", "Cobrado", "Comissão", "Taxa"],
    linhas: porCobrador.map((c) => linha([c.nome, String(c.agendas), String(c.clientes), formatarMT(c.esperado), formatarMT(c.cobrado), formatarMT(c.comissao), pct(c.cobrado, c.esperado)])),
    extra: rel.porZona.map((z) => `${z.nome}: ${formatarMT(z.cobrado)}`).join(" · ") || "Sem zonas no período",
  };
};

const clientes = (f) => {
  const zonas = listarZonas();
  const todos = listarClientes().filter((c) => {
    if (f.perfil && c.perfil_risco !== f.perfil) return false;
    if (f.zonaId && String(zonaDoCliente(c, zonas)?.id) !== String(f.zonaId)) return false;
    return true;
  });
  const noIntervalo = todos.filter((c) => noPeriodo(c.data_registo, f.de, f.ate));
  const activos = listarClientes().filter((c) => c.cliente_ativo !== false);
  const porPerfil = ["A", "B", "C", "D"].map((p) => ({ nome: `Perfil ${p}`, valor: listarClientes().filter((c) => c.perfil_risco === p).length }));
  return {
    titulo: "Relatório de clientes",
    kpis: [
      { rotulo: "Novos", valor: String(noIntervalo.length), detalhe: "registados no período" },
      { rotulo: "Activos", valor: String(activos.length), detalhe: "na carteira" },
      { rotulo: "Score médio", valor: String(Math.round(soma(listarClientes(), "score") / Math.max(1, listarClientes().length))), detalhe: "de todos os clientes" },
      { rotulo: "Total", valor: String(listarClientes().length), detalhe: "registos" },
    ],
    grafico: porPerfil,
    graficoTitulo: "Perfil de risco",
    colunas: ["Cliente", "Telefone", "Perfil", "Score", "Zona", "Registo"],
    linhas: (noIntervalo.length ? noIntervalo : todos).slice(0, 80).map((c) => linha([c.nome_completo, c.telefone_principal || "—", c.perfil_risco || "—", String(c.score || "—"), zonaDoCliente(c, zonas)?.nome || "—", formatarData(c.data_registo)])),
  };
};

const carteiras = (f) => {
  const lista = listarCarteiras().filter((c) => !f.carteiraId || String(c.id) === String(f.carteiraId));
  const fluxo = fluxoCarteira(f.carteiraId || null, f.de, f.ate);
  const transf = listarTransferencias().filter((t) => noPeriodo(t.data_transferencia, f.de, f.ate));
  return {
    titulo: "Relatório de carteiras",
    kpis: [
      { rotulo: "Saldo", valor: formatarMT(soma(lista.filter((c) => c.status === "Ativa"), "saldo")), detalhe: `${lista.length} carteiras` },
      { rotulo: "Entradas", valor: formatarMT(fluxo.entradas), detalhe: "no período" },
      { rotulo: "Saídas", valor: formatarMT(fluxo.saidas), detalhe: "no período" },
      { rotulo: "Transferências", valor: String(transf.length), detalhe: formatarMT(soma(transf, "valor")) },
    ],
    grafico: [
      { nome: "Entradas", valor: fluxo.entradas },
      { nome: "Saídas", valor: fluxo.saidas },
    ],
    graficoTitulo: "Fluxo do período",
    colunas: ["Carteira", "Tipo", "Saldo inicial", "Saldo actual", "Estado"],
    linhas: lista.map((c) => linha([c.nome, c.tipo, formatarMT(c.saldo_inicial), formatarMT(c.saldo), c.status])),
  };
};

const emprestimosRel = (f) => {
  const lista = emprestimosPeriodo(f.de, f.ate).filter((e) => !f.status || e.status === f.status);
  const quitados = lista.filter((e) => e.status === "Quitado");
  return {
    titulo: "Relatório de empréstimos",
    kpis: [
      { rotulo: "Concedidos", valor: formatarMT(soma(lista, "valor_emprestado")), detalhe: `${lista.length} contratos` },
      { rotulo: "Ticket médio", valor: formatarMT(lista.length ? soma(lista, "valor_emprestado") / lista.length : 0), detalhe: "valor médio" },
      { rotulo: "Quitados", valor: String(quitados.length), detalhe: pct(quitados.length, lista.length) },
      { rotulo: "Em atraso", valor: String(lista.filter((e) => ["Em Atraso", "Vencido"].includes(e.status)).length), detalhe: "contratos" },
    ],
    grafico: ["Ativo", "Em Atraso", "Quitado", "Vencido"].map((s) => ({ nome: s, valor: lista.filter((e) => e.status === s).length })),
    graficoTitulo: "Estado dos empréstimos",
    colunas: ["Contrato", "Valor", "Parcelas", "Taxa", "Estado", "Início"],
    linhas: lista.slice(0, 80).map((e) => linha([e.numero_contrato, formatarMT(e.valor_emprestado), String(e.num_parcelas), `${e.taxa_juros || 0}%`, e.status, formatarData(e.data_inicio)])),
  };
};

const pagamentosRel = (f) => {
  const lista = pagamentosPeriodo(f.de, f.ate).filter((p) => !f.forma || p.forma_pagamento === f.forma);
  const formas = [...new Set(lista.map((p) => p.forma_pagamento))];
  return {
    titulo: "Relatório de pagamentos",
    kpis: [
      { rotulo: "Recebido", valor: formatarMT(soma(lista, "valor_pago")), detalhe: `${lista.length} pagamentos` },
      { rotulo: "Ticket médio", valor: formatarMT(lista.length ? soma(lista, "valor_pago") / lista.length : 0), detalhe: "por recibo" },
      { rotulo: "Multas", valor: formatarMT(soma(lista, "valor_multa")), detalhe: "incluídas" },
      { rotulo: "Formas", valor: String(formas.length), detalhe: formas.join(", ") || "—" },
    ],
    grafico: formas.map((nome) => ({ nome, valor: soma(lista.filter((p) => p.forma_pagamento === nome), "valor_pago") })),
    graficoTitulo: "Por forma de pagamento",
    colunas: ["Recibo", "Data", "Forma", "Valor", "Tipo", "Estado"],
    linhas: lista.slice(0, 80).map((p) => linha([p.numero_recibo, formatarData(p.data_pagamento), p.forma_pagamento, formatarMT(p.valor_pago), p.tipo_pagamento, p.status])),
  };
};

const garantiasRel = (f) => {
  const lista = garantiasDetalhadas().filter((g) => noPeriodo(g.data_registo, f.de, f.ate) && (!f.status || g.status === f.status));
  const tipos = [...new Set(lista.map((g) => g.tipo_garantia))];
  return {
    titulo: "Relatório de garantias",
    kpis: [
      { rotulo: "Registadas", valor: String(lista.length), detalhe: "no período" },
      { rotulo: "Valor", valor: formatarMT(lista.reduce((s, g) => s + Number(g.valor || 0), 0)), detalhe: "em garantia" },
      { rotulo: "Activas", valor: String(lista.filter((g) => g.status === "Ativa").length), detalhe: "associadas" },
      { rotulo: "Executadas", valor: String(lista.filter((g) => g.status === "Executada").length), detalhe: "no período" },
    ],
    grafico: tipos.map((nome) => ({ nome, valor: lista.filter((g) => g.tipo_garantia === nome).length })),
    graficoTitulo: "Por tipo de garantia",
    colunas: ["Código", "Tipo", "Cliente", "Valor", "Estado"],
    linhas: lista.slice(0, 80).map((g) => linha([g.codigo_garantia, g.tipo_garantia, g.cliente?.nome_completo || "—", formatarMT(g.valor), g.status])),
  };
};

const cobrancasRel = (f) => {
  const rel = relatorioPeriodo(f.de, f.ate);
  const promessas = listarPromessas().filter((p) => noPeriodo(p.data_registo, f.de, f.ate));
  const cumpridas = promessas.filter((p) => p.status === "Cumprida").length;
  return {
    titulo: "Relatório de cobranças",
    kpis: [
      { rotulo: "Agendas", valor: String(rel.totais.agendas), detalhe: "no período" },
      { rotulo: "Taxa de sucesso", valor: pct(rel.totais.cobrado, rel.totais.esperado), detalhe: formatarMT(rel.totais.cobrado) },
      { rotulo: "Promessas", valor: String(promessas.length), detalhe: pct(cumpridas, promessas.length) + " cumpridas" },
      { rotulo: "Cobradores", valor: String(listarCobradores().filter((c) => c.status === "Ativo").length), detalhe: "activos" },
    ],
    grafico: rel.porZona.map((z) => ({ nome: z.nome, valor: z.cobrado })),
    graficoTitulo: "Cobrado por zona",
    colunas: ["Zona", "Agendas", "Clientes", "Esperado", "Cobrado", "Taxa"],
    linhas: rel.porZona.map((z) => linha([z.nome, String(z.agendas), String(z.clientes), formatarMT(z.esperado), formatarMT(z.cobrado), pct(z.cobrado, z.esperado)])),
  };
};

const MONTADORES = {
  Financeiro: financeiro,
  "Inadimplência": inadimplencia,
  Performance: performance,
  Clientes: clientes,
  Carteiras: carteiras,
  "Empréstimos": emprestimosRel,
  Pagamentos: pagamentosRel,
  Garantias: garantiasRel,
  "Cobranças": cobrancasRel,
};

const RELATORIOS_MOEDA = new Set(["Financeiro", "Performance", "Carteiras", "Pagamentos", "Cobranças"]);

export const montarRelatorio = (tipo, filtros) => {
  const fn = MONTADORES[tipo] || financeiro;
  const vista = fn(filtros);
  const moeda = RELATORIOS_MOEDA.has(tipo);
  return {
    ...vista,
    tipo,
    periodo: `${formatarData(filtros.de)} — ${formatarData(filtros.ate)}`,
    grafico: (vista.grafico || []).map((s) => ({ ...s, texto: moeda ? formatarMT(s.valor) : String(s.valor) })),
  };
};

export const listarRelatoriosGerados = () => {
  const limite = new Date();
  limite.setDate(limite.getDate() - 90);
  return lerLista(CHAVE).filter((r) => String(r.data_geracao) >= limite.toISOString());
};

export const registarRelatorio = ({ tipo, nome, formato, filtros, tamanho }, utilizador) => {
  const agoraIso = new Date().toISOString();
  const expira = new Date();
  expira.setDate(expira.getDate() + 90);
  const relatorio = {
    id: crypto.randomUUID(),
    codigo_relatorio: proximoCodigo(CHAVE, "codigo_relatorio", "REL"),
    nome: nome || `${tipo} ${filtros.de}`,
    tipo,
    formato,
    parametros: filtros,
    periodo_inicio: filtros.de,
    periodo_fim: filtros.ate,
    tamanho_kb: tamanho || 0,
    status: "Concluído",
    gerado_por: utilizador?.nome || "Sistema",
    data_geracao: agoraIso,
    data_expiracao: expira.toISOString(),
    data_registo: agoraIso,
    data_atualizacao: agoraIso,
  };
  gravarLista(CHAVE, [relatorio, ...lerLista(CHAVE)]);
  return relatorio;
};

export const listarAgendamentos = () => lerLista(CHAVE_AG);

export const guardarAgendamento = (dados, utilizador) => {
  if (!dados.destinatarios?.trim()) throw new Error("Indique pelo menos um email.");
  const item = {
    id: crypto.randomUUID(),
    nome: dados.nome || dados.tipo,
    tipo: dados.tipo,
    frequencia: dados.frequencia || "Mensal",
    hora_envio: dados.hora_envio || "08:00",
    formato: dados.formato || "PDF",
    destinatarios: dados.destinatarios.split(",").map((e) => e.trim()).filter(Boolean),
    status: "Ativo",
    proxima_execucao: dados.proxima || null,
    criado_por: utilizador?.nome || "Sistema",
    data_registo: new Date().toISOString(),
  };
  gravarLista(CHAVE_AG, [item, ...lerLista(CHAVE_AG)]);
  return item;
};
