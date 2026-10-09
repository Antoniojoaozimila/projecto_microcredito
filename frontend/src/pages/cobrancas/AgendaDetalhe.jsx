import { useContext, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Navigation, Phone, Wallet } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Anel, BannerSucesso, Campo, MensagemModal, ModalFormulario } from "../comum/ElementosModulo";
import MapaLeaflet from "../comum/MapaLeaflet";
import { ligacaoGoogleMaps, percentagem, soMontante } from "../comum/utilModulo";
import { ChipAgenda, ChipItem, ChipRota, ChipValor } from "./ChipsCobranca";
import { CAMINHO_COB } from "./iconesCobranca";
import {
  cancelarAgenda, dadosAgenda, finalizarAgenda, formatarDuracao, iniciarAgenda, lerCoordenadas, MOTIVOS_NAO_COBRO,
  origemDaZona, registarCobranca, registarNaoCobrado, registarPromessa, valorEmDivida,
} from "../../services/cobrancasMicrocredito";
import { formatarData, formatarMT, listarCarteiras } from "../../services/emprestimosMicrocredito";
import { FORMAS_PAGAMENTO, hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const AgendaDetalhe = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [accao, setAccao] = useState(null);
  const dados = useMemo(() => (versao >= 0 ? dadosAgenda(id) : null), [id, versao]);
  const carteiras = useMemo(() => listarCarteiras().filter((c) => c.status === "Ativa"), [versao]);

  if (!dados) {
    return (
      <div className="cli-page">
        <span className="cli-pill">Agenda não encontrada</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/agenda`)}><ArrowLeft size={16} /> Voltar</button>
      </div>
    );
  }

  const { agenda, cobrador, zona, rota, resumo } = dados;
  const origem = origemDaZona(agenda.zona_id);
  const mapas = ligacaoGoogleMaps([origem, ...rota.map((r) => lerCoordenadas(r.coordenadas || r.cliente?.coordenadas_gps))]);
  const aberta = ["Pendente", "Em Curso"].includes(agenda.status);

  const correr = (fn, ok) => {
    try {
      fn();
      setAccao(null);
      setVersao((v) => v + 1);
      if (ok) setAviso({ texto: ok });
    } catch (e) {
      setAviso({ erro: true, texto: e.message });
    }
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><MapPin size={16} /> {agenda.codigo_agenda}</span>
          <ChipAgenda estado={agenda.status} />
        </div>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/agenda`)}><ArrowLeft size={16} /> Voltar</button>
      </header>

      {params.get("criada") ? (
        <BannerSucesso titulo={`Agenda ${agenda.codigo_agenda} criada com sucesso!`} texto={`${resumo.clientes} clientes · ${formatarMT(resumo.esperado)} esperado`}>
          <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/agenda`)}>Lista</button>
        </BannerSucesso>
      ) : null}

      <div className="cob-hero-rota">
        <section className="cli-section">
          <h2><MapPin size={18} /> Rota · {zona?.nome || "Zona"}</h2>
          <p>{formatarData(agenda.data_agendada)} · {cobrador?.nome_completo || "Cobrador"} · {agenda.hora_inicio || "—"}–{agenda.hora_fim || "—"}</p>
          <div className="mod-mapa-caixa" style={{ margin: "12px 0" }}>
            <MapaLeaflet
              aoVivo
              altura={240}
              pontos={rota.map((r) => {
                const c = lerCoordenadas(r.coordenadas || r.cliente?.coordenadas_gps);
                return c ? { ...c, ordem: r.ordem_visita, titulo: r.cliente?.nome_completo, texto: r.status, cor: r.status === "Visitado" ? "#4AAC05" : "#2563eb" } : null;
              }).filter(Boolean)}
            />
          </div>
          <div className="mod-mapa-stats">
            <span className="cli-chip">{agenda.distancia_total_km || 0} km</span>
            <span className="cli-chip is-azul">{formatarDuracao(agenda.tempo_estimado_min)}</span>
            {mapas ? <a className="cli-btn-novo" href={mapas} target="_blank" rel="noreferrer"><Navigation size={16} /> Navegar</a> : null}
          </div>
        </section>
        <div className="cob-resumo-anel">
          <Anel valor={resumo.taxa} cor="#4AAC05">
            <strong>{percentagem(resumo.taxa)}</strong>
          </Anel>
          <div>
            <small>Taxa de sucesso</small>
            <strong>{resumo.cobrados}/{resumo.itens} cobrados</strong>
            <p>{formatarMT(resumo.cobrado)} / {formatarMT(resumo.esperado)}</p>
          </div>
        </div>
      </div>

      {aberta ? (
        <div className="mod-form-acoes" style={{ marginBottom: 16 }}>
          {agenda.status === "Pendente" ? <button type="button" className="cli-btn-novo" onClick={() => correr(() => iniciarAgenda(agenda.id, usuario), "Rota iniciada.")}>Iniciar rota</button> : null}
          <button type="button" className="cli-btn-novo" onClick={() => correr(() => finalizarAgenda(agenda.id, usuario), "Rota finalizada.")}><CheckCircle2 size={16} /> Finalizar rota</button>
          {agenda.status === "Pendente" ? <button type="button" className="cli-btn ghost" onClick={() => setAccao({ tipo: "cancelar" })}>Cancelar agenda</button> : null}
        </div>
      ) : null}

      <ol className="cob-rota-lista">
        {rota.map((r, i) => (
          <li key={r.id} className="cob-parada" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="cob-ordem">{r.ordem_visita}</span>
            <div>
              <h3>{r.cliente?.nome_completo || "Cliente removido"}</h3>
              <p>{r.cliente?.endereco_completo || r.coordenadas || "Sem coordenadas"}</p>
              {r.itens.map((item) => (
                <div key={item.id} className="cob-item-parcela">
                  <span>{item.contrato} · Parcela {item.num_parcela}/{item.total_parcelas} · Venc. {formatarData(item.data_vencimento)}</span>
                  <ChipValor valor={item.valor_esperado} />
                  <ChipItem estado={item.status} />
                  {aberta && item.status === "Pendente" ? (
                    <span className="cob-parada-acoes">
                      {r.cliente?.telefone_principal ? <a className="cli-btn ghost" href={`tel:${r.cliente.telefone_principal}`}><Phone size={14} /> Ligar</a> : null}
                      <button type="button" className="cli-btn-novo" onClick={() => setAccao({ tipo: "pagar", item })}><Wallet size={14} /> Registar pagamento</button>
                      <button type="button" className="cli-btn ghost" onClick={() => setAccao({ tipo: "promessa", item })}>Promessa</button>
                      <button type="button" className="cli-btn ghost" onClick={() => setAccao({ tipo: "nao", item })}>Não cobrado</button>
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <ChipRota estado={r.status} />
          </li>
        ))}
      </ol>

      {accao?.tipo === "pagar" ? (
        <ModalPagamento item={accao.item} carteiras={carteiras} onFechar={() => setAccao(null)} onOk={(dados) => correr(() => registarCobranca(accao.item.id, dados, usuario), "Pagamento registado.")} />
      ) : null}
      {accao?.tipo === "nao" ? (
        <ModalNao item={accao.item} onFechar={() => setAccao(null)} onOk={(dados) => correr(() => registarNaoCobrado(accao.item.id, dados, usuario), "Visita registada.")} />
      ) : null}
      {accao?.tipo === "promessa" ? (
        <ModalPromessa item={accao.item} onFechar={() => setAccao(null)} onOk={(dados) => correr(() => registarPromessa(accao.item.id, dados, usuario), "Promessa registada.")} />
      ) : null}
      {accao?.tipo === "cancelar" ? (
        <ModalCancelar onFechar={() => setAccao(null)} onOk={(motivo) => correr(() => cancelarAgenda(agenda.id, motivo, usuario), "Agenda cancelada.")} />
      ) : null}
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

const ModalPagamento = ({ item, carteiras, onFechar, onOk }) => {
  const [form, setForm] = useState({ valor: String(valorEmDivida(item) || item.valor_esperado), forma_pagamento: "Dinheiro", carteira_id: String(carteiras[0]?.id || ""), referencia_transacao: "", observacoes: "" });
  return (
    <ModalFormulario icone={Wallet} titulo="Registar pagamento" onFechar={onFechar} accoes={<><button type="button" className="cli-btn ghost" onClick={onFechar}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => onOk(form)}>Confirmar</button></>}>
      <div className="cli-grid">
        <Campo label="Valor (MT)"><input value={form.valor} onChange={(e) => setForm((a) => ({ ...a, valor: soMontante(e.target.value) }))} /></Campo>
        <Campo label="Forma"><MenuSuspenso valor={form.forma_pagamento} opcoes={FORMAS_PAGAMENTO.map((f) => ({ id: f, label: f }))} onChange={(v) => setForm((a) => ({ ...a, forma_pagamento: v }))} /></Campo>
        <Campo label="Carteira"><MenuSuspenso valor={form.carteira_id} opcoes={carteiras.map((c) => ({ id: String(c.id), label: `${c.nome} · ${formatarMT(c.saldo)}` }))} onChange={(v) => setForm((a) => ({ ...a, carteira_id: v }))} /></Campo>
        <Campo label="Referência"><input value={form.referencia_transacao} onChange={(e) => setForm((a) => ({ ...a, referencia_transacao: e.target.value }))} /></Campo>
        <Campo label="Observações" full><textarea rows={2} value={form.observacoes} onChange={(e) => setForm((a) => ({ ...a, observacoes: e.target.value }))} /></Campo>
      </div>
    </ModalFormulario>
  );
};

const ModalNao = ({ onFechar, onOk }) => {
  const [form, setForm] = useState({ motivo: MOTIVOS_NAO_COBRO[0], observacoes: "" });
  return (
    <ModalFormulario icone={MapPin} titulo="Não cobrado" onFechar={onFechar} accoes={<><button type="button" className="cli-btn ghost" onClick={onFechar}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => onOk(form)}>Registar</button></>}>
      <Campo label="Motivo"><MenuSuspenso valor={form.motivo} opcoes={MOTIVOS_NAO_COBRO.map((m) => ({ id: m, label: m }))} onChange={(v) => setForm((a) => ({ ...a, motivo: v }))} /></Campo>
      <Campo label="Observações"><textarea rows={2} value={form.observacoes} onChange={(e) => setForm((a) => ({ ...a, observacoes: e.target.value }))} /></Campo>
    </ModalFormulario>
  );
};

const ModalPromessa = ({ item, onFechar, onOk }) => {
  const [form, setForm] = useState({ data_prometida: "", valor_prometido: String(item.valor_esperado), observacoes: "" });
  return (
    <ModalFormulario icone={CheckCircle2} titulo="Promessa de pagamento" onFechar={onFechar} accoes={<><button type="button" className="cli-btn ghost" onClick={onFechar}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => onOk(form)}>Registar</button></>}>
      <Campo label="Data prometida"><input type="date" min={hojeIso()} value={form.data_prometida} onChange={(e) => setForm((a) => ({ ...a, data_prometida: e.target.value }))} /></Campo>
      <Campo label="Valor prometido"><input value={form.valor_prometido} onChange={(e) => setForm((a) => ({ ...a, valor_prometido: soMontante(e.target.value) }))} /></Campo>
      <Campo label="Observações" full><textarea rows={2} value={form.observacoes} onChange={(e) => setForm((a) => ({ ...a, observacoes: e.target.value }))} /></Campo>
    </ModalFormulario>
  );
};

const ModalCancelar = ({ onFechar, onOk }) => {
  const [motivo, setMotivo] = useState("");
  return (
    <ModalFormulario icone={MapPin} titulo="Cancelar agenda" onFechar={onFechar} accoes={<><button type="button" className="cli-btn ghost" onClick={onFechar}>Voltar</button><button type="button" className="cli-btn-novo" onClick={() => onOk(motivo)}>Cancelar agenda</button></>}>
      <Campo label="Motivo"><textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Mínimo 5 caracteres" /></Campo>
    </ModalFormulario>
  );
};

export default AgendaDetalhe;
