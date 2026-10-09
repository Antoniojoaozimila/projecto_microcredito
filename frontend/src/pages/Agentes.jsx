import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaIdCard, FaPhone, FaEye, FaSync, FaSearch,
  FaChevronLeft, FaChevronRight, FaFilter, FaUserAlt,
  FaTrash, FaEdit, FaPlus, FaGlobe, FaEnvelope, FaMapMarkerAlt,
  FaSave, FaTimes, FaUserCog
} from 'react-icons/fa';
import api from '../services/api';
import PageLoader from '../components/PageLoader/PageLoader';
import { AuthContext } from '../contexts/AuthContext';
import { normalizarListaAgentes } from '../utils/seguroEstatisticas';
import './Agentes.css';

// Serviço de Cache Local
const cacheService = {
  CACHE_KEYS: {
    AGENTES: 'agentes_cache',
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
  }
};

const Agentes = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const podeGerir = usuario?.tipo === 'admin';
  const cacheKey = `${cacheService.CACHE_KEYS.AGENTES}_${usuario?.id || 'anon'}_${usuario?.tipo || 'anon'}`;
  const [agentes, setAgentes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [usandoCache, setUsandoCache] = useState(false);
  const tabelaRef = useRef(null);

  // Constantes
  const itensPorPagina = 10;
  
  // Buscar agentes da API
  const fetchAgentes = async (forcarAtualizacao = false) => {
    if (!usuario?.tipo) return;

    setCarregando(true);
    
    // Verificar token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Você precisa estar logado para visualizar os agentes!');
      setCarregando(false);
      setAgentes([]);
      return;
    }

    try {
      let data;
      let fromCache = false;

      // Verificar cache se não for forçar atualização
      if (!forcarAtualizacao) {
        const cachedAgentes = cacheService.get(cacheKey);
        if (cachedAgentes) {
          data = normalizarListaAgentes(cachedAgentes);
          fromCache = true;
          setUsandoCache(true);
          console.log('Usando dados do cache');
        }
      }

      // Se não tem cache ou forçou atualização, buscar da API
      if (!data) {
        try {
          console.log('🔄 Buscando agentes da API...');
          const res = await api.get('/api/agentes');
          data = normalizarListaAgentes(res.data);
          console.log('✅ Dados recebidos da API:', data.length, 'registos');
          
          // Salvar no cache
          cacheService.set(cacheKey, data);
          setUsandoCache(false);
        } catch (err) {
          let msg = err?.response?.data?.message || err?.response?.data?.mensagem || err.message || err.toString();
          alert('Erro ao buscar agentes: ' + msg);
          console.error('Erro na resposta da API agentes:', err);
          setAgentes([]);
          setCarregando(false);
          return;
        }
      }

      setAgentes(data);
    } catch (err) {
      console.error('Erro geral ao buscar agentes:', err);
      setAgentes([]);
    }
    setCarregando(false);
  };

  // Efeito para carregar dados iniciais (aguarda utilizador autenticado)
  useEffect(() => {
    if (!usuario?.tipo) return;
    fetchAgentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, usuario?.tipo]);

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

    return () => observer.disconnect();
  }, [agentes]);

  // Lógica de filtragem e paginação
  const agentesFiltrados = agentes.filter(agente => {
    if (!filtro.trim()) return true;
    const termo = filtro.toLowerCase();
    const campos = [
      agente.id,
      agente.nome,
      agente.documento_identificacao,
      agente.telefone,
      agente.nacionalidade,
      agente.localizacao,
      agente.endereco,
      agente.email,
      agente.tipo_usuario,
      agente.nome_bomba,
      agente.supervisor_nome,
    ];
    return campos.some((valor) =>
      String(valor ?? "").toLowerCase().includes(termo)
    );
  });
  
  const totalPaginas = Math.ceil(agentesFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const agentesPagina = agentesFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  const mudarPagina = (novaPagina) => {
    setPaginaAtual(Math.max(1, Math.min(novaPagina, totalPaginas)));
  };

  const recarregarDados = () => {
    setCarregando(true);
    fetchAgentes(true);
  };

  const eliminarAgente = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar este agente?')) return;
    try {
      await api.delete(`/api/agentes/${id}`);
      setAgentes(prev => prev.filter(a => a.id !== id));
      cacheService.remove(cacheKey);
      alert('Agente eliminado com sucesso.');
    } catch (error) {
      alert('Erro ao eliminar agente: ' + (error.response?.data?.mensagem || error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="agentes-container agentes-page">
      <header className="agentes-header">
        <h1 className="agentes-title">
          <FaUserCog className="agentes-title-icon" /> Lista de Agentes
          {usandoCache && (
            <span className="agentes-cache" title="Dados carregados do cache">(Cache)</span>
          )}
        </h1>
        {podeGerir && (
          <button
            type="button"
            className="agentes-btn-criar"
            onClick={() => navigate('/microcredito/dashboard/agentes/criar')}
          >
            <FaPlus /> Criar Agente
          </button>
        )}
      </header>

      <div className="agentes-toolbar">
        <div className="agentes-search-wrap">
          <FaSearch className="agentes-search-icon" />
          <input
            type="text"
            placeholder="Filtrar agentes..."
            value={filtro}
            onChange={(e) => { setFiltro(e.target.value); setPaginaAtual(1); }}
            className="agentes-search"
          />
          {filtro && <FaFilter className="agentes-filter-ativo" />}
        </div>
        <button
          type="button"
          onClick={recarregarDados}
          className="agentes-reload"
          disabled={carregando}
        >
          <FaSync className={carregando ? 'agentes-spin' : ''} />
          {carregando ? 'A carregar…' : 'Recarregar'}
        </button>
      </div>

      <div className="agentes-table-wrap" ref={tabelaRef}>
        {carregando ? (
          <PageLoader />
        ) : (
          <>
            <div className="agentes-table-scroll">
            <table className="agentes-table">
              <thead>
                <tr>
                  <th><FaUserAlt /> ID</th>
                  <th><FaUser /> Nome</th>
                  <th><FaIdCard /> Documento</th>
                  <th><FaPhone /> Telefone</th>
                  <th><FaGlobe /> Nacionalidade</th>
                  <th><FaMapMarkerAlt /> Localização</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agentesPagina.map((agente) => (
                  <tr key={agente.id} className="agentes-row">
                    <td className="agentes-cell-id">
                      <span className="agentes-id-badge">{agente.id}</span>
                    </td>
                    <td className="agentes-cell-name" title={agente.nome}>{agente.nome || "—"}</td>
                    <td className="agentes-cell-doc" title={agente.documento_identificacao}>
                      {agente.documento_identificacao || "—"}
                    </td>
                    <td title={agente.telefone}>{agente.telefone || "—"}</td>
                    <td title={agente.nacionalidade}>{agente.nacionalidade || "—"}</td>
                    <td>
                      <span className={`agentes-badge agentes-badge-${agente.localizacao?.toLowerCase() || 'bomba'}`}>
                        <FaMapMarkerAlt /> {agente.localizacao === 'fronteira' ? 'Fronteira' : 'Bomba'}
                      </span>
                    </td>
                    <td>
                      <div className="agentes-cell-actions">
                        <button
                          type="button"
                          className="agentes-btn-view"
                          onClick={() => navigate('/microcredito/dashboard/agentes/visualizar/' + agente.id, { state: { agente } })}
                          title="Visualizar"
                        >
                          <FaEye /> Visualizar
                        </button>
                        {podeGerir && (
                          <>
                            <button
                              type="button"
                              className="agentes-btn-edit"
                              onClick={() => navigate('/microcredito/dashboard/agentes/editar/' + agente.id, { state: { agente } })}
                              title="Editar"
                            >
                              <FaEdit /> Editar
                            </button>
                            <button
                              type="button"
                              className="agentes-btn-delete"
                              onClick={() => eliminarAgente(agente.id)}
                              title="Eliminar"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {agentesPagina.length === 0 && (
              <div className="agentes-empty">
                <FaUserAlt className="agentes-empty-icon" />
                <p>Nenhum agente encontrado. Ajuste o filtro ou crie um novo agente.</p>
              </div>
            )}
          </>
        )}
      </div>

      {agentesFiltrados.length > 0 && !carregando && (
        <div className="agentes-pagination">
          <button
            type="button"
            onClick={() => mudarPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            className="agentes-pagination-btn"
          >
            <FaChevronLeft />
          </button>
          <span className="agentes-pagination-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => mudarPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            className="agentes-pagination-btn"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default Agentes;