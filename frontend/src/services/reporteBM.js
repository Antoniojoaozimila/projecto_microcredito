import { listarClientes } from "./clientesMicrocredito";
import { arredondar, listarCarteiras, listarEmprestimos, periodoTaxa } from "./emprestimosMicrocredito";
import { hojeIso, listarPagamentos } from "./pagamentosMicrocredito";
import { listarTransacoes } from "./carteirasMicrocredito";
import { lerConfig } from "./configuracoesMicrocredito";

/** Sectores/finalidades do modelo do Banco de Moçambique, pela mesma ordem do ficheiro. */
export const SECTORES_ACTIVIDADE = ["Comércio", "Agricultura", "Pecuária", "Indústria", "Serviços", "Consumo", "Outros"];
export const SECTOR_PADRAO = "Outros";

export const CLASSES_RISCO = [
  { id: "I", nome: "Classe I (De 1 a 30 dias)", min: 1, max: 30 },
  { id: "II", nome: "Classe II (De 31 a 90 dias)", min: 31, max: 90 },
  { id: "III", nome: "Classe III (De 91 a 365 dias)", min: 91, max: 365 },
  { id: "IV", nome: "Classe IV (mais de 365 dias)", min: 366, max: Infinity },
];

const ESTADOS_ABERTOS = ["Ativo", "Em Atraso", "Vencido"];
const ESTADOS_CONCEDIDOS = ["Ativo", "Em Atraso", "Vencido", "Quitado"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const FACTOR_MENSAL = { "ao dia": 30, "por semana": 30 / 7, "por quinzena": 2, "ao mês": 1, "por trimestre": 1 / 3, "por semestre": 1 / 6, "ao ano": 1 / 12 };

const dia = (iso) => String(iso || "").slice(0, 10);
const noPeriodo = (iso, de, ate) => {
  const d = dia(iso);
  return Boolean(d) && d >= de && d <= ate;
};
const soma = (lista, fn) => arredondar(lista.reduce((s, x) => s + Number(fn(x) || 0), 0));
const emDias = (inicio, fim) => Math.round((new Date(`${dia(fim)}T00:00:00Z`) - new Date(`${dia(inicio)}T00:00:00Z`)) / 86400000);
const par = (n) => String(n).padStart(2, "0");

export const dataPorExtenso = (iso) => {
  const [a, m, d] = dia(iso).split("-");
  if (!a || !m || !d) return "";
  return `${d} de ${MESES[Number(m) - 1]} de ${a}`;
};

/** "2026-04" -> "Abril de 2026". Texto livre (de dados antigos) passa sem alteração. */
export const mesPorExtenso = (valor) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(valor || ""));
  return m ? `${MESES[Number(m[2]) - 1]} de ${m[1]}` : String(valor || "");
};

export const periodoDoTrimestre = (ano, trimestre) => {
  const mesInicial = (Number(trimestre) - 1) * 3;
  const fim = new Date(Date.UTC(Number(ano), mesInicial + 3, 0));
  return { de: `${ano}-${par(mesInicial + 1)}-01`, ate: `${ano}-${par(fim.getUTCMonth() + 1)}-${par(fim.getUTCDate())}` };
};

/** Último trimestre já encerrado (ou o actual se ainda não houver nenhum encerrado neste ano). */
export const trimestreSugerido = () => {
  const hoje = new Date(`${hojeIso()}T00:00:00Z`);
  const actual = Math.floor(hoje.getUTCMonth() / 3) + 1;
  if (actual === 1) return { ano: hoje.getUTCFullYear() - 1, trimestre: 4 };
  return { ano: hoje.getUTCFullYear(), trimestre: actual - 1 };
};

const mesesDoPeriodo = (de, ate) => {
  const [ano, mes] = dia(de).split("-").map(Number);
  return [0, 1, 2].map((i) => {
    const inicio = new Date(Date.UTC(ano, mes - 1 + i, 1));
    const inicioIso = `${inicio.getUTCFullYear()}-${par(inicio.getUTCMonth() + 1)}-01`;
    if (inicioIso > ate) return null;
    const fim = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0));
    const fimIso = `${fim.getUTCFullYear()}-${par(fim.getUTCMonth() + 1)}-${par(fim.getUTCDate())}`;
    return {
      rotulo: `Mês ${i + 1} (${MESES_CURTOS[inicio.getUTCMonth()]}/${inicio.getUTCFullYear()})`,
      data: fimIso > ate ? ate : fimIso,
    };
  });
};

export const dadosOperadorPadrao = () => {
  const c = lerConfig();
  return {
    denominacao: c.nome_empresa || "",
    endereco: c.endereco_empresa || "",
    provincia: c.bm_provincia || "",
    telefone: c.telefone_empresa || "",
    fax: c.bm_fax || "N/A",
    email: c.email_empresa || "",
    trabalhadores: c.bm_nr_trabalhadores ?? "",
    inicio_actividades: c.bm_inicio_actividades || "",
    nome_operador: c.bm_nome_operador || "",
    capital_inicial: Number(c.bm_capital_inicial || 0),
    capital_actual: Number(c.bm_capital_actual || 0),
    capitais_proprios: c.bm_capitais_proprios === "" || c.bm_capitais_proprios == null ? "" : Number(c.bm_capitais_proprios),
    alheios_nacionais: Number(c.bm_alheios_nacionais || 0),
    alheios_estrangeiros: Number(c.bm_alheios_estrangeiros || 0),
  };
};

/** Campos do operador que ficam guardados nas configurações do sistema. */
export const operadorParaConfig = (o) => ({
  nome_empresa: o.denominacao,
  endereco_empresa: o.endereco,
  telefone_empresa: o.telefone,
  email_empresa: o.email,
  bm_provincia: o.provincia,
  bm_fax: o.fax,
  bm_nr_trabalhadores: o.trabalhadores,
  bm_inicio_actividades: o.inicio_actividades,
  bm_nome_operador: o.nome_operador,
  bm_capital_inicial: Number(o.capital_inicial) || 0,
  bm_capital_actual: Number(o.capital_actual) || 0,
  bm_capitais_proprios: o.capitais_proprios === "" ? "" : Number(o.capitais_proprios) || 0,
  bm_alheios_nacionais: Number(o.alheios_nacionais) || 0,
  bm_alheios_estrangeiros: Number(o.alheios_estrangeiros) || 0,
});

const saldoEm = (carteira, data, transaccoes) => {
  let ultima = null;
  for (const t of transaccoes) {
    if (dia(t.data_transacao) <= data) ultima = t;
    else return ultima ? Number(ultima.saldo_posterior || 0) : Number(t.saldo_anterior || 0);
  }
  return ultima ? Number(ultima.saldo_posterior || 0) : Number(carteira.saldo || 0);
};

const taxaMensal = (e) => Number(e.taxa_juros || 0) * (FACTOR_MENSAL[periodoTaxa(e)] ?? 1);
const prazoEmMeses = (e) => (e.data_vencimento && e.data_inicio ? emDias(e.data_inicio, e.data_vencimento) / 30.4375 : null);

const generoDe = (cliente) => {
  if (!cliente) return "outros";
  if (cliente.tipo_cliente && cliente.tipo_cliente !== "Pessoa Física") return "outros";
  if (cliente.genero === "Masculino") return "homens";
  if (cliente.genero === "Feminino") return "mulheres";
  return "outros";
};

const extremos = (valores) => {
  const lista = valores.filter((v) => Number.isFinite(v));
  return lista.length ? { min: Math.min(...lista), max: Math.max(...lista) } : { min: 0, max: 0 };
};

/**
 * Reúne, a partir dos dados do sistema, tudo o que o modelo de reporte do Banco de Moçambique pede.
 * `operador` e `manuais` vêm do formulário (o que o sistema não consegue deduzir sozinho).
 */
export const montarReporteBM = ({ de, ate, operador, manuais = {} }) => {
  const hoje = hojeIso();
  const referencia = ate < hoje ? ate : hoje;
  const emprestimos = listarEmprestimos();
  const dataConcessao = (e) => dia(e.data_desembolso || e.data_inicio || e.data_registo);

  const concedidos = emprestimos.filter((e) => ESTADOS_CONCEDIDOS.includes(e.status) && noPeriodo(dataConcessao(e), de, ate));
  const pagamentos = listarPagamentos().filter((p) => p.status === "Confirmado" && noPeriodo(p.data_pagamento, de, ate));
  const reembolsados = emprestimos.filter((e) => e.status === "Quitado" && noPeriodo(e.data_quitacao, de, ate));

  const capitalConcedido = soma(concedidos, (e) => e.valor_emprestado);
  const jurosConcedidos = soma(concedidos, (e) => e.valor_total_juros);
  const capitalPago = soma(pagamentos, (p) => p.valor_principal_pago);
  const jurosPagos = soma(pagamentos, (p) => p.valor_juros_pago);
  const abatidoCapital = Number(manuais.abatido_capital) || 0;
  const abatidoJuro = Number(manuais.abatido_juro) || 0;

  const classes = CLASSES_RISCO.map((c) => ({ ...c, capital: 0, juros: 0, n: 0 }));
  let activaCapital = 0;
  let activaJuros = 0;
  emprestimos
    .filter((e) => ESTADOS_ABERTOS.includes(e.status) && dataConcessao(e) <= ate)
    .forEach((e) => {
      const abertas = (e.parcelas || []).filter((p) => p.status !== "Pago" && p.status !== "Cancelado");
      const capital = soma(abertas, (p) => Math.max(0, Number(p.valor_principal || 0) - Number(p.principal_pago || 0)));
      const juros = soma(abertas, (p) => Math.max(0, Number(p.valor_juros || 0) - Number(p.juros_pago || 0)));
      activaCapital += capital;
      activaJuros += juros;
      const atraso = Math.max(0, ...abertas.filter((p) => dia(p.data_vencimento) < referencia).map((p) => emDias(p.data_vencimento, referencia)));
      const classe = atraso > 0 ? classes.find((c) => atraso >= c.min && atraso <= c.max) : null;
      if (!classe) return;
      classe.capital = arredondar(classe.capital + capital);
      classe.juros = arredondar(classe.juros + juros);
      classe.n += 1;
    });
  const riscoCapital = soma(classes, (c) => c.capital);
  const riscoJuros = soma(classes, (c) => c.juros);

  const sectores = SECTORES_ACTIVIDADE.map((nome) => {
    const lista = concedidos.filter((e) => (SECTORES_ACTIVIDADE.includes(e.sector_atividade) ? e.sector_atividade : SECTOR_PADRAO) === nome);
    return { nome, montante: soma(lista, (e) => e.valor_emprestado), n: lista.length };
  });
  const semSector = concedidos.filter((e) => !SECTORES_ACTIVIDADE.includes(e.sector_atividade)).length;

  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const idsActivos = [...new Set(emprestimos.filter((e) => ESTADOS_ABERTOS.includes(e.status) && dataConcessao(e) <= ate).map((e) => String(e.client_id)))];
  const porGenero = { homens: 0, mulheres: 0, outros: 0 };
  idsActivos.forEach((id) => { porGenero[generoDe(clientes[id])] += 1; });

  const taxas = extremos(concedidos.map(taxaMensal));
  const prazos = extremos(concedidos.map(prazoEmMeses));

  const proprios = operador.capitais_proprios === "" || operador.capitais_proprios == null ? Number(operador.capital_actual) || 0 : Number(operador.capitais_proprios) || 0;
  const nacionais = Number(operador.alheios_nacionais) || 0;
  const estrangeiros = Number(operador.alheios_estrangeiros) || 0;
  const emprestimosObtidos = Number(manuais.emprestimos_obtidos) || 0;
  const donativos = Number(manuais.donativos) || 0;
  const aumentoCapital = Number(manuais.aumento_capital) || 0;

  const carteiras = listarCarteiras();
  const porCarteira = {};
  listarTransacoes().slice().reverse().forEach((t) => {
    (porCarteira[String(t.wallet_id)] = porCarteira[String(t.wallet_id)] || []).push(t);
  });
  Object.values(porCarteira).forEach((lista) => lista.sort((a, b) => String(a.data_transacao).localeCompare(String(b.data_transacao)) || String(a.codigo_transacao).localeCompare(String(b.codigo_transacao))));
  const meses = mesesDoPeriodo(de, ate).map((mes) => {
    if (!mes) return null;
    const saldos = { caixa: 0, bancos: 0, outros: 0 };
    carteiras.forEach((c) => {
      const saldo = saldoEm(c, mes.data, porCarteira[String(c.id)] || []);
      if (c.tipo === "Caixa") saldos.caixa += saldo;
      else if (c.tipo === "Banco") saldos.bancos += saldo;
      else saldos.outros += saldo;
    });
    return {
      rotulo: mes.rotulo,
      data: mes.data,
      caixa: arredondar(saldos.caixa),
      bancos: arredondar(saldos.bancos),
      outros: arredondar(saldos.outros),
      total: arredondar(saldos.caixa + saldos.bancos + saldos.outros),
    };
  });

  return {
    periodo: { de, ate, texto: `${dataPorExtenso(de)} a ${dataPorExtenso(ate)}` },
    operador: { ...operador, inicio_actividades: mesPorExtenso(operador.inicio_actividades) },
    volume: {
      concedidos: { capital: capitalConcedido, juro: jurosConcedidos },
      reembolsados: { capital: capitalPago, juro: jurosPagos },
      abatidos: { capital: abatidoCapital, juro: abatidoJuro },
      activa: { capital: arredondar(activaCapital), juro: arredondar(activaJuros) },
      risco: { capital: riscoCapital, juro: riscoJuros },
    },
    numero: { concedidos: concedidos.length, reembolsados: reembolsados.length },
    sectores,
    clientes: { ...porGenero, total: porGenero.homens + porGenero.mulheres + porGenero.outros },
    classes,
    taxas: { juroMin: arredondar(taxas.min), juroMax: arredondar(taxas.max), prazoMin: arredondar(prazos.min), prazoMax: arredondar(prazos.max) },
    fontes: { proprios: arredondar(proprios), nacionais, estrangeiros, alheios: arredondar(nacionais + estrangeiros), total: arredondar(proprios + nacionais + estrangeiros) },
    financiamentos: { emprestimos: emprestimosObtidos, donativos, aumentoCapital, total: arredondar(emprestimosObtidos + donativos + aumentoCapital) },
    capital: { inicial: Number(operador.capital_inicial) || 0, actual: Number(operador.capital_actual) || 0 },
    situacao: meses,
    notas: { semSector, contratos: concedidos.length },
  };
};
