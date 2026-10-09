/** Estados que contam como venda nos relatórios. */
export const STATUS_VENDA = ["ativo", "emitido", "finalizada", "alocada"];

export const isSeguroVenda = (seguro) =>
  STATUS_VENDA.includes(String(seguro?.status || "").toLowerCase());

/** Apenas utilizadores com perfil de agente vendedor entram nos relatórios. */
export const isAgenteVendedor = (agente) =>
  String(agente?.tipo_usuario || "agente").toLowerCase() === "agente";

export const filtrarAgentesVendedores = (agentes = []) =>
  agentes.filter(isAgenteVendedor);

/** Fallback (ex.: subscrição sem acesso a /api/agentes): extrai agentes dos seguros. */
export const extrairAgentesVendedoresDeSeguros = (seguros = []) => {
  const map = new Map();
  seguros.forEach((seguro) => {
    const ag = seguro?.agente;
    if (!ag?.id) return;
    const id = Number(ag.id);
    if (!map.has(id)) {
      map.set(id, {
        id: ag.id,
        nome: ag.nome,
        telefone: ag.telefone,
        documento_identificacao: ag.documento_identificacao,
        nacionalidade: ag.nacionalidade,
        localizacao: ag.localizacao,
        endereco: ag.endereco,
        nome_bomba: ag.nome_bomba,
        tipo_usuario: "agente",
      });
    }
  });
  return [...map.values()];
};

export const normalizarListaAgentes = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.agentes)) return data.agentes;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const contarEstatisticasApolices = (seguros = []) => {
  let ativo = 0;
  let finalizada = 0;
  let alocada = 0;

  seguros.forEach((seguro) => {
    const status = String(seguro?.status || "").toLowerCase();
    if (status === "ativo") ativo += 1;
    else if (status === "finalizada") finalizada += 1;
    else if (status === "alocada") alocada += 1;
  });

  return {
    ativo,
    finalizada,
    alocada,
    total: ativo + finalizada + alocada,
  };
};

const parsePeriodo = ({ mes, dataInicio, dataFim, personalizado }) => {
  if (personalizado) {
    const inicio = new Date(`${dataInicio}T00:00:00.000Z`);
    const fimInclusiva = new Date(`${dataFim}T00:00:00.000Z`);
    const fimExclusiva = new Date(fimInclusiva);
    fimExclusiva.setUTCDate(fimExclusiva.getUTCDate() + 1);
    const tituloPeriodo = `${inicio.toLocaleDateString("pt-MZ", {
      timeZone: "UTC",
    })} a ${fimInclusiva.toLocaleDateString("pt-MZ", { timeZone: "UTC" })}`;
    return { dataInicio: inicio, dataFimInclusiva: fimInclusiva, dataFimExclusiva: fimExclusiva, tituloPeriodo, personalizado: true, mes: null };
  }

  const [ano, mesNumero] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, mesNumero - 1, 1));
  const fimExclusiva = new Date(Date.UTC(ano, mesNumero, 1));
  const fimInclusiva = new Date(fimExclusiva);
  fimInclusiva.setUTCDate(fimInclusiva.getUTCDate() - 1);
  const tituloPeriodo = inicio.toLocaleDateString("pt-MZ", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    dataInicio: inicio,
    dataFimInclusiva: fimInclusiva,
    dataFimExclusiva: fimExclusiva,
    tituloPeriodo,
    personalizado: false,
    mes,
  };
};

/**
 * Constrói o mapa mensal de vendas a partir de seguros e agentes (frontend).
 * Inclui apólices com estado ativo, emitido, finalizada ou alocada.
 * Apenas agentes vendedores (tipo «agente») entram nas linhas do relatório.
 */
export const construirMapaMensal = ({
  seguros = [],
  agentes = [],
  mes,
  dataInicio,
  dataFim,
  tipoPeriodo = "mensal",
  escopoTipo = "admin",
}) => {
  const agentesVenda = filtrarAgentesVendedores(agentes);
  const idsVendedores = new Set(agentesVenda.map((a) => Number(a.id)));
  const personalizado = tipoPeriodo === "personalizado";
  const periodo = parsePeriodo({
    mes,
    dataInicio,
    dataFim,
    personalizado,
  });

  const totalDias =
    Math.floor((periodo.dataFimInclusiva - periodo.dataInicio) / (24 * 60 * 60 * 1000)) + 1;
  const totalSemanas = personalizado ? Math.max(1, Math.ceil(totalDias / 7)) : 4;

  const periodos = Array.from({ length: totalSemanas }, (_, indice) => {
    const inicioSemana = new Date(periodo.dataInicio);
    inicioSemana.setUTCDate(inicioSemana.getUTCDate() + indice * 7);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setUTCDate(fimSemana.getUTCDate() + 6);
    if (fimSemana > periodo.dataFimInclusiva || (!personalizado && indice === 3)) {
      fimSemana.setTime(periodo.dataFimInclusiva.getTime());
    }
    return {
      semana: indice + 1,
      data_inicio: inicioSemana.toISOString().slice(0, 10),
      data_fim: fimSemana.toISOString().slice(0, 10),
    };
  });

  const linhasPorAgente = new Map(
    agentesVenda.map((agente) => [
      Number(agente.id),
      {
        agente_id: agente.id,
        agente: agente.nome,
        ponto_venda:
          agente.nome_bomba ||
          agente.bomba?.nome_bomba ||
          agente.bomba_endereco ||
          agente.endereco ||
          agente.localizacao ||
          "Não definido",
        semanas: periodos.map((p) => ({
          semana: p.semana,
          data_inicio: p.data_inicio,
          data_fim: p.data_fim,
          quantidade: 0,
          valor: 0,
        })),
        total_quantidade: 0,
        total_valor: 0,
      },
    ])
  );

  const segurosVenda = seguros.filter((seguro) => {
    if (!isSeguroVenda(seguro)) return false;
    if (!idsVendedores.has(Number(seguro.agente_id))) return false;
    const dataSeguro = new Date(seguro.data_emissao);
    return dataSeguro >= periodo.dataInicio && dataSeguro < periodo.dataFimExclusiva;
  });

  segurosVenda.forEach((seguro) => {
    const linha = linhasPorAgente.get(Number(seguro.agente_id));
    if (!linha) return;

    const dataSeguro = new Date(seguro.data_emissao);
    const diasDesdeInicio = Math.floor(
      (Date.UTC(
        dataSeguro.getUTCFullYear(),
        dataSeguro.getUTCMonth(),
        dataSeguro.getUTCDate()
      ) -
        periodo.dataInicio.getTime()) /
        (24 * 60 * 60 * 1000)
    );
    const semanaIndex = Math.min(
      Math.max(Math.floor(diasDesdeInicio / 7), 0),
      totalSemanas - 1
    );
    const valor = Number(seguro.premio_calculado) || 0;

    linha.semanas[semanaIndex].quantidade += 1;
    linha.semanas[semanaIndex].valor += valor;
    linha.total_quantidade += 1;
    linha.total_valor += valor;
  });

  const linhas = [...linhasPorAgente.values()];
  const totaisSemanais = periodos.map((p, indice) => ({
    ...p,
    quantidade: linhas.reduce((soma, linha) => soma + linha.semanas[indice].quantidade, 0),
    valor: linhas.reduce((soma, linha) => soma + linha.semanas[indice].valor, 0),
  }));

  return {
    tipo_periodo: personalizado ? "personalizado" : "mensal",
    mes: personalizado ? null : mes,
    data_inicio: periodo.dataInicio.toISOString().slice(0, 10),
    data_fim: periodo.dataFimInclusiva.toISOString().slice(0, 10),
    titulo: `Mapa das vendas - ${periodo.tituloPeriodo}`,
    escopo: escopoTipo,
    periodos,
    linhas,
    totais_semanais: totaisSemanais,
    total_quantidade: linhas.reduce((soma, linha) => soma + linha.total_quantidade, 0),
    total_valor: linhas.reduce((soma, linha) => soma + linha.total_valor, 0),
  };
};
