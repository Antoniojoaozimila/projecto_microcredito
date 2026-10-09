import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaEnvelope,
  FaPlus,
  FaSave,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
  FaUser,
  FaUserShield,
  FaUsers,
  FaCheckCircle,
  FaHashtag,
} from "react-icons/fa";
import api from "../services/api";
import PageLoader from "../components/PageLoader/PageLoader";
import "./Supervisores.css";

const formularioVazio = {
  nome: "",
  email: "",
  senha: "",
  status: true,
  agente_ids: [],
};

const Supervisores = () => {
  const [supervisores, setSupervisores] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [filtro, setFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioVazio);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [resSupervisores, resAgentes] = await Promise.all([
        api.get("/api/supervisores"),
        api.get("/api/agentes"),
      ]);
      setSupervisores(Array.isArray(resSupervisores.data) ? resSupervisores.data : []);
      setAgentes(Array.isArray(resAgentes.data) ? resAgentes.data : []);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar os supervisores"
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const supervisoresFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return supervisores;
    return supervisores.filter((supervisor) =>
      [supervisor.nome, supervisor.email, ...(supervisor.agentes || []).map((a) => a.nome)]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo))
    );
  }, [filtro, supervisores]);

  const abrirCriacao = () => {
    setEditando(null);
    setFormulario(formularioVazio);
    setErro("");
    setModalAberto(true);
  };

  const abrirEdicao = (supervisor) => {
    setEditando(supervisor);
    setFormulario({
      nome: supervisor.nome || "",
      email: supervisor.email || "",
      senha: "",
      status: supervisor.status !== false,
      agente_ids: (supervisor.agentes || []).map((agente) => Number(agente.id)),
    });
    setErro("");
    setModalAberto(true);
  };

  const alternarAgente = (agenteId) => {
    const id = Number(agenteId);
    setFormulario((anterior) => ({
      ...anterior,
      agente_ids: anterior.agente_ids.includes(id)
        ? anterior.agente_ids.filter((item) => item !== id)
        : [...anterior.agente_ids, id],
    }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!formulario.nome.trim() || !formulario.email.trim()) {
      setErro("Nome e email são obrigatórios.");
      return;
    }
    if (!editando && formulario.senha.trim().length < 6) {
      setErro("A senha inicial deve ter pelo menos 6 caracteres.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: formulario.nome.trim(),
        email: formulario.email.trim().toLowerCase(),
        status: formulario.status,
        agente_ids: formulario.agente_ids,
      };
      if (formulario.senha.trim()) payload.senha = formulario.senha.trim();

      if (editando) {
        await api.put(`/api/supervisores/${editando.id}`, payload);
        setSucesso("Supervisor actualizado com sucesso.");
      } else {
        await api.post("/api/supervisores", payload);
        setSucesso("Supervisor criado e equipa associada com sucesso.");
      }

      setModalAberto(false);
      setFormulario(formularioVazio);
      setEditando(null);
      await carregar();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível guardar o supervisor"
      );
    } finally {
      setSalvando(false);
    }
  };

  const eliminar = async (supervisor) => {
    if (
      !window.confirm(
        `Eliminar o supervisor ${supervisor.nome}? Os agentes serão apenas desassociados e não serão apagados.`
      )
    ) {
      return;
    }

    setErro("");
    try {
      await api.delete(`/api/supervisores/${supervisor.id}`);
      setSucesso("Supervisor eliminado; os agentes foram mantidos.");
      await carregar();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível eliminar o supervisor"
      );
    }
  };

  return (
    <div className="supervisores-page">
      <header className="supervisores-header">
        <div>
          <h1>
            <FaUserShield /> Supervisores
          </h1>
          <p>Crie supervisores e associe cada agente à respectiva equipa.</p>
        </div>
        <button type="button" className="sup-btn sup-btn-primary" onClick={abrirCriacao}>
          <FaPlus /> Novo supervisor
        </button>
      </header>

      {erro && <div className="sup-alert sup-alert-error">{erro}</div>}
      {sucesso && <div className="sup-alert sup-alert-success">{sucesso}</div>}

      <div className="supervisores-toolbar">
        <label className="supervisores-search">
          <FaSearch />
          <input
            type="search"
            placeholder="Pesquisar supervisor ou agente..."
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="sup-btn sup-btn-secondary"
          onClick={carregar}
          disabled={carregando}
        >
          <FaSync className={carregando ? "sup-spin" : ""} /> Recarregar
        </button>
      </div>

      <div className="supervisores-table-wrap">
        {carregando ? (
          <PageLoader />
        ) : (
          <div className="supervisores-table-scroll">
          <table className="supervisores-table">
            <thead>
              <tr>
                <th><FaUserShield /> Supervisor</th>
                <th><FaEnvelope /> Email</th>
                <th><FaCheckCircle /> Estado</th>
                <th><FaUsers /> Equipa</th>
                <th><FaUser /> Agentes associados</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {supervisoresFiltrados.map((supervisor) => {
                const nomesAgentes = (supervisor.agentes || [])
                  .map((a) => a.nome)
                  .filter(Boolean)
                  .join(", ");
                return (
                <tr key={supervisor.id}>
                  <td className="sup-name" title={supervisor.nome}>
                    <FaUserShield /> {supervisor.nome}
                  </td>
                  <td title={supervisor.email}>{supervisor.email}</td>
                  <td>
                    <span
                      className={`sup-badge ${
                        supervisor.status === false ? "sup-inactivo" : "sup-activo"
                      }`}
                    >
                      {supervisor.status === false ? "Inactivo" : "Activo"}
                    </span>
                  </td>
                  <td>
                    <span className="sup-team-count">
                      <FaHashtag /> {supervisor.total_agentes || 0}
                    </span>
                  </td>
                  <td className="sup-agents-cell" title={nomesAgentes || "Sem agentes"}>
                    {(supervisor.agentes || []).length ? nomesAgentes : "Sem agentes"}
                  </td>
                  <td className="sup-actions-cell">
                    <div className="sup-actions">
                      <button
                        type="button"
                        className="sup-icon-btn sup-edit"
                        onClick={() => abrirEdicao(supervisor)}
                        title="Editar supervisor e equipa"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="sup-icon-btn sup-delete"
                        onClick={() => eliminar(supervisor)}
                        title="Eliminar supervisor"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          </div>
        )}

        {!carregando && supervisoresFiltrados.length === 0 && (
          <div className="supervisores-empty">
            <FaUserShield />
            <p>Nenhum supervisor encontrado.</p>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="sup-modal-overlay" onClick={() => setModalAberto(false)}>
          <form className="sup-modal" onSubmit={guardar} onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-header">
              <h2>{editando ? "Editar supervisor" : "Criar supervisor"}</h2>
              <button type="button" onClick={() => setModalAberto(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="sup-form-grid">
              <label>
                Nome *
                <input
                  value={formulario.nome}
                  onChange={(e) =>
                    setFormulario((anterior) => ({ ...anterior, nome: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Email *
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario((anterior) => ({ ...anterior, email: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                {editando ? "Nova senha (opcional)" : "Senha inicial *"}
                <input
                  type="password"
                  value={formulario.senha}
                  onChange={(e) =>
                    setFormulario((anterior) => ({ ...anterior, senha: e.target.value }))
                  }
                  required={!editando}
                />
              </label>
              <label className="sup-status-label">
                <input
                  type="checkbox"
                  checked={formulario.status}
                  onChange={(e) =>
                    setFormulario((anterior) => ({
                      ...anterior,
                      status: e.target.checked,
                    }))
                  }
                />
                Conta activa
              </label>
            </div>

            <section className="sup-team-picker">
              <div>
                <h3>Agentes da equipa</h3>
                <p>
                  Um agente pode pertencer a um único supervisor. Ao seleccioná-lo,
                  será reatribuído a esta equipa.
                </p>
              </div>
              <div className="sup-team-options">
                {agentes.map((agente) => (
                  <label key={agente.id}>
                    <input
                      type="checkbox"
                      checked={formulario.agente_ids.includes(Number(agente.id))}
                      onChange={() => alternarAgente(agente.id)}
                    />
                    <span>
                      <strong>{agente.nome}</strong>
                      <small>
                        {agente.nome_bomba ||
                          agente.endereco ||
                          agente.localizacao ||
                          "Sem ponto de venda"}
                        {agente.supervisor_nome &&
                        (!editando || agente.supervisor_id !== editando.id)
                          ? ` · actual: ${agente.supervisor_nome}`
                          : ""}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {erro && <div className="sup-alert sup-alert-error">{erro}</div>}

            <div className="sup-modal-actions">
              <button
                type="button"
                className="sup-btn sup-btn-secondary"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="sup-btn sup-btn-primary" disabled={salvando}>
                <FaSave /> {salvando ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Supervisores;
