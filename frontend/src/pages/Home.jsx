import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  Banknote,
  Clock,
  TrendingUp,
  CalendarDays,
  HandCoins,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import { listarClientes } from "../services/clientesMicrocredito";
import { listarPagamentos } from "../services/pagamentosMicrocredito";
import provinciasGeo from "../data/mocambique-provincias.json";
import "./Home.css";

const VERDE = "#4AAC05";
const VERDE_ESCURO = "#2f7a04";
const CORES = ["#4AAC05", "#111111", "#7ed321", "#5c5c5c", "#b6e36a", "#8a8a8a"];

const nomesProvincia = provinciasGeo.features.map((f) => f.properties.shapeName);

const limitesMapa = (() => {
  let minX = 180;
  let minY = 90;
  let maxX = -180;
  let maxY = -90;
  const visitar = (coords) => {
    if (typeof coords[0] === "number") {
      minX = Math.min(minX, coords[0]);
      maxX = Math.max(maxX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxY = Math.max(maxY, coords[1]);
      return;
    }
    coords.forEach(visitar);
  };
  provinciasGeo.features.forEach((f) => visitar(f.geometry.coordinates));
  return { minX, minY, maxX, maxY };
})();

const projectar = (lon, lat) => {
  const largura = 280;
  const altura = 420;
  const x = ((lon - limitesMapa.minX) / (limitesMapa.maxX - limitesMapa.minX)) * largura;
  const y = ((limitesMapa.maxY - lat) / (limitesMapa.maxY - limitesMapa.minY)) * altura;
  return [x, y];
};

const anelParaPath = (anel) =>
  anel
    .map((ponto, i) => {
      const [x, y] = projectar(ponto[0], ponto[1]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

const geometriaParaPath = (geometria) => {
  const poligonos = geometria.type === "Polygon" ? [geometria.coordinates] : geometria.coordinates;
  return poligonos.map((pol) => pol.map(anelParaPath).join(" ")).join(" ");
};

const formasProvincia = provinciasGeo.features.map((f) => ({
  id: f.properties.shapeName,
  nome: f.properties.shapeName,
  d: geometriaParaPath(f.geometry),
}));

const METODO_LOCAL = {
  Mpesa: "mpesa",
  "E-Mola": "emola",
  Dinheiro: "numerario",
  "Transferência Bancária": "pos",
  Cheque: "pos",
};

const clientesLocais = () =>
  listarClientes().map((c) => ({
    ...c,
    data_criacao: c.data_registo,
    morada: c.endereco_completo || "",
  }));

const pagamentosLocais = () =>
  listarPagamentos()
    .filter((p) => p.status === "Confirmado" || p.status === "Pendente")
    .map((p) => ({
      ...p,
      valor: p.valor_pago,
      estado: p.status === "Confirmado" ? "pago" : "pendente",
      data_criacao: p.data_pagamento || p.data_registo,
      metodo_pagamento: METODO_LOCAL[p.forma_pagamento] || "outro",
    }));

const numero = (valor) => {
  const n = Number(String(valor ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const dataDe = (item) => {
  const bruto = item?.data_criacao || item?.created_at || item?.data;
  const data = bruto ? new Date(bruto) : null;
  return data && !Number.isNaN(data.getTime()) ? data : null;
};

const metical = (valor) =>
  `${numero(valor).toLocaleString("pt-PT", { maximumFractionDigits: 0 })} MT`;

const detectarProvincia = (cliente) => {
  const texto = `${cliente?.provincia || ""} ${cliente?.morada || ""} ${cliente?.cidade || ""}`.toLowerCase();
  const ordem = [...nomesProvincia].sort((a, b) => b.length - a.length);
  return ordem.find((nome) => texto.includes(nome.toLowerCase())) || null;
};

const mesmoMes = (data, referencia) =>
  data && data.getMonth() === referencia.getMonth() && data.getFullYear() === referencia.getFullYear();

const variacao = (atual, anterior) => {
  if (!anterior) return atual ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
};

const chaveMes = (data) => `${data.getFullYear()}-${data.getMonth()}`;

const Home = () => {
  const [clientes, setClientes] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [provinciaActiva, setProvinciaActiva] = useState(null);
  const [agora, setAgora] = useState(() => new Date());
  const [mesFiltro, setMesFiltro] = useState(() => chaveMes(new Date()));
  const [mesAberto, setMesAberto] = useState(false);
  const filtroRef = useRef(null);

  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const fechar = (evento) => {
      if (filtroRef.current && !filtroRef.current.contains(evento.target)) setMesAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  useEffect(() => {
    setClientes(clientesLocais());
    setPagamentos(pagamentosLocais());
    setCarregando(false);
  }, []);

  const mesesFiltro = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        return {
          chave: chaveMes(data),
          rotulo: data.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
        };
      }),
    [agora]
  );

  const stats = useMemo(() => {
    const [anoFiltro, mesNumero] = mesFiltro.split("-").map(Number);
    const mesEscolhido = new Date(anoFiltro, mesNumero, 1);
    const mesAnterior = new Date(anoFiltro, mesNumero - 1, 1);
    const pagos = pagamentos.filter((p) => String(p.estado || "").toLowerCase() === "pago");
    const pendentes = pagamentos.filter((p) => String(p.estado || "pendente").toLowerCase() !== "pago");
    const totalRecebido = pagos.reduce((s, p) => s + numero(p.valor), 0);
    const totalPendente = pendentes.reduce((s, p) => s + numero(p.valor), 0);
    const doMes = pagamentos.filter((p) => mesmoMes(dataDe(p), mesEscolhido));
    const doMesAnterior = pagamentos.filter((p) => mesmoMes(dataDe(p), mesAnterior));
    const recebidoMes = doMes
      .filter((p) => String(p.estado || "").toLowerCase() === "pago")
      .reduce((s, p) => s + numero(p.valor), 0);
    const recebidoAnterior = doMesAnterior
      .filter((p) => String(p.estado || "").toLowerCase() === "pago")
      .reduce((s, p) => s + numero(p.valor), 0);
    const clientesMes = clientes.filter((c) => mesmoMes(dataDe(c), mesEscolhido)).length;
    const clientesAnterior = clientes.filter((c) => mesmoMes(dataDe(c), mesAnterior)).length;
    const pagosMes = doMes.filter((p) => String(p.estado || "").toLowerCase() === "pago");
    const pagosAnterior = doMesAnterior.filter((p) => String(p.estado || "").toLowerCase() === "pago");
    const pendenteMes = doMes
      .filter((p) => String(p.estado || "pendente").toLowerCase() !== "pago")
      .reduce((s, p) => s + numero(p.valor), 0);
    const pendenteAnterior = doMesAnterior
      .filter((p) => String(p.estado || "pendente").toLowerCase() !== "pago")
      .reduce((s, p) => s + numero(p.valor), 0);
    const ticketMes = pagosMes.length ? recebidoMes / pagosMes.length : 0;
    const ticketAnterior = pagosAnterior.length ? recebidoAnterior / pagosAnterior.length : 0;

    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
      const lista = pagamentos.filter((p) => {
        const pd = dataDe(p);
        return pd && pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      });
      const recebido = lista
        .filter((p) => String(p.estado || "").toLowerCase() === "pago")
        .reduce((s, p) => s + numero(p.valor), 0);
      return {
        mes: d.toLocaleDateString("pt-PT", { month: "short" }),
        recebido,
        operacoes: lista.length,
      };
    });

    const estados = [
      { name: "Pagos", value: pagos.length },
      { name: "Pendentes", value: pendentes.length },
    ].filter((item) => item.value > 0);

    const metodosMap = new Map();
    pagamentos.forEach((p) => {
      const chave = String(p.metodo_pagamento || p.metodo || "outro").toLowerCase();
      const nome = chave === "mpesa" ? "M-Pesa" : chave === "emola" ? "E-mola" : chave === "numerario" ? "Numerário" : chave === "pos" ? "POS" : "Outro";
      metodosMap.set(nome, (metodosMap.get(nome) || 0) + numero(p.valor));
    });
    const metodos = [...metodosMap.entries()].map(([name, value], i) => ({
      name,
      value,
      fill: CORES[i % CORES.length],
    }));

    const porProvincia = Object.fromEntries(formasProvincia.map((p) => [p.id, 0]));
    clientes.forEach((c) => {
      const id = detectarProvincia(c);
      if (id) porProvincia[id] += 1;
    });
    const maxProv = Math.max(1, ...Object.values(porProvincia));
    const ranking = formasProvincia
      .map((p) => ({ ...p, total: porProvincia[p.id] }))
      .sort((a, b) => b.total - a.total);

    return {
      clientes: clientes.length,
      pagamentos: pagamentos.length,
      totalRecebido,
      totalPendente,
      recebidoMes,
      ticket: pagos.length ? totalRecebido / pagos.length : 0,
      variacoes: {
        clientes: variacao(clientesMes || clientes.length, clientesAnterior || clientes.length),
        pagamentos: variacao(doMes.length, doMesAnterior.length),
        recebido: variacao(totalRecebido, recebidoAnterior),
        aberto: variacao(totalPendente, pendenteAnterior),
        ticket: variacao(ticketMes || (pagos.length ? totalRecebido / pagos.length : 0), ticketAnterior),
        mes: variacao(recebidoMes, recebidoAnterior),
      },
      rotuloMes: mesEscolhido.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
      meses,
      estados: estados.length ? estados : [{ name: "Sem dados", value: 1 }],
      metodos: metodos.length ? metodos : [{ name: "Sem dados", value: 1, fill: "#d9d9d9" }],
      porProvincia,
      maxProv,
      ranking,
    };
  }, [clientes, pagamentos, mesFiltro, agora]);

  const cards = [
    { titulo: "Clientes", valor: stats.clientes, detalhe: "Registados no sistema", Icon: Users, pct: stats.variacoes.clientes },
    { titulo: "Pagamentos", valor: stats.pagamentos, detalhe: "Operações lançadas", Icon: Banknote, pct: stats.variacoes.pagamentos },
    { titulo: "Recebido", valor: metical(stats.totalRecebido), detalhe: "Prestações com estado pago", Icon: Wallet, pct: stats.variacoes.recebido },
    { titulo: "Em aberto", valor: metical(stats.totalPendente), detalhe: "Valor ainda por confirmar", Icon: Clock, pct: stats.variacoes.aberto },
    { titulo: "Ticket médio", valor: metical(stats.ticket), detalhe: "Média dos pagamentos pagos", Icon: TrendingUp, pct: stats.variacoes.ticket },
    { titulo: "Este mês", valor: metical(stats.recebidoMes), detalhe: stats.rotuloMes, Icon: CalendarDays, pct: stats.variacoes.mes },
  ];

  return (
    <div className="mc-dash">
      <header className="mc-dash-hero">
        <div className="mc-hero-pills">
          <span className="mc-pill"><LayoutDashboard size={16} /> Painel operacional</span>
        </div>
        <div className={`mc-filter${mesAberto ? " is-open" : ""}`} ref={filtroRef}>
          <button
            type="button"
            className="mc-filter-btn"
            aria-label="Filtrar mês"
            aria-expanded={mesAberto}
            disabled={carregando}
            onClick={() => setMesAberto((aberto) => !aberto)}
          >
            <CalendarDays size={15} />
            <span>{mesesFiltro.find((mes) => mes.chave === mesFiltro)?.rotulo}</span>
          </button>
          {mesAberto && (
            <ul className="mc-filter-menu" role="listbox">
              {mesesFiltro.map((mes) => (
                <li key={mes.chave}>
                  <button
                    type="button"
                    className={mes.chave === mesFiltro ? "is-active" : ""}
                    onClick={() => {
                      setMesFiltro(mes.chave);
                      setMesAberto(false);
                    }}
                  >
                    {mes.rotulo}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <section className="mc-kpis">
        {cards.map((card, i) => (
          <motion.article
            key={card.titulo}
            className="mc-kpi"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="mc-kpi-icon"><card.Icon size={18} /></span>
            <small>{card.titulo}</small>
            <strong>{card.valor}</strong>
            <span className={`mc-pct ${card.pct >= 0 ? "is-up" : "is-down"}`}>
              <TrendingUp size={13} />
              {card.pct >= 0 ? "+" : ""}{card.pct.toFixed(1)}%
            </span>
            <em>{card.detalhe}</em>
          </motion.article>
        ))}
      </section>

      <section className="mc-month-row">
        {stats.meses.map((mes) => (
          <article key={mes.mes} className="mc-month">
            <CalendarDays size={14} />
            <strong>{mes.mes}</strong>
            <span>{metical(mes.recebido)}</span>
            <small>{mes.operacoes} operações</small>
          </article>
        ))}
      </section>

      <section className="mc-charts">
        <article className="mc-panel">
          <h2><HandCoins size={16} /> Recebimentos por mês</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.meses}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => metical(v)} />
              <Bar dataKey="recebido" fill={VERDE} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="mc-panel">
          <h2><Banknote size={16} /> Estado dos pagamentos</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.estados} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                {stats.estados.map((item, i) => (
                  <Cell key={item.name} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
        <article className="mc-panel">
          <h2><AlertCircle size={16} /> Canais de pagamento</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart innerRadius="28%" outerRadius="100%" data={stats.metodos} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" background cornerRadius={8} />
              <Legend />
              <Tooltip formatter={(v) => metical(v)} />
            </RadialBarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="mc-map-layout">
        <article className="mc-panel">
          <h2>Clientes por província</h2>
          <svg viewBox="-8 -8 296 436" className="mc-map" role="img" aria-label="Mapa de Moçambique">
            {formasProvincia.map((p) => {
              const total = stats.porProvincia[p.id] || 0;
              const intensidade = 0.22 + (total / stats.maxProv) * 0.78;
              const activa = provinciaActiva === p.id;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill={activa ? VERDE_ESCURO : VERDE}
                  fillOpacity={total ? intensidade : 0.2}
                  stroke="#ffffff"
                  strokeWidth="1.1"
                  onMouseEnter={() => setProvinciaActiva(p.id)}
                  onMouseLeave={() => setProvinciaActiva(null)}
                >
                  <title>{`${p.nome}: ${total} clientes`}</title>
                </path>
              );
            })}
          </svg>
          {provinciaActiva && (
            <p className="mc-map-tip">
              {provinciaActiva}: {stats.porProvincia[provinciaActiva] || 0} clientes
            </p>
          )}
        </article>
        <article className="mc-panel">
          <h2>Províncias com mais clientes</h2>
          <ul className="mc-rank">
            {stats.ranking.map((p) => (
              <li key={p.id}>
                <span>{p.nome}</span>
                <b>{p.total}</b>
                <i style={{ width: `${(p.total / stats.maxProv) * 100}%` }} />
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default Home;
