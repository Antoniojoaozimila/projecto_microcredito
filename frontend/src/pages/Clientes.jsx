import { useState, useEffect, useRef, useCallback, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaSync,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaUserShield,
  FaEdit,
  FaIdCard,
  FaPhone,
  FaUser,
  FaFileAlt,
  FaHashtag,
  FaFilter,
  FaTimes,
  FaCalendarAlt,
} from "react-icons/fa";
import PageLoader from "../components/PageLoader/PageLoader";
import ImperialSelect from "../components/ImperialSelect/ImperialSelect";
import { AuthContext } from "../contexts/AuthContext";
import { podeEditarSubscricao } from "../constants/tiposUsuario";
import "./Clientes.css";
import api from "../services/api";

const cacheService = {
  CACHE_KEYS: {
    CLIENTES: "clientes_cache_v3",
    SEGUROS: "seguros_cache_v2",
  },
  CACHE_EXPIRY: {
    CLIENTES: 10 * 60 * 1000,
    SEGUROS: 5 * 60 * 1000,
  },
  set(key, data, type = "CLIENTES") {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          expiry: this.CACHE_EXPIRY[type] || this.CACHE_EXPIRY.CLIENTES,
        })
      );
      return true;
    } catch {
      return false;
    }
  },
  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const cacheData = JSON.parse(cached);
      if (Date.now() - cacheData.timestamp > cacheData.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return cacheData.data;
    } catch {
      return null;
    }
  },
};

const Clientes = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const podeEditar = podeEditarSubscricao(usuario?.tipo);
  const [clientes, setClientes] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    temSeguro: "",
    estado: "",
    agente: "",
    matricula: "",
    nacionalidade: "",
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [usandoCache, setUsandoCache] = useState(false);
  const tabelaRef = useRef(null);
  const itensPorPagina = 10;

  const fetchClientes = useCallback(async (forcarAtualizacao = false) => {
    setCarregando(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setCarregando(false);
      setClientes([]);
      return;
    }
    try {
      let clientesData;
      let segurosData;

      if (!forcarAtualizacao) {
        clientesData = cacheService.get(cacheService.CACHE_KEYS.CLIENTES);
        segurosData = cacheService.get(cacheService.CACHE_KEYS.SEGUROS);
        if (clientesData) setUsandoCache(true);
      }

      if (!clientesData) {
        const res = await api.get("/api/clientes");
        clientesData = Array.isArray(res.data) ? res.data : [];
        cacheService.set(cacheService.CACHE_KEYS.CLIENTES, clientesData, "CLIENTES");
        setUsandoCache(false);
      }

      if (!segurosData) {
        const resSeguros = await api.get("/api/seguros");
        segurosData = Array.isArray(resSeguros.data) ? resSeguros.data : [];
        cacheService.set(cacheService.CACHE_KEYS.SEGUROS, segurosData, "SEGUROS");
      }

      setClientes(clientesData);
      setSeguros(segurosData);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setClientes([]);
      setSeguros([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const obterSeguroCliente = useCallback(
    (clienteId) => seguros.find((s) => String(s.cliente_id) === String(clienteId)),
    [seguros]
  );

  const clientesFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    const filtrados = clientes.filter((cliente) => {
      const seguro = obterSeguroCliente(cliente.id);
      const textoOk =
        !termo ||
        [
          cliente.id,
          cliente.nome,
          cliente.documento,
          cliente.contacto,
          cliente.email,
          cliente.nacionalidade,
          cliente.morada,
          seguro?.numero_apolice,
          seguro?.agente?.nome,
          seguro?.viatura?.matricula,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termo));

      const temSeguroOk =
        !filtrosAvancados.temSeguro ||
        (filtrosAvancados.temSeguro === "sim" && !!seguro) ||
        (filtrosAvancados.temSeguro === "nao" && !seguro);

      const estadoOk =
        !filtrosAvancados.estado ||
        (seguro && String(seguro.status).toLowerCase() === filtrosAvancados.estado);

      const agenteOk =
        !filtrosAvancados.agente ||
        seguro?.agente?.nome?.toLowerCase().includes(filtrosAvancados.agente.toLowerCase());

      const matriculaOk =
        !filtrosAvancados.matricula ||
        seguro?.viatura?.matricula?.toLowerCase().includes(filtrosAvancados.matricula.toLowerCase());

      const nacionalidadeOk =
        !filtrosAvancados.nacionalidade ||
        cliente.nacionalidade?.toLowerCase().includes(filtrosAvancados.nacionalidade.toLowerCase());

      return textoOk && temSeguroOk && estadoOk && agenteOk && matriculaOk && nacionalidadeOk;
    });

    // Mais recentes primeiro (API já ordena; reforço após filtro)
    return [...filtrados].sort((a, b) => {
      const ta = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const tb = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return Number(b.id) - Number(a.id);
    });
  }, [clientes, filtro, filtrosAvancados, obterSeguroCliente]);

  const formatarDataCriacao = (valor) => {
    if (!valor) return "—";
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-MZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina) || 1;
  const clientesPagina = clientesFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const limparFiltros = () => {
    setFiltro("");
    setFiltrosAvancados({
      temSeguro: "",
      estado: "",
      agente: "",
      matricula: "",
      nacionalidade: "",
    });
    setPaginaAtual(1);
  };

  const statusLabel = (status) => {
    const map = { ativo: "Ativo", pendente: "Pendente", cancelado: "Cancelado" };
    return map[String(status || "").toLowerCase()] || status || "—";
  };

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <h1 className="clientes-title">
          <FaUserShield className="clientes-title-icon" /> Lista de Clientes
          {usandoCache && <span className="clientes-cache">(Cache)</span>}
        </h1>
      </div>

      <div className="clientes-toolbar">
        <div className="clientes-search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Pesquisar nome, documento, telefone, apólice..."
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaAtual(1);
            }}
            className="clientes-search"
          />
          <button
            type="button"
            className={`clientes-filter-toggle ${filtroAberto ? "active" : ""}`}
            onClick={() => setFiltroAberto((v) => !v)}
            title="Filtros dinâmicos"
          >
            <FaFilter />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setCarregando(true);
            fetchClientes(true);
          }}
          className="clientes-reload"
          disabled={carregando}
        >
          <FaSync />
          {carregando ? "A carregar…" : "Recarregar"}
        </button>
      </div>

      {filtroAberto && (
        <div className="clientes-filtros-avancados">
          <div className="clientes-filtro-group">
            <label>Seguro</label>
            <ImperialSelect
              value={filtrosAvancados.temSeguro}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, temSeguro: e.target.value });
                setPaginaAtual(1);
              }}
              options={[
                { value: "", label: "Todos" },
                { value: "sim", label: "Com seguro" },
                { value: "nao", label: "Sem seguro" },
              ]}
            />
          </div>
          <div className="clientes-filtro-group">
            <label>Estado do seguro</label>
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
              ]}
            />
          </div>
          <div className="clientes-filtro-group">
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
          <div className="clientes-filtro-group">
            <label>Matrícula</label>
            <input
              type="text"
              placeholder="Ex: AJQ-465-MC"
              value={filtrosAvancados.matricula}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, matricula: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <div className="clientes-filtro-group">
            <label>Nacionalidade</label>
            <input
              type="text"
              placeholder="Ex: Moçambicana"
              value={filtrosAvancados.nacionalidade}
              onChange={(e) => {
                setFiltrosAvancados({ ...filtrosAvancados, nacionalidade: e.target.value });
                setPaginaAtual(1);
              }}
            />
          </div>
          <button type="button" className="clientes-filtro-limpar" onClick={limparFiltros}>
            <FaTimes /> Limpar filtros
          </button>
        </div>
      )}

      <div className="clientes-table-wrap" ref={tabelaRef}>
        {carregando ? (
          <PageLoader />
        ) : (
          <>
            <div className="clientes-table-scroll">
              <table className="clientes-table">
                <thead>
                  <tr>
                    <th><FaHashtag /> ID</th>
                    <th><FaUser /> Nome</th>
                    <th><FaIdCard /> Documento</th>
                    <th><FaPhone /> Telefone</th>
                    <th><FaFileAlt /> Apólice</th>
                    <th><FaUserShield /> Estado</th>
                    <th><FaCalendarAlt /> Data/Hora</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesPagina.map((cliente) => {
                    const seguro = obterSeguroCliente(cliente.id);
                    return (
                      <tr key={cliente.id}>
                        <td><span className="clientes-id-badge">{cliente.id}</span></td>
                        <td className="clientes-cell-name" title={cliente.nome}>{cliente.nome || "—"}</td>
                        <td title={cliente.documento}>{cliente.documento || "—"}</td>
                        <td title={cliente.contacto}>{cliente.contacto || "—"}</td>
                        <td title={seguro?.numero_apolice || ""}>
                          {seguro?.numero_apolice || "—"}
                        </td>
                        <td>
                          {seguro ? (
                            <span className={`clientes-status-badge status-${String(seguro.status || "").toLowerCase()}`}>
                              {statusLabel(seguro.status)}
                            </span>
                          ) : (
                            <span className="clientes-sem-seguro">Sem seguro</span>
                          )}
                        </td>
                        <td title={cliente.criado_em || ""}>
                          {formatarDataCriacao(cliente.criado_em)}
                        </td>
                        <td>
                          <div className="clientes-cell-actions">
                            <button
                              type="button"
                              onClick={() => navigate(`/imperial/dashboard/clientes/visualizar/${cliente.id}`)}
                              className="clientes-btn-view"
                              title="Visualizar"
                            >
                              <FaEye /> Visualizar
                            </button>
                            {podeEditar && (
                              <button
                                type="button"
                                onClick={() => navigate(`/imperial/dashboard/clientes/editar/${cliente.id}`)}
                                className="clientes-btn-view clientes-btn-edit"
                                title="Editar"
                              >
                                <FaEdit /> Editar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {clientesPagina.length === 0 && (
              <div className="clientes-empty">
                <FaUserShield style={{ fontSize: "2.5rem", color: "#106a37" }} />
                <p>Nenhum cliente encontrado com o filtro aplicado.</p>
              </div>
            )}
          </>
        )}
      </div>

      {clientesFiltrados.length > 0 && !carregando && (
        <div className="clientes-pagination">
          <button type="button" onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}>
            <FaChevronLeft />
          </button>
          <span className="clientes-pagination-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual >= totalPaginas}
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default Clientes;
