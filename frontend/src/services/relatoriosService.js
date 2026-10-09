// services/relatoriosService.js
import api from "./api";
import {
  construirMapaMensal,
  extrairAgentesVendedoresDeSeguros,
  filtrarAgentesVendedores,
  isSeguroVenda,
  normalizarListaAgentes,
} from "../utils/seguroEstatisticas";

export const relatoriosService = {
  /** Mapa mensal calculado no frontend (agentes vendedores; ativo, emitido, finalizada, alocada). */
  async getMapaMensalSupervisor(params, escopoTipo = "admin") {
    const segurosRes = await api.get("/api/seguros");
    const seguros = Array.isArray(segurosRes.data) ? segurosRes.data : [];

    let agentesApi = [];
    try {
      const agentesRes = await api.get("/api/agentes");
      agentesApi = normalizarListaAgentes(agentesRes.data);
    } catch {
      agentesApi = [];
    }

    let agentes = filtrarAgentesVendedores(agentesApi);
    if (!agentes.length) {
      agentes = extrairAgentesVendedoresDeSeguros(
        seguros.filter((s) => isSeguroVenda(s))
      );
    }

    const idsVendedores = new Set(agentes.map((a) => Number(a.id)));
    const segurosRelatorio = seguros.filter(
      (s) => isSeguroVenda(s) && idsVendedores.has(Number(s.agente_id))
    );

    const tipoPeriodo = params.mes ? "mensal" : "personalizado";

    return construirMapaMensal({
      seguros: segurosRelatorio,
      agentes,
      mes: params.mes,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      tipoPeriodo,
      escopoTipo,
    });
  },

  // Buscar dados para relatório de vendas
  async getVendasPorPeriodo(dataInicio, dataFim) {
    const response = await api.get("/api/relatorios/vendas-periodo", {
      params: { dataInicio, dataFim },
    });
    return response.data;
  },

  // Buscar dados para relatório por agente
  async getVendasPorAgente(dataInicio, dataFim) {
    const response = await api.get("/api/relatorios/vendas-agente", {
      params: { dataInicio, dataFim },
    });
    return response.data;
  },

  // Buscar dados para relatório por província
  async getVendasPorProvincia(dataInicio, dataFim) {
    const response = await api.get("/api/relatorios/top-provincias", {
      params: { dataInicio, dataFim },
    });
    return response.data;
  },

  // Buscar dados para desempenho por produto e província
  async getDesempenhoProdutoProvincia(dataInicio, dataFim) {
    const response = await api.get(
      "/api/relatorios/desempenho-produto-provincia",
      {
        params: { dataInicio, dataFim },
      }
    );
    return response.data;
  },

  // Buscar top províncias
  async getTopProvincias(dataInicio, dataFim) {
    const response = await api.get("/api/relatorios/top-provincias", {
      params: { dataInicio, dataFim },
    });
    return response.data;
  },

  // Buscar relatório financeiro
  async getRelatorioFinanceiro(dataInicio, dataFim) {
    const response = await api.get("/api/relatorios/financeiro", {
      params: { dataInicio, dataFim },
    });
    return response.data;
  },
};
