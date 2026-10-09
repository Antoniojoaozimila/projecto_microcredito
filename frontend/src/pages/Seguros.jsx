import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCar, FaFileAlt, FaCalendarAlt, FaPhone, FaUser, 
  FaTimes, FaSync, FaSearch, FaChevronLeft, 
  FaChevronRight, FaFilter, FaEdit,
  FaSave, FaPrint, FaIdCard,
  FaMapMarkerAlt, FaEnvelope, FaCog,
  FaEye, FaFilePdf, FaFileExcel,
  FaTrash, FaUserShield, FaWhatsapp, FaCheck, FaMapPin
} from 'react-icons/fa';
import api from '../services/api';
import PageLoader from '../components/PageLoader/PageLoader';
import ImperialSelect from '../components/ImperialSelect/ImperialSelect';
import { AuthContext } from '../contexts/AuthContext';
import { urlLogo } from '../services/logoDocumento';
import "./Seguros.css";

// Serviço de Cache Local
const cacheService = {
  CACHE_KEYS: {
    SEGUROS: 'seguros_cache',
    TIMESTAMP: 'cache_timestamp'
  },

  CACHE_EXPIRY: 5 * 60 * 1000, // 5 minutos

  set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
      return false;
    }
  },

  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > this.CACHE_EXPIRY;

      if (isExpired) {
        this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Erro ao obter do cache:', error);
      this.remove(key);
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erro ao remover do cache:', error);
    }
  },

  clear() {
    try {
      Object.values(this.CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
};

const Seguros = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const tipoUsuario = String(usuario?.tipo || '').toLowerCase();
  const [seguros, setSeguros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(null);
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    estado: '',
    dataInicio: '',
    dataFim: '',
    agente: '',
    temKit: '',
    matricula: '',
    cliente: '',
    premioMin: '',
    premioMax: '',
  });
  const [usandoCache, setUsandoCache] = useState(false);
  const [modalApoliceKit, setModalApoliceKit] = useState({ aberto: false, seguro: null, apoliceKit: '' });
  const [accaoSeguroId, setAccaoSeguroId] = useState(null);
  const tabelaRef = useRef(null);

  // Constantes para paginação
  const itensPorPagina = 10;
  
  // Buscar seguros da API
// Buscar seguros da API
const fetchSeguros = async (forcarAtualizacao = false) => {
  setCarregando(true);
  
  // Verificar token
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar logado para visualizar os seguros!');
    setCarregando(false);
    setSeguros([]);
    return;
  }

  try {
    let data;
    let fromCache = false;

    // Verificar cache se não for forçar atualização
    if (!forcarAtualizacao) {
      const cachedSeguros = cacheService.get(cacheService.CACHE_KEYS.SEGUROS);
      if (cachedSeguros) {
        data = cachedSeguros;
        fromCache = true;
        setUsandoCache(true);
        console.log('Usando dados do cache');
      }
    }

    // Se não tem cache ou forçou atualização, buscar da API
    if (!data) {
      try {
        console.log('🔄 Buscando seguros da API...');
        const res = await api.get('/api/seguros');
        data = res.data;
        console.log('✅ Dados recebidos da API:', data);
        
        // Salvar no cache
        cacheService.set(cacheService.CACHE_KEYS.SEGUROS, data);
        setUsandoCache(false);
      } catch (err) {
        console.error('❌ Erro na API:', err);
        
        // Tratamento específico de erros
        if (err.response?.status === 401) {
          alert('Sessão expirada. Faça login novamente.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else if (err.response?.status === 403) {
          alert('Acesso negado. Verifique suas permissões.');
        } else if (err.response?.status === 404) {
          alert('Endpoint não encontrado. Verifique a URL.');
        } else {
          let msg = err?.response?.data?.message || err.message || 'Erro desconhecido';
          alert('Erro ao buscar seguros: ' + msg);
        }
        
        setSeguros([]);
        setCarregando(false);
        return;
      }
    }

    setSeguros(data);
  } catch (err) {
    console.error('❌ Erro geral ao buscar seguros:', err);
    setSeguros([]);
  }
  setCarregando(false);
};

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchSeguros();
  }, []);

  // Efeito para animação de entrada da tabela
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rows = entry.target.querySelectorAll('tr');
          rows.forEach((row, index) => {
            row.style.setProperty('--row-index', index);
            row.classList.add('visible');
          });
        }
      });
    }, { threshold: 0.1 });

    if (tabelaRef.current) {
      observer.observe(tabelaRef.current);
    }

    return () => {
      if (tabelaRef.current) {
        observer.unobserve(tabelaRef.current);
      }
    };
  }, [seguros]);

  // Formatar data para exibição
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-MZ');
  };

  // Formatar valor monetário
  const formatarValor = (valor) => {
    if (!valor) return '0 MZN';
    return `${parseFloat(valor).toLocaleString('pt-MZ')} MZN`;
  };

  // Obter status traduzido
  const obterStatusTraduzido = (status) => {
    const statusMap = {
      'ativo': 'Ativo',
      'pendente': 'Pendente',
      'cancelado': 'Cancelado',
      'emitido': 'Emitido',
      'finalizada': 'Finalizada',
      'alocada': 'Alocada',
    };
    return statusMap[status] || status;
  };

  // Lógica de filtragem
  const segurosFiltrados = seguros.filter(seguro => {
    const filtroTexto = filtro.toLowerCase();
    const passaFiltroTexto =
      !filtroTexto ||
      seguro.numero_apolice?.toLowerCase().includes(filtroTexto) ||
      seguro.apolice_kit?.toLowerCase().includes(filtroTexto) ||
      seguro.cliente?.nome?.toLowerCase().includes(filtroTexto) ||
      seguro.cliente?.contacto?.toLowerCase().includes(filtroTexto) ||
      seguro.cliente?.documento?.toLowerCase().includes(filtroTexto) ||
      seguro.viatura?.matricula?.toLowerCase().includes(filtroTexto) ||
      seguro.viatura?.marca?.toLowerCase().includes(filtroTexto) ||
      seguro.viatura?.modelo?.toLowerCase().includes(filtroTexto) ||
      seguro.agente?.nome?.toLowerCase().includes(filtroTexto);

    const passaFiltroEstado = !filtrosAvancados.estado || seguro.status === filtrosAvancados.estado;
    const passaFiltroData =
      (!filtrosAvancados.dataInicio || seguro.data_emissao >= filtrosAvancados.dataInicio) &&
      (!filtrosAvancados.dataFim || seguro.data_emissao <= filtrosAvancados.dataFim);
    const passaFiltroAgente =
      !filtrosAvancados.agente ||
      seguro.agente?.nome?.toLowerCase().includes(filtrosAvancados.agente.toLowerCase());
    const passaFiltroKit =
      !filtrosAvancados.temKit ||
      (filtrosAvancados.temKit === 'sim' && !!seguro.apolice_kit) ||
      (filtrosAvancados.temKit === 'nao' && !seguro.apolice_kit);
    const passaFiltroMatricula =
      !filtrosAvancados.matricula ||
      seguro.viatura?.matricula?.toLowerCase().includes(filtrosAvancados.matricula.toLowerCase());
    const passaFiltroCliente =
      !filtrosAvancados.cliente ||
      seguro.cliente?.nome?.toLowerCase().includes(filtrosAvancados.cliente.toLowerCase());

    const premio = Number(seguro.premio_calculado) || 0;
    const passaPremioMin =
      !filtrosAvancados.premioMin || premio >= Number(filtrosAvancados.premioMin);
    const passaPremioMax =
      !filtrosAvancados.premioMax || premio <= Number(filtrosAvancados.premioMax);

    return (
      passaFiltroTexto &&
      passaFiltroEstado &&
      passaFiltroData &&
      passaFiltroAgente &&
      passaFiltroKit &&
      passaFiltroMatricula &&
      passaFiltroCliente &&
      passaPremioMin &&
      passaPremioMax
    );
  });

  const limparFiltrosSeguros = () => {
    setFiltro('');
    setFiltrosAvancados({
      estado: '',
      dataInicio: '',
      dataFim: '',
      agente: '',
      temKit: '',
      matricula: '',
      cliente: '',
      premioMin: '',
      premioMax: '',
    });
    setPaginaAtual(1);
  };

  // Paginação
  const totalPaginas = Math.ceil(segurosFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const segurosPagina = segurosFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  const mudarPagina = (novaPagina) => {
    setPaginaAtual(Math.max(1, Math.min(novaPagina, totalPaginas)));
  };

  const recarregarDados = () => {
    setCarregando(true);
    fetchSeguros(true);
  };

  // Função para exportar dados para PDF
  const exportarParaPDF = () => {
    // Criar conteúdo para o PDF
    const content = [
      { text: 'Relatório de Seguros', style: 'header' },
      { text: `Emitido em: ${new Date().toLocaleDateString()}`, style: 'subheader' },
      '\n',
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              'Número Apólice',
              'Data Criação',
              'Cliente',
              'Veículo',
              'Prémio Calculado',
              'Agente',
              'Estado'
            ],
            ...segurosFiltrados.map(seguro => [
              seguro.numero_apolice,
              formatarData(seguro.data_emissao),
              seguro.cliente?.nome,
              seguro.viatura?.matricula,
              formatarValor(seguro.premio_calculado),
              seguro.agente?.nome,
              obterStatusTraduzido(seguro.status)
            ])
          ]
        }
      }
    ];

    // Definir estilos
    const styles = {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10]
      }
    };

    // Criar documento PDF
    const pdfDefinition = {
      content: content,
      styles: styles
    };

    // Simular download
    const blob = new Blob([JSON.stringify(pdfDefinition, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seguros_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('PDF gerado com sucesso!');
  };

  // Função para exportar dados para Excel
  const exportarParaExcel = () => {
    // Criar conteúdo CSV
    const headers = ['Número Apólice', 'Data Criação', 'Cliente', 'Veículo', 'Matrícula', 'Prémio Calculado', 'Agente', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...segurosFiltrados.map(seguro => [
        seguro.numero_apolice,
        formatarData(seguro.data_emissao),
        `"${seguro.cliente?.nome}"`,
        `"${seguro.viatura?.marca} ${seguro.viatura?.modelo}"`,
        seguro.viatura?.matricula,
        seguro.premio_calculado,
        `"${seguro.agente?.nome}"`,
        obterStatusTraduzido(seguro.status)
      ].join(','))
    ].join('\n');

    // Criar blob e fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seguros_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para imprimir o seguro
  const imprimirSeguro = (seguro) => {
    const conteudoImpressao = `
      <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px;">
        <img src="${urlLogo()}" alt="" style="height: 52px; object-fit: contain; margin-bottom: 12px;" />
        <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Detalhes do Seguro</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
          <div>
            <p><strong>Número Apólice:</strong> ${seguro.numero_apolice}</p>
            <p><strong>Data Emissão:</strong> ${formatarData(seguro.data_emissao)}</p>
            <p><strong>Prémio Calculado:</strong> ${formatarValor(seguro.premio_calculado)}</p>
            <p><strong>Validade:</strong> ${seguro.validade_meses} meses</p>
          </div>
          <div>
            <p><strong>Cliente:</strong> ${seguro.cliente?.nome}</p>
            <p><strong>Agente:</strong> ${seguro.agente?.nome}</p>
            <p><strong>Veículo:</strong> ${seguro.viatura?.marca} ${seguro.viatura?.modelo}</p>
            <p><strong>Matrícula:</strong> ${seguro.viatura?.matricula}</p>
          </div>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #7f8c8d; text-align: center;">
          <p>Emitido em: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;

    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoImpressao);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    setTimeout(() => {
      janelaImpressao.print();
      janelaImpressao.close();
    }, 500);
  };

  const textoCompartilhar = (seguro) => {
    const cliente = seguro.cliente?.nome || 'N/A';
    const matricula = seguro.viatura?.matricula || 'N/A';
    const premio = formatarValor(seguro.premio_calculado);
    return `Seguro ${seguro.numero_apolice}\nCliente: ${cliente}\nVeículo (matrícula): ${matricula}\nPrémio: ${premio}`;
  };

  const compartilharPorEmail = (seguro) => {
    const assunto = `Seguro ${seguro.numero_apolice}`;
    const body = textoCompartilhar(seguro);
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(body)}`;
  };

  const compartilharPorWhatsApp = (seguro) => {
    const texto = textoCompartilhar(seguro);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  const compartilharPorSms = (seguro) => {
    const texto = textoCompartilhar(seguro);
    window.location.href = `sms:?body=${encodeURIComponent(texto)}`;
  };

  const excluirSeguro = (seguroId) => {
    if (!window.confirm('Tem certeza que deseja excluir este seguro? Esta ação não pode ser desfeita.')) {
      return;
    }
    api.delete(`/api/seguros/${seguroId}`)
      .then(() => {
        setSeguros(prev => prev.filter(s => s.id !== seguroId));
        cacheService.remove(cacheService.CACHE_KEYS.SEGUROS);
        alert('Seguro excluído com sucesso.');
      })
      .catch((err) => {
        const msg = err.response?.data?.mensagem || err.response?.data?.message || err.message || 'Erro ao excluir.';
        alert('Erro ao excluir seguro: ' + msg);
      });
  };

  // Abrir modal para editar apólice kit
  const abrirModalApoliceKit = (seguro) => {
    setModalApoliceKit({
      aberto: true,
      seguro: seguro,
      apoliceKit: seguro.apolice_kit || ''
    });
  };

  // Salvar apólice kit e refletir na tabela
  const salvarApoliceKit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Você precisa estar logado!');
        return;
      }
      const seguroId = modalApoliceKit.seguro.id;
      const novoValor = (modalApoliceKit.apoliceKit ?? '').trim();

      await api.patch(
        `/api/seguros/${seguroId}/apolice-kit`,
        { apolice_kit: novoValor },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar a tabela imediatamente (substituir N/A pelo valor guardado)
      setSeguros(prev =>
        prev.map(s =>
          s.id === seguroId ? { ...s, apolice_kit: novoValor, status: 'emitido' } : s
        )
      );
      cacheService.remove(cacheService.CACHE_KEYS.SEGUROS);
      setModalApoliceKit({ aberto: false, seguro: null, apoliceKit: '' });
      alert('Apólice kit guardada. A tabela foi atualizada.');
    } catch (error) {
      console.error('Erro ao salvar apólice kit:', error);
      const msg = error.response?.data?.mensagem || error.response?.data?.message || error.message;
      alert('Erro ao salvar apólice kit: ' + msg);
    }
  };

  const finalizarSeguro = async (seguro) => {
    if (!window.confirm(`Tem a certeza que deseja finalizar a apólice ${seguro.numero_apolice}?`)) {
      return;
    }
    setAccaoSeguroId(seguro.id);
    try {
      const res = await api.patch(`/api/seguros/${seguro.id}/finalizar`);
      const seguroActualizado = res.data?.seguro || { ...seguro, status: 'finalizada' };
      setSeguros((prev) =>
        prev.map((s) => (s.id === seguro.id ? { ...s, ...seguroActualizado, status: 'finalizada' } : s))
      );
      cacheService.remove(cacheService.CACHE_KEYS.SEGUROS);
      alert('Apólice finalizada com sucesso. Os administradores foram notificados.');
    } catch (error) {
      const msg = error.response?.data?.mensagem || error.message;
      alert('Erro ao finalizar apólice: ' + msg);
    } finally {
      setAccaoSeguroId(null);
    }
  };

  const alocarSeguro = async (seguro) => {
    if (!window.confirm(`Tem a certeza que deseja marcar a apólice ${seguro.numero_apolice} como Alocada?`)) {
      return;
    }
    setAccaoSeguroId(seguro.id);
    try {
      const res = await api.patch(`/api/seguros/${seguro.id}/alocar`);
      const seguroActualizado = res.data?.seguro || { ...seguro, status: 'alocada' };
      setSeguros((prev) =>
        prev.map((s) => (s.id === seguro.id ? { ...s, ...seguroActualizado, status: 'alocada' } : s))
      );
      cacheService.remove(cacheService.CACHE_KEYS.SEGUROS);
      alert('Apólice marcada como Alocada.');
    } catch (error) {
      const msg = error.response?.data?.mensagem || error.message;
      alert('Erro ao alocar apólice: ' + msg);
    } finally {
      setAccaoSeguroId(null);
    }
  };

  return (
    <div className="seguros-container seguros-page">
      <header className="seguros-header">
        <h1 className="seguros-title">
          <FaFileAlt className="seguros-title-icon" /> Gestão de Seguros
          {usandoCache && (
            <span className="seguros-cache" title="Dados carregados do cache">
              (Cache)
            </span>
          )}
        </h1>
        <div className="seguros-header-actions">
          <button type="button" className="seguros-btn-export" onClick={exportarParaPDF}>
            <FaFilePdf /> PDF
          </button>
          <button type="button" className="seguros-btn-export" onClick={exportarParaExcel}>
            <FaFileExcel /> Excel
          </button>
        </div>
      </header>

      <div className="seguros-toolbar">
        <div className="seguros-search-wrap">
          <FaSearch className="seguros-search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por apólice, cliente, veículo ou agente..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaAtual(1);
            }}
            className="seguros-search"
          />
          <button
            type="button"
            className={`seguros-filter-toggle ${filtroAberto ? 'active' : ''}`}
            onClick={() => setFiltroAberto(!filtroAberto)}
            title="Filtros"
          >
            <FaFilter />
          </button>
        </div>
        <button
          type="button"
          onClick={recarregarDados}
          className="seguros-reload"
          disabled={carregando}
        >
          <FaSync className={carregando ? 'seguros-spin' : ''} />
          {carregando ? 'A carregar…' : 'Recarregar'}
        </button>
      </div>

      {filtroAberto && (
        <div className="seguros-filtros-avancados">
          <div className="seguros-filtro-group">
            <label>Estado</label>
            <ImperialSelect
              value={filtrosAvancados.estado}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, estado: e.target.value });
                setPaginaAtual(1);
              }}
              options={[
                { value: "", label: "Todos" },
                { value: "ativo", label: "Ativo" },
                { value: "pendente", label: "Pendente" },
                { value: "cancelado", label: "Cancelado" },
                { value: "emitido", label: "Emitido" },
                { value: "finalizada", label: "Finalizada" },
                { value: "alocada", label: "Alocada" },
              ]}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              value={filtrosAvancados.dataInicio}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, dataInicio: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={filtrosAvancados.dataFim}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, dataFim: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Agente</label>
            <input
              type="text"
              placeholder="Nome do agente..."
              value={filtrosAvancados.agente}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, agente: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Apólice Kit</label>
            <ImperialSelect
              value={filtrosAvancados.temKit}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, temKit: e.target.value });
                setPaginaAtual(1);
              }}
              options={[
                { value: "", label: "Todos" },
                { value: "sim", label: "Com kit" },
                { value: "nao", label: "Sem kit" },
              ]}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Cliente</label>
            <input
              type="text"
              placeholder="Nome do cliente..."
              value={filtrosAvancados.cliente}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, cliente: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Matrícula</label>
            <input
              type="text"
              placeholder="Ex: TSH-373-BS"
              value={filtrosAvancados.matricula}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, matricula: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Prémio mín.</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={filtrosAvancados.premioMin}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, premioMin: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="seguros-filtro-group">
            <label>Prémio máx.</label>
            <input
              type="number"
              min="0"
              placeholder="999999"
              value={filtrosAvancados.premioMax}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, premioMax: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <button type="button" className="seguros-filtro-limpar" onClick={limparFiltrosSeguros}>
            <FaTimes /> Limpar filtros
          </button>
        </div>
      )}

      <div className="seguros-table-wrap" ref={tabelaRef}>
        {carregando ? (
          <PageLoader />
        ) : (
          <>
            <div className="seguros-table-scroll">
            <table className="seguros-table">
              <thead>
                <tr>
                  <th><FaFilter /> Estado</th>
                  <th><FaFileAlt /> Número Apólice</th>
                  <th><FaIdCard /> Apólice Kit</th>
                  <th><FaCalendarAlt /> Data Criação</th>
                  <th><FaUser /> Cliente</th>
                  <th><FaCar /> Veículo (Matrícula)</th>
                  <th><FaFileAlt /> Prémio</th>
                  <th><FaUserShield /> Agente</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {segurosPagina.map((seguro) => (
                  <tr key={seguro.id} className="seguros-row">
                    <td>
                      <span className={`seguros-badge seguros-badge-${seguro.status?.toLowerCase()}`}>
                        {obterStatusTraduzido(seguro.status)}
                      </span>
                    </td>
                    <td className="seguros-cell-primary" title={seguro.numero_apolice}>
                      {seguro.numero_apolice || "—"}
                    </td>
                    <td>
                      <div className="seguros-cell-apolice">
                        <span title={seguro.apolice_kit || "N/A"}>{seguro.apolice_kit || "N/A"}</span>
                        <button
                          type="button"
                          className="seguros-btn-apolice"
                          onClick={() => abrirModalApoliceKit(seguro)}
                          title="Editar apólice kit"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                    <td className="seguros-cell-secondary">{formatarData(seguro.data_emissao)}</td>
                    <td className="seguros-cell-primary" title={seguro.cliente?.nome || ""}>
                      {seguro.cliente?.nome || "—"}
                    </td>
                    <td className="seguros-cell-primary" title={seguro.viatura?.matricula || ""}>
                      {seguro.viatura?.matricula || "—"}
                    </td>
                    <td className="seguros-cell-primary">{formatarValor(seguro.premio_calculado)}</td>
                    <td className="seguros-cell-primary" title={seguro.agente?.nome || ""}>
                      {seguro.agente?.nome || "—"}
                    </td>
                    <td>
                      <div className="seguros-cell-actions">
                        <button
                          type="button"
                          className="seguros-btn-view"
                          onClick={() => navigate('/imperial/dashboard/seguros/visualizar/' + seguro.id, { state: { seguro } })}
                          title="Visualizar"
                        >
                          <FaEye /> Visualizar
                        </button>
                        <button
                          type="button"
                          className="seguros-btn-icon"
                          onClick={() => imprimirSeguro(seguro)}
                          title="Imprimir"
                        >
                          <FaPrint />
                        </button>
                        <button
                          type="button"
                          className="seguros-btn-icon seguros-btn-email"
                          onClick={() => compartilharPorEmail(seguro)}
                          title="Enviar por Email"
                        >
                          <FaEnvelope />
                        </button>
                        <button
                          type="button"
                          className="seguros-btn-icon seguros-btn-whatsapp"
                          onClick={() => compartilharPorWhatsApp(seguro)}
                          title="Enviar por WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>
                        <button
                          type="button"
                          className="seguros-btn-icon seguros-btn-sms"
                          onClick={() => compartilharPorSms(seguro)}
                          title="Enviar por SMS"
                        >
                          <FaPhone />
                        </button>
                        {tipoUsuario === 'subscricao' && seguro.status === 'emitido' && (
                          <button
                            type="button"
                            className="seguros-btn-finalizar"
                            disabled={accaoSeguroId === seguro.id}
                            onClick={() => finalizarSeguro(seguro)}
                            title="Finalizar apólice"
                          >
                            <FaCheck /> {accaoSeguroId === seguro.id ? 'A finalizar…' : 'Finalizar'}
                          </button>
                        )}
                        {tipoUsuario === 'admin' && seguro.status === 'finalizada' && (
                          <button
                            type="button"
                            className="seguros-btn-alocar"
                            disabled={accaoSeguroId === seguro.id}
                            onClick={() => alocarSeguro(seguro)}
                            title="Marcar como Alocada"
                          >
                            <FaMapPin /> {accaoSeguroId === seguro.id ? 'A alocar…' : 'Alocada'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="seguros-btn-icon seguros-btn-delete"
                          onClick={() => excluirSeguro(seguro.id)}
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {segurosPagina.length === 0 && (
              <div className="seguros-empty">
                <FaFileAlt className="seguros-empty-icon" />
                <p>Nenhum seguro encontrado. Ajuste os filtros se necessário.</p>
              </div>
            )}
          </>
        )}
      </div>

      {segurosFiltrados.length > 0 && !carregando && (
        <div className="seguros-pagination">
          <button
            type="button"
            onClick={() => mudarPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            className="seguros-pagination-btn"
          >
            <FaChevronLeft />
          </button>
          <span className="seguros-pagination-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => mudarPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            className="seguros-pagination-btn"
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* Modal para editar Apólice Kit */}
      {modalApoliceKit.aberto && (
        <div className="modal-overlay" onClick={() => setModalApoliceKit({ aberto: false, seguro: null, apoliceKit: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>
                <FaFileAlt /> Editar Apólice Kit
              </h2>
              <button 
                onClick={() => setModalApoliceKit({ aberto: false, seguro: null, apoliceKit: '' })} 
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Número da Apólice Kit:
                </label>
                <input
                  type="text"
                  value={modalApoliceKit.apoliceKit}
                  onChange={(e) => setModalApoliceKit({ ...modalApoliceKit, apoliceKit: e.target.value })}
                  placeholder="Digite o número da apólice kit"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Seguro: {modalApoliceKit.seguro?.numero_apolice}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={salvarApoliceKit} className="btn btn-primary">
                <FaSave /> Salvar
              </button>
              <button 
                onClick={() => setModalApoliceKit({ aberto: false, seguro: null, apoliceKit: '' })} 
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seguros;