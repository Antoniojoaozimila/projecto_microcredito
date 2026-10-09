import { useContext, useMemo, useState } from "react";
import {
  BadgeCheck, FileSearch, HandCoins, Landmark, Route, ScrollText, Settings, Shield, ShieldCheck, Users, Wallet,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { ACCOES_PERMISSAO, MODULOS_PERMISSAO, guardarPerfil, listarPerfis } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const ICONES_PERFIL = {
  ADMIN: ShieldCheck,
  GESTOR: BadgeCheck,
  ANALISTA: FileSearch,
  COBRADOR: Route,
};

const MODULOS = [
  { id: "clientes", rotulo: "Clientes", icone: Users },
  { id: "emprestimos", rotulo: "Empréstimos", icone: HandCoins },
  { id: "pagamentos", rotulo: "Pagamentos", icone: Wallet },
  { id: "garantias", rotulo: "Garantias", icone: Shield },
  { id: "cobrancas", rotulo: "Cobranças", icone: Route },
  { id: "carteiras", rotulo: "Carteiras", icone: Landmark },
  { id: "relatorios", rotulo: "Relatórios", icone: ScrollText },
  { id: "configuracoes", rotulo: "Configurações", icone: Settings },
];

const ACCOES = [
  { id: "criar", rotulo: "Criar" },
  { id: "ler", rotulo: "Consultar" },
  { id: "atualizar", rotulo: "Actualizar" },
  { id: "excluir", rotulo: "Excluir" },
  { id: "aprovar", rotulo: "Aprovar" },
  { id: "exportar", rotulo: "Exportar" },
];

const totalPossivel = MODULOS_PERMISSAO.length * ACCOES_PERMISSAO.length;

const ConfigPerfis = () => {
  const { usuario } = useContext(AuthContext);
  const [perfis, setPerfis] = useState(listarPerfis);
  const [activo, setActivo] = useState(perfis[0]?.id || 1);
  const perfil = useMemo(() => perfis.find((p) => p.id === activo) || perfis[0], [perfis, activo]);
  const total = perfil?.permissoes.includes("*") ? totalPossivel : perfil?.permissoes.length || 0;

  const alternar = (codigo) => {
    if (!perfil || perfil.permissoes.includes("*")) return;
    const permissoes = perfil.permissoes.includes(codigo)
      ? perfil.permissoes.filter((p) => p !== codigo)
      : [...perfil.permissoes, codigo];
    guardarPerfil({ ...perfil, permissoes }, usuario);
    setPerfis(listarPerfis());
  };

  const alternarModulo = (modulo, ligar) => {
    if (!perfil || perfil.permissoes.includes("*")) return;
    const codigos = ACCOES_PERMISSAO.map((accao) => `${modulo}.${accao}`);
    const restantes = perfil.permissoes.filter((p) => !p.startsWith(`${modulo}.`));
    guardarPerfil({ ...perfil, permissoes: ligar ? [...restantes, ...codigos] : restantes }, usuario);
    setPerfis(listarPerfis());
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><ShieldCheck size={16} /> Perfis e permissões</span>
          <span className="cli-pill">{perfis.length} perfis</span>
        </div>
      </header>

      <div className="cfg-perfis">
        {perfis.map((item, indice) => {
          const Icone = ICONES_PERFIL[item.codigo] || ShieldCheck;
          const activos = item.permissoes.includes("*") ? totalPossivel : item.permissoes.length;
          return (
            <button
              type="button"
              key={item.id}
              className={`cfg-perfil${item.id === perfil?.id ? " is-sel" : ""}`}
              style={{ animationDelay: `${indice * 60}ms` }}
              onClick={() => setActivo(item.id)}
            >
              <span className="cfg-perfil-icone"><Icone size={20} /></span>
              <strong>{item.nome}</strong>
              <small>{item.descricao}</small>
              <em>{item.permissoes.includes("*") ? "Acesso total" : `${activos} permissões`}</em>
            </button>
          );
        })}
      </div>

      {perfil ? (
        <section className="cli-section cfg-perfil-detalhe">
          <h2><ShieldCheck size={16} /> {perfil.nome}</h2>
          <p>{perfil.descricao} · nível {perfil.nivel_acesso} · {total} de {totalPossivel} permissões</p>
          {perfil.permissoes.includes("*") ? (
            <div className="cfg-acesso-total">
              <span className="cfg-perfil-icone"><ShieldCheck size={28} /></span>
              <div>
                <strong>Acesso total ao sistema</strong>
                <p>O administrador entra em todos os menus. As permissões dos outros perfis ajustam-se módulo a módulo.</p>
              </div>
            </div>
          ) : (
            <div className="cfg-modulos">
              {MODULOS.map((modulo) => {
                const Icone = modulo.icone;
                const codigos = ACCOES.map((accao) => `${modulo.id}.${accao.id}`);
                const ligados = codigos.filter((codigo) => perfil.permissoes.includes(codigo)).length;
                return (
                  <article className="cfg-modulo" key={modulo.id}>
                    <div className="cfg-modulo-nome">
                      <span className="cfg-perfil-icone"><Icone size={18} /></span>
                      <div>
                        <strong>{modulo.rotulo}</strong>
                        <small>{ligados} de {ACCOES.length}</small>
                      </div>
                      <button type="button" className="cfg-modulo-tudo" onClick={() => alternarModulo(modulo.id, ligados < ACCOES.length)}>
                        {ligados === ACCOES.length ? "Limpar" : "Tudo"}
                      </button>
                    </div>
                    <div className="cfg-accoes">
                      {ACCOES.map((accao) => {
                        const codigo = `${modulo.id}.${accao.id}`;
                        const ligado = perfil.permissoes.includes(codigo);
                        return (
                          <button type="button" key={codigo} className={`cfg-accao${ligado ? " is-on" : ""}`} onClick={() => alternar(codigo)} aria-pressed={ligado}>
                            {accao.rotulo}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default ConfigPerfis;
