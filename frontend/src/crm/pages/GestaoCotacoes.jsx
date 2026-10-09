import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, Edit, MoreVertical, 
  FileText, CheckCircle, Clock, XCircle, TrendingUp,
  Calendar, User, Building, Phone, Mail, MapPin,
  Printer, Send, X, AlertCircle, ChevronRight,
  ChevronLeft, ChevronsLeft, ChevronsRight, Loader2, Trash2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { cotacaoService } from '../services/api';
import VisualizacaoClienteDocumentos from '../components/VisualizacaoClienteDocumentos';
import CotacaoStatusBadge from '../components/ui/CotacaoStatusBadge';
import AnimatedPagination from '../components/ui/AnimatedPagination';
import DataTableWrapper from '../components/ui/DataTableWrapper';
import { STATUS_FILTER_OPTIONS } from '../utils/cotacaoStatus';

function GestaoCotacoes() {
  const { themeConfig, language } = useTheme();
  const { usuario } = useAuth();
  const userRole = usuario?.role || 'agente';
  const isAdminOuSubscritor = userRole === 'admin' || userRole === 'subscritor';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCotacao, setSelectedCotacao] = useState(null);
  const [mostrarDadosCliente, setMostrarDadosCliente] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const getText = (pt, en, fr) => {
    switch (language) {
      case 'pt': return pt;
      case 'en': return en;
      case 'fr': return fr;
      default: return pt;
    }
  };

  // Carregar cotações do backend
  useEffect(() => {
    carregarCotacoes();
  }, [currentPage, filterStatus, searchTerm]);

  // Escutar evento de cotação criada para atualizar lista
  useEffect(() => {
    const handleCotacaoCriada = () => {
      carregarCotacoes();
    };

    window.addEventListener('cotacaoCriada', handleCotacaoCriada);
    return () => window.removeEventListener('cotacaoCriada', handleCotacaoCriada);
  }, []);

  const carregarCotacoes = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      };

      console.log('🔍 [GestaoCotacoes] Buscando cotações com filtros:', filters);
      const result = await cotacaoService.listar(filters);
      console.log('📊 [GestaoCotacoes] Resultado:', {
        success: result.success,
        total: result.data?.length || 0,
        pagination: result.pagination
      });
      
      if (result.success) {
        // Transformar dados do backend para o formato esperado
        const cotacoesFormatadas = result.data.map(cotacao => ({
          id: cotacao.id, // ID numérico do backend (importante para buscar/editar)
          idNumerico: cotacao.id, // Manter referência ao ID numérico
          numero_cotacao: cotacao.numero_cotacao, // Número da cotação para exibição
          cliente: `${cotacao.primeiro_nome || ''} ${cotacao.sobrenome || ''}`.trim() || cotacao.cliente?.nome_empresa || 'N/A',
          cliente_email: cotacao.cliente_email || cotacao.cliente?.email || '',
          tipo: 'Automóvel',
          valor: parseFloat(cotacao.total_premio) || 0,
          data: cotacao.data_criacao,
          status: cotacao.status,
          agente: cotacao.agente_nome || 'N/A',
          seguradora: 'Imperial Seguros',
          vencimento: cotacao.data_validade,
          progresso: calcularProgresso(cotacao.status),
          ultimaAtualizacao: cotacao.data_atualizacao || cotacao.data_criacao
        }));
        
        setCotacoes(cotacoesFormatadas);
      } else {
        setCotacoes([]);
      }
    } catch (error) {
      console.error("Erro ao carregar cotações:", error);
      setCotacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresso = (status) => {
    switch (status) {
      case 'ativa': return 75;
      case 'aprovada': return 100;
      case 'pendente': return 45;
      case 'expirada': return 30;
      default: return 0;
    }
  };

  // Dados fictícios removidos - agora vem do backend
  const cotacoesFicticias = [
    {
      id: 'CT-2024-001',
      cliente: 'João Santos',
      tipo: 'Automóvel',
      valor: 85000,
      data: '2024-01-15',
      status: 'ativa',
      agente: 'Maria Silva',
      seguradora: 'Imperial Seguros',
      vencimento: '2024-07-15',
      progresso: 75,
      ultimaAtualizacao: '2024-01-20'
    },
    {
      id: 'CT-2024-002',
      cliente: 'Maria Costa',
      tipo: 'Saúde',
      valor: 50000,
      data: '2024-01-10',
      status: 'pendente',
      agente: 'Pedro Lima',
      seguradora: 'Imperial Seguros',
      vencimento: '2024-04-10',
      progresso: 45,
      ultimaAtualizacao: '2024-01-18'
    },
    {
      id: 'CT-2024-003',
      cliente: 'Carlos Oliveira',
      tipo: 'Residência',
      valor: 250000,
      data: '2024-01-05',
      status: 'aprovada',
      agente: 'Ana Costa',
      seguradora: 'Imperial Seguros',
      vencimento: '2025-01-05',
      progresso: 100,
      ultimaAtualizacao: '2024-01-19'
    },
    {
      id: 'CT-2024-004',
      cliente: 'Ana Silva',
      tipo: 'Viagem',
      valor: 15000,
      data: '2024-01-12',
      status: 'expirada',
      agente: 'João Santos',
      seguradora: 'Imperial Seguros',
      vencimento: '2024-02-12',
      progresso: 30,
      ultimaAtualizacao: '2024-01-17'
    },
    {
      id: 'CT-2024-005',
      cliente: 'Empresa ABC Ltda',
      tipo: 'Empresarial',
      valor: 500000,
      data: '2024-01-08',
      status: 'ativa',
      agente: 'Carla Mondlane',
      seguradora: 'Imperial Seguros',
      vencimento: '2025-01-08',
      progresso: 60,
      ultimaAtualizacao: '2024-01-21'
    },
    {
      id: 'CT-2024-006',
      cliente: 'Roberto Fernandes',
      tipo: 'Vida',
      valor: 100000,
      data: '2024-01-22',
      status: 'pendente',
      agente: 'Luís Santos',
      seguradora: 'Imperial Seguros',
      vencimento: '2024-04-22',
      progresso: 20,
      ultimaAtualizacao: '2024-01-25'
    },
    {
      id: 'CT-2024-007',
      cliente: 'Sofia Martins',
      tipo: 'Automóvel',
      valor: 95000,
      data: '2024-01-18',
      status: 'aprovada',
      agente: 'Pedro Lima',
      seguradora: 'Imperial Seguros',
      vencimento: '2025-01-18',
      progresso: 100,
      ultimaAtualizacao: '2024-01-23'
    },
    {
      id: 'CT-2024-008',
      cliente: 'Miguel Costa',
      tipo: 'Empresarial',
      valor: 750000,
      data: '2024-01-14',
      status: 'ativa',
      agente: 'Carla Mondlane',
      seguradora: 'Imperial Seguros',
      vencimento: '2025-01-14',
      progresso: 85,
      ultimaAtualizacao: '2024-01-24'
    },
    {
      id: 'CT-2024-009',
      cliente: 'Lara Silva',
      tipo: 'Residência',
      valor: 350000,
      data: '2024-01-20',
      status: 'pendente',
      agente: 'Ana Costa',
      seguradora: 'Imperial Seguros',
      vencimento: '2024-04-20',
      progresso: 40,
      ultimaAtualizacao: '2024-01-26'
    },
    {
      id: 'CT-2024-010',
      cliente: 'Ricardo Almeida',
      tipo: 'Viagem',
      valor: 25000,
      data: '2024-01-16',
      status: 'expirada',
      agente: 'Maria Silva',
      seguradora: 'Imperial Seguros',
      vencimento: '2024-02-16',
      progresso: 15,
      ultimaAtualizacao: '2024-01-27'
    }
  ];

  const filteredCotacoes = cotacoes.filter(cotacao => {
    const matchesSearch = cotacao.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cotacao.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cotacao.agente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || cotacao.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Paginação
  const totalPages = Math.ceil(filteredCotacoes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCotacoes.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusColor = (status) => {
    switch (status) {
      case 'finalizada': return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' };
      case 'ativa': return { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700' };
      case 'aprovada': return { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700' };
      case 'pendente': return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' };
      case 'expirada': return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700' };
      case 'cancelada': return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' };
      default: return { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-700' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'finalizada': return 'Finalizada';
      case 'ativa': return 'Ativa';
      case 'aprovada': return 'Aprovada';
      case 'pendente': return 'Pendente';
      case 'expirada': return 'Expirada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const handleEliminar = async (cotacao) => {
    if (!cotacao || (!cotacao.id && !cotacao.idNumerico)) {
      alert("❌ Cotação inválida.");
      return;
    }

    // Usar o ID numérico do backend
    const idParaEliminar = cotacao.idNumerico || cotacao.id;

    const confirmarEliminacao = window.confirm(
      `⚠️ ATENÇÃO: Deseja realmente ELIMINAR a cotação ${cotacao.numero_cotacao || cotacao.id}?\n\nEsta ação não pode ser desfeita!`
    );

    if (!confirmarEliminacao) {
      return;
    }

    try {
      const result = await cotacaoService.excluir(idParaEliminar);
      
      if (result.success) {
        alert(`✅ Cotação ${cotacao.numero_cotacao || cotacao.id} eliminada com sucesso!`);
        carregarCotacoes(); // Recarregar lista
      } else {
        alert(`❌ Erro ao eliminar cotação: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao eliminar cotação:", error);
      alert(`❌ Erro ao eliminar cotação: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
  };

  const handlePrint = async (cotacao) => {
    if (!cotacao || (!cotacao.id && !cotacao.idNumerico)) {
      alert("❌ Cotação inválida.");
      return;
    }

    try {
      // Usar o ID numérico do backend (idNumerico ou id)
      const idParaBuscar = cotacao.idNumerico || cotacao.id;
      
      // Buscar cotação completa do backend
      const result = await cotacaoService.buscarPorId(idParaBuscar);
      
      if (result.success && result.data) {
        const cotacaoCompleta = result.data;
        
        // Transformar dados para o formato esperado pelo gerador de PDF
        const cotacaoFormatada = {
          id: cotacaoCompleta.numero_cotacao || cotacaoCompleta.id,
          numero_cotacao: cotacaoCompleta.numero_cotacao,
          cliente: {
            primeiroNome: cotacaoCompleta.cliente?.primeiro_nome || cotacaoCompleta.primeiro_nome || '',
            sobrenome: cotacaoCompleta.cliente?.sobrenome || cotacaoCompleta.sobrenome || '',
            email: cotacaoCompleta.cliente?.email || cotacaoCompleta.cliente_email || '',
            telefone: cotacaoCompleta.cliente?.telefone || cotacaoCompleta.cliente_telefone || '',
            tipo: cotacaoCompleta.cliente?.tipo || 'Particular',
            numeroDocumento: cotacaoCompleta.cliente?.numero_documento || '',
            morada: cotacaoCompleta.cliente?.morada || ''
          },
          veiculos: cotacaoCompleta.veiculos || [],
          totalPremio: parseFloat(cotacaoCompleta.total_premio || 0),
          dataCriacao: cotacaoCompleta.data_criacao || cotacaoCompleta.created_at || new Date().toISOString(),
          dataValidade: cotacaoCompleta.data_validade,
          status: cotacaoCompleta.status,
          agente_nome: cotacaoCompleta.agente_nome || '',
          agente_balcao: cotacaoCompleta.agente_balcao || ''
        };
        
        // Importar e usar o gerador de PDF
        const { gerarPDFPersonalizado } = await import('../components/GeradorPDFPersonalizado');
        gerarPDFPersonalizado(cotacaoFormatada, 'imprimir');
      } else {
        alert("❌ Erro ao buscar cotação para impressão.");
      }
    } catch (error) {
      console.error("Erro ao imprimir cotação:", error);
      alert("❌ Erro ao imprimir cotação.");
    }
  };

  const handleEmail = async (cotacao) => {
    // Usar o ID numérico do backend
    const idParaBuscar = cotacao.idNumerico || cotacao.id;
    
    // Buscar cotação completa para obter email do cliente
    try {
      const result = await cotacaoService.buscarPorId(idParaBuscar);
      
      if (!result.success || !result.data) {
        alert("❌ Erro ao buscar cotação.");
        return;
      }
      
      const cotacaoCompleta = result.data;
      const clienteEmail = cotacaoCompleta.cliente?.email || cotacaoCompleta.cliente_email || cotacao.cliente_email;
      
      if (!clienteEmail) {
        alert("❌ O cliente não tem email cadastrado.");
        return;
      }
      
      const confirmarEnvio = window.confirm(
        `Deseja enviar a cotação ${cotacaoCompleta.numero_cotacao || cotacao.numero_cotacao || cotacao.id} por email para ${clienteEmail}?`
      );
      
      if (!confirmarEnvio) {
        return;
      }

      const emailResult = await cotacaoService.enviarEmail(idParaBuscar);
      
      if (emailResult.success) {
        alert(`✅ Email enviado com sucesso para ${clienteEmail}!`);
      } else {
        alert(`❌ Erro ao enviar email: ${emailResult.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      alert(`❌ Erro ao enviar email: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
  };

  // Função para gerar números de página com animação
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers.map((number, index) => (
      <button
        key={index}
        onClick={() => typeof number === 'number' && setCurrentPage(number)}
        disabled={typeof number !== 'number'}
        className={`
          relative px-4 py-2 text-sm font-medium transition-all duration-300
          ${typeof number === 'number'
            ? currentPage === number
              ? 'text-white scale-105'
              : 'text-gray-700 hover:text-emerald-700 hover:bg-emerald-50'
            : 'text-gray-400 cursor-default'
          }
        `}
      >
        {typeof number === 'number' && currentPage === number && (
          <span className="absolute inset-0 bg-emerald-600 rounded-lg shadow-lg -z-10 animate-fadeIn"></span>
        )}
        {number}
      </button>
    ));
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white crm-cotacoes-page">
      {/* Efeitos de background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-emerald-50 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-green-100/30 rounded-full blur-3xl animate-pulse-slower"></div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-3xl font-black mb-2 text-gray-900 tracking-tight">
            {getText("Gestão de Cotações", "Quote Management", "Gestion des Devis")}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            {getText("Gerencie e acompanhe todas as cotações do sistema", "Manage and track all system quotes", "Gérez et suivez tous les devis du système")}
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: getText("Total de Cotações", "Total Quotes", "Total Devis"), value: cotacoes.length, icon: FileText, color: "bg-emerald-100 text-emerald-700" },
            { label: getText("Ativas", "Active", "Actives"), value: cotacoes.filter(c => c.status === 'ativa').length, icon: CheckCircle, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
            { label: getText("Pendentes", "Pending", "En attente"), value: cotacoes.filter(c => c.status === 'pendente').length, icon: Clock, color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
            { label: getText("Valor Total", "Total Value", "Valeur Totale"), value: "2.0M", icon: TrendingUp, color: "bg-purple-100 text-purple-700 hover:bg-purple-200" }
          ].map((stat, index) => (
            <div 
              key={index}
              className="rounded-xl p-6 bg-white border border-gray-200 transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color} transition-colors duration-300`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </div>
              <h3 className="text-sm font-semibold mb-2 text-gray-700">{stat.label}</h3>
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(index + 1) * 25}%`,
                    background: `linear-gradient(90deg, ${themeConfig.primaryLight || '#4ade80'}, ${themeConfig.primaryDark || '#22c55e'})`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros e Busca */}
        <div className="mb-6 pb-4 border-b border-gray-200/60">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <input
                  type="text"
                  placeholder={getText("Buscar por cliente, ID ou agente...", "Search by client, ID or agent...", "Rechercher par client, ID ou agent...")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg transition-all duration-300 border border-gray-300 text-gray-900 hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <select
                  className="pl-10 pr-4 py-3 rounded-lg transition-all duration-300 border border-gray-300 text-gray-900 hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-w-[180px]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">{getText("Todos os status", "All status", "Tous les statuts")}</option>
                  {STATUS_FILTER_OPTIONS.filter(o => o.value !== 'all').map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              
              <button 
                className="btn-cotacao-gerar px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-emerald-700 flex items-center space-x-2 group bg-emerald-600 text-white"
              >
                <Download className="h-5 w-5 group-hover:animate-bounce" />
                <span>{getText("Exportar", "Export", "Exporter")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Cotações */}
        <DataTableWrapper>
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-emerald-50/40">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-emerald-600" />ID</span></th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><User className="h-4 w-4 text-emerald-600" />Cliente</span></th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Tipo</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Valor</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Agente</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Progresso</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((cotacao) => (
                    <tr 
                      key={cotacao.id} 
                      className="border-b border-gray-100 hover:bg-emerald-50/60 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-emerald-700 font-semibold text-sm">
                          {cotacao.numero_cotacao || cotacao.id}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[200px]">
                        <div className="text-gray-900 font-medium truncate">{cotacao.cliente}</div>
                        <div className="text-gray-500 text-xs truncate">{cotacao.data ? new Date(cotacao.data).toLocaleDateString('pt-MZ') : '—'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{cotacao.tipo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-900 font-semibold">
                          {cotacao.valor.toLocaleString('pt-MZ')} MZN
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CotacaoStatusBadge status={cotacao.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm">{cotacao.agente}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${cotacao.progresso}%`,
                                background: `linear-gradient(90deg, ${themeConfig.primaryLight || '#4ade80'}, ${themeConfig.primaryDark || '#22c55e'})`
                              }}
                            ></div>
                          </div>
                          <span className="text-emerald-700 text-xs font-medium w-10">
                            {cotacao.progresso}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handlePrint(cotacao)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                            title="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEmail(cotacao)}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                            title="Enviar Email"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                // Usar o ID numérico do backend
                                const idParaBuscar = cotacao.idNumerico || cotacao.id;
                                const result = await cotacaoService.buscarPorId(idParaBuscar);
                                if (result.success && result.data) {
                                  setSelectedCotacao(result.data);
                                } else {
                                  alert("❌ Erro ao buscar cotação.");
                                }
                              } catch (error) {
                                console.error("Erro ao buscar cotação:", error);
                                alert("❌ Erro ao buscar cotação.");
                              }
                            }}
                            className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isAdminOuSubscritor && (
                            <button 
                              onClick={() => {
                                setSelectedCotacao(cotacao);
                                setMostrarDadosCliente(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                              title="Ver Dados do Cliente e Documentos"
                            >
                              <User className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEliminar(cotacao)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="Eliminar Cotação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
        </DataTableWrapper>

          {filteredCotacoes.length > 0 && (
            <AnimatedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCotacoes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
      </div>

      {/* Modal de Dados do Cliente e Documentos */}
      {mostrarDadosCliente && selectedCotacao && (
        <VisualizacaoClienteDocumentos
          cotacaoId={selectedCotacao.id || selectedCotacao.idNumerico}
          clienteId={selectedCotacao.cliente?.id}
          onClose={() => {
            setMostrarDadosCliente(false);
          }}
        />
      )}

      {/* Modal de Detalhes */}
      {selectedCotacao && !mostrarDadosCliente && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-xl p-6 w-full max-w-md bg-white border border-gray-200 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Detalhes da Cotação</h3>
              <button 
                onClick={() => setSelectedCotacao(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="text-gray-900 font-medium">{selectedCotacao.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="text-gray-900 font-medium">{selectedCotacao.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="text-gray-900 font-medium">{selectedCotacao.valor.toLocaleString('pt-MZ')} MZN</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedCotacao.status).bg} ${getStatusColor(selectedCotacao.status).text} ${getStatusColor(selectedCotacao.status).border}`}>
                    {getStatusText(selectedCotacao.status)}
                  </span>
                </div>
              </div>
              <button 
                className="w-full py-3 rounded-lg font-semibold transition-colors duration-300 hover:bg-emerald-700 bg-emerald-600 text-white"
              >
                Ver Detalhes Completos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestaoCotacoes;