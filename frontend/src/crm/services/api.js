import axios from 'axios';

// URL do backend — desenvolvimento: localhost | produção: portal-imp
const API_BASE_URL = import.meta.env.VITE_CRM_API_URL || '/api/';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'   // útil mesmo em produção
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true';
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ [API] Erro na resposta:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('❌ [API] Erro na requisição (sem resposta):', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
    } else {
      console.error('❌ [API] Erro ao configurar requisição:', error.message);
    }

    if (error.response?.status === 401) {
      console.warn("[CRM API] Sessão inválida no serviço de cotações.");
    }
    return Promise.reject(error);
  }
);

// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================
export const usuarioService = {
  login: async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro no login:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro de conexão com o servidor"
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("usuario");
    return { success: true };
  },
  validateToken: async (token) => {
    try {
      const response = await api.get('/auth/verify');
      return { valid: true, user: response.data.data.user };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },
  verificarToken: async (token) => usuarioService.validateToken(token),
  getUserInfo: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error);
      return null;
    }
  },
  findAll: async () => {
    try {
      const response = await api.get('/auth/users');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Erro ao buscar usuários"
      };
    }
  },
  listarSubscritores: async () => {
    try {
      const response = await api.get('/auth/users/subscritores');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error("Erro ao buscar subscritores:", error);
      return { success: false, data: [], message: error.response?.data?.message || 'Erro ao buscar subscritores' };
    }
  },
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/auth/users/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar utilizador"
      };
    }
  },
  criar: async (dados) => {
    try {
      const response = await api.post('/auth/users', dados);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao criar utilizador"
      };
    }
  },
  atualizar: async (id, dados) => {
    try {
      const response = await api.put(`/auth/users/${id}`, dados);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao atualizar utilizador"
      };
    }
  },
  atualizarSenha: async (id, senha) => {
    try {
      const response = await api.put(`/auth/users/${id}/senha`, { senha });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao atualizar senha"
      };
    }
  },
  excluir: async (id) => {
    try {
      const response = await api.delete(`/auth/users/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao eliminar utilizador"
      };
    }
  }
};

// ============================================
// SERVIÇO DE BALCÕES
// ============================================
export const balcaoService = {
  listar: async () => {
    try {
      const response = await api.get('/balcoes');
      const data = response.data?.data || response.data || [];
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data };
      }
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error('Erro ao buscar balcões:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Erro ao buscar balcões'
      };
    }
  },
  criar: async (nome) => {
    try {
      const response = await api.post('/balcoes', { nome });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Erro ao criar balcão:', error);
      return { success: false, message: error.response?.data?.message || 'Erro ao criar balcão' };
    }
  }
};


// ============================================
// SERVIÇO DE COTAÇÕES
// ============================================
export const cotacaoService = {
  enviarEmail: async (id) => {
    try {
      console.log('📧 Enviando email para cotação:', id);
      const response = await api.post(`/cotacoes/${id}/enviar-email`);
      console.log('✅ Resposta do servidor:', response.data);
      if (response.data && response.data.success !== undefined) return response.data;
      return {
        success: true,
        message: response.data.message || 'Email enviado com sucesso',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao enviar email',
        error: error.response?.data?.error || error.message
      };
    }
  },
  listar: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.status) params.append('status', filters.status);
      if (filters.status_aprovacao) params.append('status_aprovacao', filters.status_aprovacao);
      if (filters.search) params.append('search', filters.search);
      const url = `/cotacoes?${params.toString()}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error("Erro ao listar cotações:", error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        message: error.response?.data?.message || "Erro ao buscar cotações"
      };
    }
  },
  buscarStats: async () => {
    try {
      const response = await api.get('/cotacoes/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { success: false, data: null };
    }
  },
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/cotacoes/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao buscar cotação:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar cotação"
      };
    }
  },
  criar: async (cotacaoData) => {
    try {
      const response = await api.post('/cotacoes', cotacaoData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao criar cotação:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao criar cotação"
      };
    }
  },
  editar: async (id, cotacaoData) => {
    try {
      const response = await api.put(`/cotacoes/${id}`, cotacaoData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao editar cotação:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao editar cotação"
      };
    }
  },
  atualizarDocumentos: async (id, documentos) => {
    try {
      const response = await api.put(`/cotacoes/${id}`, documentos);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao atualizar documentos:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao atualizar documentos"
      };
    }
  },
  excluir: async (id) => {
    try {
      await api.delete(`/cotacoes/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir cotação:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao excluir cotação"
      };
    }
  },
  finalizar: async (id, dados) => {
    try {
      const response = await api.post(`/cotacoes/${id}/finalizar`, dados);
      return { success: true, data: response.data.data, envios: response.data.envios };
    } catch (error) {
      console.error("Erro ao finalizar cotação:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao finalizar cotação"
      };
    }
  },
  listarPendentesAprovacao: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.status_aprovacao) params.append('status_aprovacao', filters.status_aprovacao);
      const response = await api.get(`/cotacoes/aprovacao/pendentes?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erro ao listar aprovações:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erro ao listar aprovações'
      };
    }
  },
  historicoAprovacao: async (id) => {
    try {
      const response = await api.get(`/cotacoes/${id}/aprovacao/historico`);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Erro ao buscar histórico de aprovação:', error);
      return { success: false, data: [], message: error.response?.data?.message };
    }
  },
  aprovarTaxa: async (id, comentario = '') => {
    try {
      const response = await api.post(`/cotacoes/${id}/aprovacao/aprovar`, { comentario });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao aprovar taxa'
      };
    }
  },
  rejeitarTaxa: async (id, motivo) => {
    try {
      const response = await api.post(`/cotacoes/${id}/aprovacao/rejeitar`, { motivo });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao rejeitar taxa'
      };
    }
  }
};

// ============================================
// SERVIÇO DE ARQUIVOS
// ============================================
export const arquivoService = {
  upload: async (file, categoria = 'cotacoes') => {
    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      const response = await api.post(`/arquivos/upload/${categoria}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao fazer upload'
      };
    }
  },
  baixar: async (relativePath, nomeArquivo) => {
    try {
      const response = await api.get('/arquivos/download', {
        params: { path: relativePath },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeArquivo || relativePath.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao baixar arquivo'
      };
    }
  },
  obterUrlPreview: async (relativePath) => {
    try {
      const response = await api.get('/arquivos/download', {
        params: { path: relativePath, preview: true },
        responseType: 'blob'
      });
      return { success: true, url: window.URL.createObjectURL(response.data) };
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao visualizar arquivo'
      };
    }
  }
};

// ============================================
// SERVIÇO DE FOLLOW-UPS (mantido igual)
// ============================================
export const followUpService = {
  listar: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.cotacao_id) params.append('cotacao_id', filters.cotacao_id);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.status) params.append('status', filters.status);
      const response = await api.get(`/followups?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error("Erro ao listar follow-ups:", error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        message: error.response?.data?.message || "Erro ao buscar follow-ups"
      };
    }
  },
  buscarPorId: async (id) => {
    try {
      const response = await api.get(`/followups/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao buscar follow-up:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar follow-up"
      };
    }
  },
  criar: async (followUpData) => {
    try {
      const response = await api.post('/followups', followUpData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao criar follow-up:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao criar follow-up"
      };
    }
  },
  editar: async (id, followUpData) => {
    try {
      const response = await api.put(`/followups/${id}`, followUpData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Erro ao editar follow-up:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao editar follow-up"
      };
    }
  },
  excluir: async (id) => {
    try {
      await api.delete(`/followups/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir follow-up:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao excluir follow-up"
      };
    }
  }
};

// ============================================
// SERVIÇO DE ESTATÍSTICAS (mantido igual)
// ============================================
export const estatisticasService = {
  buscarMetricas: async () => {
    try {
      const result = await cotacaoService.buscarStats();
      if (result.success && result.data) {
        const s = result.data;
        const revenue = s.receita_total || 0;
        const revenueFormatted = revenue >= 1000000
          ? `MT ${(revenue / 1000000).toFixed(1)}M`
          : `MT ${(revenue / 1000).toFixed(0)}K`;
        return {
          success: true,
          data: {
            totalQuotes: s.total || 0,
            pendingApproval: s.ativas || 0,
            policiesIssued: s.aprovadas || 0,
            expiredQuotes: s.expiradas || 0,
            activeAgents: s.agentes_ativos || 0,
            conversionRate: `${s.taxa_conversao || 0}%`,
            revenue: revenueFormatted,
            recentes: s.recentes || []
          }
        };
      }
      return {
        success: false,
        data: { totalQuotes: 0, pendingApproval: 0, policiesIssued: 0, activeAgents: 0, conversionRate: '0%', revenue: 'MT 0', recentes: [] }
      };
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      return {
        success: false,
        data: { totalQuotes: 0, pendingApproval: 0, policiesIssued: 0, activeAgents: 0, conversionRate: '0%', revenue: 'MT 0', recentes: [] }
      };
    }
  },
  buscarNotificacoes: async () => {
    try {
      const result = await cotacaoService.buscarStats();
      if (!result.success || !result.data) return { success: true, data: [] };

      const s = result.data;
      const notifications = [];
      if (s.aprovadas > 0) {
        notifications.push({ id: 1, text: 'Nova cotação aprovada - Aguardando emissão de apólice', time: '2 min atrás', unread: true, type: 'approval', priority: 'high' });
      }
      if (s.ativas > 0) {
        notifications.push({ id: 2, text: `${s.ativas} cotação(ões) em acompanhamento`, time: '15 min atrás', unread: true, type: 'expiry', priority: 'medium' });
      }
      if (s.total > 0) {
        notifications.push({ id: 3, text: `${s.total} cotação(ões) no sistema`, time: '1 hora atrás', unread: false, type: 'achievement', priority: 'low' });
      }
      return { success: true, data: notifications };
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return { success: true, data: [] };
    }
  },
  buscarMensagens: async () => {
    try {
      const result = await cotacaoService.listar({ limit: 20 });
      if (result.success && result.data) {
        const cotacoes = result.data;
        const messages = [];
        const apolices = cotacoes.filter(c => c.status === 'aprovada');
        if (apolices.length > 0) {
          messages.push({
            id: 1,
            text: `Subscritor: Nova apólice emitida #${apolices[0].numero_cotacao}`,
            time: "5 min atrás",
            unread: true,
            type: "policy",
            priority: "high"
          });
        }
        return { success: true, data: messages };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      return { success: true, data: [] };
    }
  }
};

// ============================================
// FUNÇÃO GENÉRICA E SERVIÇO DE RELATÓRIOS (mantidos)
// ============================================
export const apiRequest = async (endpoint, method = "GET", data = null) => {
  try {
    const config = { method, url: endpoint, ...(data && { data }) };
    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error(`Erro na requisição ${method} ${endpoint}:`, error);
    throw error;
  }
};

export const relatorioService = {
  baixarPDF: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.ano) params.append('ano', filtros.ano);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.agente_id) params.append('agente_id', filtros.agente_id);
      if (filtros.balcao) params.append('balcao', filtros.balcao);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      const response = await api.get(`/relatorios/pdf?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_cotacoes_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Erro ao baixar relatório PDF:', error);
      return { success: false, message: error.response?.data?.message || 'Erro ao baixar relatório PDF' };
    }
  },
  baixarExcel: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.ano) params.append('ano', filtros.ano);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.agente_id) params.append('agente_id', filtros.agente_id);
      if (filtros.balcao) params.append('balcao', filtros.balcao);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      const response = await api.get(`/relatorios/excel?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_cotacoes_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Erro ao baixar relatório Excel:', error);
      return { success: false, message: error.response?.data?.message || 'Erro ao baixar relatório Excel' };
    }
  }
};

export default {
  usuarioService,
  balcaoService,
  cotacaoService,
  followUpService,
  estatisticasService,
  relatorioService,
  arquivoService,
  apiRequest,
  api
};