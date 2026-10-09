import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Mail, Pencil, Phone, Shield, UserPlus, Users } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../services/api";
import MenuSuspenso from "../clientes/MenuSuspenso";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import { Campo, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import { paginar } from "../comum/utilModulo";
import { listarZonas } from "../../services/cobrancasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const POR = 8;
const PERFIS = ["Administrador", "Gestor", "Analista", "Cobrador"];
const vazioUser = () => ({
  nome_completo: "", email: "", telefone: "", senha: "", confirmar: "",
  perfil: "Analista", zona_id: "", status: "Ativo",
});

const mensagemDe = (erro) => erro?.response?.data?.mensagem || erro?.message || "Não foi possível concluir a operação.";

const ConfigUtilizadores = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [aCarregar, setACarregar] = useState(true);
  const zonas = useMemo(() => listarZonas(), [lista]);
  const page = paginar(lista, pagina, POR);

  const carregar = async () => {
    const { data } = await api.get("/api/utilizadores");
    setLista(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const { data } = await api.get("/api/utilizadores");
        if (activo) setLista(Array.isArray(data) ? data : []);
      } catch (erro) {
        if (activo) setAviso({ erro: true, texto: mensagemDe(erro) });
      } finally {
        if (activo) setACarregar(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const guardar = async (evento) => {
    evento.preventDefault();
    try {
      const dados = { ...form };
      if (form.id) await api.put(`/api/utilizadores/${form.id}`, dados);
      else await api.post("/api/utilizadores", dados);
      setForm(null);
      await carregar();
      setAviso({
        texto: form.id ? "Utilizador actualizado." : "Utilizador criado.",
        detalhe: form.id
          ? "As alterações já valem para o próximo acesso."
          : "A pessoa entra com o nome completo e a senha definidos aqui.",
      });
    } catch (erro) {
      setAviso({ erro: true, texto: mensagemDe(erro) });
    }
  };

  const editar = (conta) => {
    setForm({
      id: conta.id,
      nome_completo: conta.nome_completo,
      email: conta.email,
      telefone: conta.telefone || "",
      senha: "",
      confirmar: "",
      perfil: conta.perfil,
      zona_id: conta.zona_id ? String(conta.zona_id) : "",
      status: conta.status || "Ativo",
    });
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Users size={16} /> Utilizadores</span>
          <span className="cli-pill">{lista.length} conta{lista.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-io" onClick={() => navigate("/microcredito/dashboard/settings")}>O meu perfil</button>
          <button type="button" className="cli-btn-novo" onClick={() => setForm(vazioUser())}><UserPlus size={16} /> Novo utilizador</button>
        </div>
      </header>

      {form ? (
        <form className="cli-section" onSubmit={guardar}>
          <h2><UserPlus size={16} /> {form.id ? "Editar utilizador" : "Novo utilizador"}</h2>
          <div className="cli-grid">
            <Campo icon={Users} label="Nome completo"><input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} maxLength={200} /></Campo>
            <Campo icon={Mail} label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Campo>
            <Campo icon={Phone} label="Telefone"><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="84xxxxxxx" /></Campo>
            <Campo icon={Shield} label="Nível de perfil"><MenuSuspenso valor={form.perfil} onChange={(v) => setForm({ ...form, perfil: v })} opcoes={PERFIS.map((id) => ({ id, label: id }))} /></Campo>
            <Campo icon={Shield} label={form.id ? "Nova senha" : "Senha"}><input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder={form.id ? "Em branco mantém a senha actual" : ""} /></Campo>
            <Campo icon={Shield} label="Confirmar senha"><input type="password" value={form.confirmar} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} /></Campo>
            <Campo icon={BadgeCheck} label="Estado"><MenuSuspenso valor={form.status} onChange={(v) => setForm({ ...form, status: v })} opcoes={["Ativo", "Inativo", "Suspenso"].map((id) => ({ id, label: id }))} /></Campo>
            {form.perfil === "Cobrador" ? (
              <Campo icon={Users} label="Zona"><MenuSuspenso valor={form.zona_id} onChange={(v) => setForm({ ...form, zona_id: v })} opcoes={[{ id: "", label: "Seleccione" }, ...zonas.map((z) => ({ id: String(z.id), label: z.nome }))]} /></Campo>
            ) : null}
          </div>
          <div className="cli-top-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="cli-btn-novo"><UserPlus size={16} /> {form.id ? "Guardar alterações" : "Criar utilizador"}</button>
            <button type="button" className="cli-btn-voltar" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th><span className="cli-th"><Users size={14} /> Nome</span></th>
              <th><span className="cli-th"><Mail size={14} /> Email</span></th>
              <th><span className="cli-th"><Shield size={14} /> Perfil</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><UserPlus size={14} /> Acção</span></th>
            </tr>
          </thead>
          <tbody>
            {page.itens.length ? page.itens.map((u) => (
              <tr key={u.id}>
                <td>{u.nome_completo}</td>
                <td>{u.email}</td>
                <td><span className="cli-chip rel-etiqueta">{u.perfil}</span></td>
                <td><span className={`cli-chip rel-etiqueta ${u.status === "Ativo" ? "" : "is-cinza"}`}>{u.status}</span></td>
                <td>
                  <button type="button" className="cli-btn ghost" onClick={() => editar(u)}><Pencil size={14} /> Editar</button>
                  {String(u.email).toLowerCase() !== String(usuario?.email || "").toLowerCase() ? (
                    <button type="button" className="cli-btn ghost" onClick={() => setAEliminar(u)}>Remover</button>
                  ) : null}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5}>
                  <Vazio
                    icone={Users}
                    titulo={aCarregar ? "A carregar contas" : "Sem utilizadores"}
                    texto={aCarregar ? "A lista está a ser lida da base de dados." : "Crie a primeira conta da equipa."}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Paginacao inicio={page.inicio} porPagina={POR} total={lista.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Remover utilizador"
          nome={aEliminar.nome_completo}
          aviso="Esta conta deixa de poder entrar no sistema."
          onCancelar={() => setAEliminar(null)}
          onConfirmar={async () => {
            try {
              await api.delete(`/api/utilizadores/${aEliminar.id}`);
              setAEliminar(null);
              await carregar();
            } catch (erro) {
              setAEliminar(null);
              setAviso({ erro: true, texto: mensagemDe(erro) });
            }
          }}
        />
      ) : null}
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigUtilizadores;
