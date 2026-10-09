import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CalendarCheck, CalendarDays, CalendarX2, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign,
  Clock, FileText, Hourglass, Layers, LocateFixed,
} from "lucide-react";
import { formatarData, formatarMT, listarEmprestimos } from "../../services/emprestimosMicrocredito";
import { listarClientes } from "../../services/clientesMicrocredito";
import AvatarCliente from "../clientes/AvatarCliente";
import "../clientes/ClienteModulo.css";
import "./Emprestimos.css";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const ESTADOS = {
  aprovacao: { rotulo: "A aguardar aprovação", icon: Hourglass },
  pendente: { rotulo: "Por pagar", icon: Clock },
  atraso: { rotulo: "Em atraso", icon: AlertTriangle },
  pago: { rotulo: "Pago", icon: CheckCircle2 },
};

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const compacto = new Intl.NumberFormat("pt-PT", { notation: "compact", maximumFractionDigits: 1 });

const estadoDaParcela = (p) => {
  if (p.status === "Pago") return "pago";
  if (p.status === "Atrasado" || p.status === "Parcialmente Pago") return "atraso";
  if (p.estadoEmprestimo === "Pendente") return "aprovacao";
  return "pendente";
};

const EmprestimosCalendario = () => {
  const navigate = useNavigate();
  const hoje = new Date();
  const hojeIso = iso(hoje);
  const [mes, setMes] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [direccao, setDireccao] = useState("frente");
  const [diaActivo, setDiaActivo] = useState(hojeIso);

  const clientes = useMemo(() => Object.fromEntries(listarClientes().map((c) => [c.id, c])), []);
  const porDia = useMemo(() => {
    const mapa = {};
    listarEmprestimos()
      .filter((e) => !["Cancelado", "Rejeitado"].includes(e.status))
      .forEach((e) => e.parcelas.forEach((p) => {
        if (p.status === "Cancelado") return;
        const item = {
          ...p,
          contrato: e.numero_contrato,
          emprestimoId: e.id,
          cliente: clientes[e.client_id] || null,
          estadoEmprestimo: e.status,
          totalParcelas: e.num_parcelas,
          modalidade: e.modalidade,
        };
        (mapa[p.data_vencimento] ||= []).push({ ...item, estado: estadoDaParcela(item) });
      }));
    return mapa;
  }, [clientes]);

  const celulas = useMemo(() => {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const deslocar = (primeiro.getDay() + 6) % 7;
    const inicio = new Date(primeiro);
    inicio.setDate(primeiro.getDate() - deslocar);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
  }, [mes]);

  const prefixoMes = iso(mes).slice(0, 7);
  const doMes = Object.entries(porDia).filter(([dia]) => dia.startsWith(prefixoMes)).flatMap(([, lista]) => lista);
  const totais = {
    valor: doMes.reduce((s, p) => s + p.valor_parcela, 0),
    parcelas: doMes.length,
    atraso: doMes.filter((p) => p.estado === "atraso").length,
    pagas: doMes.filter((p) => p.estado === "pago").length,
  };
  const lista = porDia[diaActivo] || [];
  const totalDia = lista.reduce((s, p) => s + p.valor_parcela, 0);
  const dataActiva = new Date(`${diaActivo}T00:00:00`);

  const mudarMes = (passo) => {
    setDireccao(passo > 0 ? "frente" : "tras");
    setMes(new Date(mes.getFullYear(), mes.getMonth() + passo, 1));
  };

  const irParaHoje = () => {
    setDireccao(mes > hoje ? "tras" : "frente");
    setMes(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    setDiaActivo(hojeIso);
  };

  const escolherDia = (d) => {
    const chave = iso(d);
    if (d.getMonth() !== mes.getMonth()) {
      setDireccao(d < mes ? "tras" : "frente");
      setMes(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setDiaActivo(chave);
  };

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><CalendarDays size={16} /> Calendário de vencimentos</span>
          <span className="cli-pill cli-pill-caminho"><CircleDollarSign size={16} /> {formatarMT(totais.valor)} a receber em {MESES[mes.getMonth()].toLowerCase()}</span>
          {totais.atraso ? <span className="cli-pill cli-pill-off"><AlertTriangle size={16} /> {totais.atraso} em atraso</span> : null}
        </div>
      </header>

      <div className="emp-agenda-kpis" key={`kpi-${prefixoMes}`}>
        {[
          { icon: CircleDollarSign, rotulo: "A receber no mês", valor: formatarMT(totais.valor) },
          { icon: Layers, rotulo: "Parcelas no mês", valor: totais.parcelas },
          { icon: CalendarX2, rotulo: "Em atraso", valor: totais.atraso, classe: "is-atraso" },
          { icon: CalendarCheck, rotulo: "Pagas", valor: totais.pagas, classe: "is-pago" },
        ].map(({ icon: IconeKpi, rotulo, valor, classe }, indice) => (
          <div key={rotulo} className={`emp-agenda-kpi ${classe || ""}`} style={{ animationDelay: `${indice * 60}ms` }}>
            <span className="emp-agenda-kpi-icone"><IconeKpi size={20} /></span>
            <span><small>{rotulo}</small><strong>{valor}</strong></span>
          </div>
        ))}
      </div>

      <section className="emp-calendario-grid">
        <div className="cli-section emp-agenda">
          <div className="emp-agenda-topo">
            <div className="emp-agenda-titulo" key={prefixoMes}>
              <strong>{MESES[mes.getMonth()]}</strong>
              <span>{mes.getFullYear()}</span>
            </div>
            <div className="emp-agenda-nav">
              <button type="button" className="emp-agenda-hoje" onClick={irParaHoje}><LocateFixed size={15} /> Hoje</button>
              <button type="button" className="emp-agenda-seta" aria-label="Mês anterior" onClick={() => mudarMes(-1)}><ChevronLeft size={18} /></button>
              <button type="button" className="emp-agenda-seta" aria-label="Mês seguinte" onClick={() => mudarMes(1)}><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="emp-agenda-legenda">
            {Object.entries(ESTADOS).map(([id, { rotulo }]) => (
              <span key={id}><i className={`is-${id}`} /> {rotulo}</span>
            ))}
          </div>

          <div className="emp-agenda-semana">
            {SEMANA.map((d, i) => <span key={d} className={i >= 5 ? "is-fim" : ""}>{d}</span>)}
          </div>

          <div className={`emp-agenda-grelha is-${direccao}`} key={prefixoMes}>
            {celulas.map((d, indice) => {
              const chave = iso(d);
              const parcelas = porDia[chave] || [];
              const total = parcelas.reduce((s, p) => s + p.valor_parcela, 0);
              const estados = [...new Set(parcelas.map((p) => p.estado))];
              const principal = ["atraso", "aprovacao", "pendente", "pago"].find((e) => estados.includes(e));
              return (
                <button
                  key={chave}
                  type="button"
                  style={{ animationDelay: `${indice * 8}ms` }}
                  className={[
                    "emp-agenda-dia",
                    d.getMonth() !== mes.getMonth() ? "is-fora" : "",
                    indice % 7 >= 5 ? "is-fim" : "",
                    chave === hojeIso ? "is-hoje" : "",
                    chave === diaActivo ? "is-activo" : "",
                    parcelas.length ? `tem-parcelas is-${principal}` : "",
                  ].join(" ")}
                  onClick={() => escolherDia(d)}
                  aria-label={`${d.getDate()} de ${MESES[d.getMonth()]}${parcelas.length ? `, ${parcelas.length} parcela(s)` : ""}`}
                >
                  <span className="emp-agenda-num">{d.getDate()}</span>
                  {chave === hojeIso ? <span className="emp-agenda-marca-hoje">Hoje</span> : null}
                  {parcelas.length ? (
                    <>
                      <span className="emp-agenda-valor">{compacto.format(total)} MT</span>
                      <span className="emp-agenda-pontos">
                        {parcelas.slice(0, 4).map((p) => <i key={p.id} className={`is-${p.estado}`} />)}
                        {parcelas.length > 4 ? <b>+{parcelas.length - 4}</b> : null}
                      </span>
                      <span className="emp-agenda-dica">
                        <strong>{parcelas.length} parcela{parcelas.length === 1 ? "" : "s"}</strong>
                        {formatarMT(total)}
                      </span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="cli-section emp-agenda-lado">
          <div className="emp-agenda-lado-topo" key={diaActivo}>
            <span className="emp-agenda-folha">
              <small>{MESES[dataActiva.getMonth()].slice(0, 3)}</small>
              <strong>{dataActiva.getDate()}</strong>
            </span>
            <span className="emp-agenda-lado-texto">
              <strong>{DIAS_SEMANA[dataActiva.getDay()]}</strong>
              <small>{formatarData(diaActivo)}{diaActivo === hojeIso ? " · Hoje" : ""}</small>
            </span>
          </div>

          <div className="emp-agenda-resumo" key={`r-${diaActivo}`}>
            <span><Layers size={15} /> {lista.length} parcela{lista.length === 1 ? "" : "s"}</span>
            <strong>{formatarMT(totalDia)}</strong>
          </div>

          <div className="emp-agenda-itens" key={`l-${diaActivo}`}>
            {lista.length === 0 ? (
              <div className="emp-agenda-vazio">
                <span><CalendarCheck size={28} /></span>
                <strong>Dia livre</strong>
                <small>Sem parcelas a vencer neste dia.</small>
              </div>
            ) : null}
            {lista.map((p, indice) => {
              const Estado = ESTADOS[p.estado];
              const IconeEstado = Estado.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`emp-agenda-item is-${p.estado}`}
                  style={{ animationDelay: `${indice * 70}ms` }}
                  onClick={() => navigate(`/imperial/dashboard/emprestimos/${p.emprestimoId}`)}
                >
                  <span className="emp-agenda-item-faixa" />
                  <div className="emp-agenda-item-topo">
                    <AvatarCliente cliente={p.cliente} tamanho={42} />
                    <span className="emp-agenda-item-cliente">
                      <strong>{p.cliente?.nome_completo || "Cliente removido"}</strong>
                      <small><FileText size={12} /> {p.contrato}</small>
                    </span>
                    <ChevronRight size={18} className="emp-agenda-item-seta" />
                  </div>
                  <div className="emp-agenda-item-meio">
                    <span className="emp-agenda-item-parcela">
                      <small>Parcela</small>
                      <strong>{p.num_parcela}<em>/{p.totalParcelas}</em></strong>
                    </span>
                    <span className="emp-agenda-item-valor">
                      <small>Valor a receber</small>
                      <strong>{formatarMT(p.valor_parcela)}</strong>
                    </span>
                  </div>
                  <div className="emp-agenda-item-base">
                    <span className={`emp-agenda-estado is-${p.estado}`}><IconeEstado size={13} /> {Estado.rotulo}</span>
                    <small>{p.modalidade}{p.dias_atraso ? ` · ${p.dias_atraso} dia(s) de atraso` : ""}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default EmprestimosCalendario;
