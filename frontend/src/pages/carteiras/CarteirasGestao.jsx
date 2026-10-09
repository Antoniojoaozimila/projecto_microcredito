import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import ConfirmarEliminar from "../clientes/ConfirmarEliminar";
import LogoCarteira from "../emprestimos/LogoCarteira";
import { Filtro, Kpi, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import { compacto, paginar, useFecharAoClicarFora } from "../comum/utilModulo";
import { ChipEstadoCarteira } from "./ChipsCarteira";
import { CAMINHO_CAR, CORES_TIPO_CARTEIRA } from "./iconesCarteira";
import { alertasCarteira, bloqueiosEliminarCarteira, eliminarCarteira, ESTADOS_CARTEIRA, resumoCarteiras } from "../../services/carteirasMicrocredito";
import { formatarMT, listarCarteiras, saldoDisponivel } from "../../services/emprestimosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Carteiras.css";

const POR = 8;

const CarteirasGestao = () => {
  const navigate = useNavigate();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  useFecharAoClicarFora(".cli-drop", () => setMenu(null));

  const carteiras = useMemo(() => (versao >= 0 ? listarCarteiras() : []), [versao]);
  const resumo = useMemo(() => resumoCarteiras(), [versao]);
  const visiveis = carteiras.filter((c) => {
    if (estado && c.status !== estado) return false;
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return [c.nome, c.codigo, c.tipo, c.responsavel].join(" ").toLowerCase().includes(q);
  });
  const page = paginar(visiveis, pagina, POR);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Wallet size={16} /> Gestão de carteiras</span>
          <span className="cli-pill">{carteiras.length} carteira{carteiras.length === 1 ? "" : "s"}</span>
        </div>
        <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_CAR}/nova`)}><Plus size={16} /> Nova carteira</button>
      </header>

      <div className="pag-kpis">
        <Kpi icone={Wallet} rotulo="Total carteiras" valor={resumo.total} detalhe={`${resumo.activas} activas`} />
        <Kpi icone={Wallet} rotulo="Saldo total" valor={compacto(resumo.saldoTotal)} detalhe="carteiras operacionais" tom="is-azul" atraso={60} />
        <Kpi icone={Wallet} rotulo="Saldo inicial" valor={compacto(resumo.saldoInicial)} detalhe="soma das carteiras" atraso={120} />
        <Kpi icone={AlertTriangle} rotulo="Alertas" valor={resumo.alertas.length} detalhe="limites de saldo" tom={resumo.alertas.length ? "is-amarelo" : ""} atraso={180} />
      </div>

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Pesquisar nome, código ou tipo" />
        </label>
        <Filtro icone={Wallet} rotulo="Estado" valor={estado} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS_CARTEIRA.map((s) => ({ id: s, label: s }))]} onEscolher={(v) => { setEstado(v); setPagina(1); setMenu(null); }} />
      </section>

      {page.itens.length === 0 ? (
        <section className="cli-section"><Vazio icone={Wallet} titulo="Nenhuma carteira encontrada." /></section>
      ) : (
        <div className="mod-cartoes">
          {page.itens.map((c, i) => {
            const alertas = alertasCarteira(c);
            return (
              <article key={c.id} className="mod-cartao car-gestao-card" style={{ "--cartao-cor": CORES_TIPO_CARTEIRA[c.tipo] || "#4AAC05", animationDelay: `${i * 50}ms` }}>
                <div className="mod-cartao-topo">
                  <LogoCarteira carteira={c} />
                  <span>
                    <h3>{c.nome}</h3>
                    <small>{c.codigo} · {c.tipo}</small>
                  </span>
                  <ChipEstadoCarteira estado={c.status} />
                </div>
                <div className="car-saldo">
                  <small>Saldo actual</small>
                  <strong>{formatarMT(c.saldo)}</strong>
                  <small>Disponível {formatarMT(saldoDisponivel(c))} · Inicial {formatarMT(c.saldo_inicial)}</small>
                </div>
                {alertas.map((a) => <div key={a.tipo} className="mod-alerta"><AlertTriangle size={14} /> {a.texto}</div>)}
                <div className="mod-cartao-accoes" style={{ marginTop: 14 }}>
                  <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_CAR}/${c.id}`)}><Eye size={15} /> Detalhes</button>
                  <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_CAR}/${c.id}/editar`)}><Pencil size={15} /> Editar</button>
                  <button type="button" className="cli-btn ghost" onClick={() => setAEliminar(c)}><Trash2 size={15} /> Eliminar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Paginacao inicio={page.inicio} porPagina={POR} total={visiveis.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
      {aEliminar ? (
        <ConfirmarEliminar
          titulo="Eliminar carteira"
          nome={aEliminar.nome}
          aviso={bloqueiosEliminarCarteira(aEliminar).length ? `Não pode eliminar: ${bloqueiosEliminarCarteira(aEliminar).join(", ")}. Pode encerrar se o saldo for zero.` : "Esta acção não pode ser desfeita."}
          onCancelar={() => setAEliminar(null)}
          onConfirmar={() => {
            try {
              eliminarCarteira(aEliminar.id);
              setAEliminar(null);
              setVersao((v) => v + 1);
              setAviso({ texto: `Carteira ${aEliminar.nome} eliminada.` });
            } catch (e) {
              setAEliminar(null);
              setAviso({ erro: true, texto: e.message });
            }
          }}
        />
      ) : null}
    </div>
  );
};

export default CarteirasGestao;
