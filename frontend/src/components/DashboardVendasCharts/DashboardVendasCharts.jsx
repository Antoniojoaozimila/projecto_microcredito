import { useContext, useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Line,
} from "recharts";
import {
  FaChartPie,
  FaSync,
  FaCoins,
  FaUsers,
  FaGasPump,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import { AuthContext } from "../../contexts/AuthContext";
import { relatoriosService } from "../../services/relatoriosService";
import "./DashboardVendasCharts.css";

const CORES = [
  "#106a37",
  "#25d366",
  "#0d5a2e",
  "#34d399",
  "#059669",
  "#6ee7b7",
  "#047857",
  "#a7f3d0",
];

const dinheiro = (valor) =>
  `${new Intl.NumberFormat("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)} MT`;

const mesActual = () => new Date().toISOString().slice(0, 7);

const BombaTick = ({ x, y, payload }) => {
  const texto = String(payload?.value || "")
    .replace(/\s+/g, " ")
    .trim();
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#334155"
      fontSize={11}
    >
      <tspan style={{ whiteSpace: "nowrap" }}>{texto}</tspan>
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      {label && <p className="dash-chart-tooltip-label">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || p.fill || "#106a37" }}>
          {p.name}:{" "}
          {typeof p.value === "number" &&
          (p.dataKey === "valor" ||
            p.dataKey === "incremento" ||
            p.dataKey === "base" ||
            String(p.name).toLowerCase().includes("valor"))
            ? dinheiro(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

const DashboardVendasCharts = () => {
  const { usuario } = useContext(AuthContext);
  const [mes, setMes] = useState(mesActual());
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const data = await relatoriosService.getMapaMensalSupervisor(
        { mes },
        usuario?.tipo || "admin"
      );
      setRelatorio(data);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar os diagramas"
      );
      setRelatorio(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, usuario?.tipo]);

  const dados = useMemo(() => {
    if (!relatorio) {
      return {
        agentes: [],
        semanas: [],
        bombas: [],
        funil: [],
        cascata: [],
        radial: [],
        totalValor: 0,
        totalQtd: 0,
      };
    }

    const linhas = relatorio.linhas || [];
    const totaisSemanais = relatorio.totais_semanais || [];

    const agentes = [...linhas]
      .filter((l) => l.total_quantidade > 0 || l.total_valor > 0)
      .sort((a, b) => b.total_valor - a.total_valor)
      .slice(0, 8)
      .map((l) => ({
        nome: l.agente?.split(" ")[0] || l.agente || "Agente",
        nomeCompleto: l.agente,
        quantidade: l.total_quantidade,
        valor: Number(l.total_valor) || 0,
        bomba: l.ponto_venda,
      }));

    const semanas = totaisSemanais.map((s) => ({
      nome: `Semana ${s.semana}`,
      quantidade: s.quantidade,
      valor: Number(s.valor) || 0,
    }));

    const bombaMap = new Map();
    linhas.forEach((l) => {
      const key = l.ponto_venda || "Não definido";
      const prev = bombaMap.get(key) || { nome: key, quantidade: 0, valor: 0 };
      prev.quantidade += l.total_quantidade || 0;
      prev.valor += Number(l.total_valor) || 0;
      bombaMap.set(key, prev);
    });
    const bombas = [...bombaMap.values()]
      .filter((b) => b.quantidade > 0 || b.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
      .map((b) => ({
        ...b,
        nome: String(b.nome || "")
          .replace(/\s+/g, " ")
          .trim(),
      }));

    const funil = [...linhas]
      .filter((l) => l.total_valor > 0)
      .sort((a, b) => b.total_valor - a.total_valor)
      .slice(0, 5)
      .map((l, i) => ({
        nome: l.agente?.split(" ")[0] || `Top ${i + 1}`,
        valor: Number(l.total_valor) || 0,
        fill: CORES[i % CORES.length],
      }));

    let acumulado = 0;
    const cascata = semanas.map((s) => {
      const base = acumulado;
      acumulado += s.valor;
      return {
        nome: s.nome,
        base,
        incremento: s.valor,
        acumulado,
      };
    });

    const radial = semanas.map((s, i) => ({
      nome: s.nome,
      valor: s.quantidade,
      fill: CORES[i % CORES.length],
    }));

    return {
      agentes,
      semanas,
      bombas,
      funil,
      cascata,
      radial,
      totalValor: Number(relatorio.total_valor) || 0,
      totalQtd: Number(relatorio.total_quantidade) || 0,
    };
  }, [relatorio]);

  const tituloPeriodo =
    relatorio?.titulo ||
    `Mapa das vendas - ${mes}`;

  const evolucaoSemanal = useMemo(() => {
    const semanas = dados.semanas || [];
    if (semanas.length < 2) {
      return { pct: 0, tendencia: "neutro" };
    }
    const ultima = Number(semanas[semanas.length - 1]?.valor) || 0;
    const anterior = Number(semanas[semanas.length - 2]?.valor) || 0;
    if (anterior <= 0) {
      return {
        pct: ultima > 0 ? 100 : 0,
        tendencia: ultima > 0 ? "positivo" : "neutro",
      };
    }
    const pct = Math.round(((ultima - anterior) / anterior) * 1000) / 10;
    return {
      pct: Math.abs(pct),
      tendencia: pct > 0 ? "positivo" : pct < 0 ? "negativo" : "neutro",
    };
  }, [dados.semanas]);

  const kpis = [
    {
      key: "total",
      label: "Total de vendas",
      valor: carregando ? "…" : dinheiro(dados.totalValor),
      detalhe: `${dados.totalQtd} apólices no período`,
      icon: FaCoins,
      pct: evolucaoSemanal.pct,
      tendencia: evolucaoSemanal.tendencia,
      tom: "total",
    },
    {
      key: "agentes",
      label: "Agentes com vendas",
      valor: carregando ? "…" : dados.agentes.length,
      detalhe: "no mapa seleccionado",
      icon: FaUsers,
      pct:
        (relatorio?.linhas?.length || 0) > 0
          ? Math.round(
              (dados.agentes.length / Math.max(relatorio.linhas.length, 1)) * 1000
            ) / 10
          : 0,
      tendencia:
        dados.agentes.length >= 3
          ? "positivo"
          : dados.agentes.length > 0
            ? "neutro"
            : "negativo",
      tom: "agentes",
    },
    {
      key: "bombas",
      label: "Pontos de venda",
      valor: carregando ? "…" : dados.bombas.length,
      detalhe: "bombas / postos",
      icon: FaGasPump,
      pct:
        dados.bombas.length > 0
          ? Math.round(
              ((dados.bombas[0]?.valor || 0) /
                Math.max(dados.totalValor, 1)) *
                1000
            ) / 10
          : 0,
      tendencia:
        dados.bombas.length >= 2
          ? "positivo"
          : dados.bombas.length > 0
            ? "neutro"
            : "negativo",
      tom: "bombas",
    },
    {
      key: "periodo",
      label: "Período",
      valor: carregando
        ? "…"
        : tituloPeriodo.replace("Mapa das vendas - ", ""),
      detalhe: mes,
      icon: FaCalendarAlt,
      pct: 100,
      tendencia: "neutro",
      tom: "periodo",
      periodo: true,
    },
  ];

  return (
    <section className="dash-vendas">
      <header className="dash-vendas-header">
        <span className="dash-vendas-title-btn">
          <FaChartPie /> Análise de Vendas
        </span>
        <div className="dash-vendas-actions">
          <label className="dash-month-field">
            <span>Mês</span>
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
          </label>
          <button type="button" className="dash-refresh-btn" onClick={carregar} disabled={carregando}>
            <FaSync className={carregando ? "dash-spin" : ""} /> Actualizar
          </button>
        </div>
      </header>

      {erro && <div className="dash-vendas-alert">{erro}</div>}

      <div className="dash-vendas-resumo">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon =
            kpi.tendencia === "positivo"
              ? FaArrowUp
              : kpi.tendencia === "negativo"
                ? FaArrowDown
                : FaMinus;
          return (
            <article
              key={kpi.key}
              className={`dash-kpi dash-kpi--${kpi.tom}`}
            >
              <div className="dash-kpi-top">
                <div className="dash-kpi-icon">
                  <Icon />
                </div>
                <span className={`dash-kpi-trend dash-kpi-trend--${kpi.tendencia}`}>
                  <TrendIcon />
                  {carregando ? "…" : `${kpi.pct}%`}
                </span>
              </div>
              <span className="dash-kpi-label">{kpi.label}</span>
              <strong className={kpi.periodo ? "dash-kpi-periodo" : ""}>
                {kpi.valor}
              </strong>
              <small>{kpi.detalhe}</small>
            </article>
          );
        })}
      </div>

      <div className="dash-vendas-grid">
        {/* Evolução / total por semana */}
        <article className="dash-chart-card dash-chart-card--wide">
          <div className="dash-chart-heading">
            <h3>Evolução de vendas (semanas)</h3>
            <p className="dash-chart-sub">Área + linha — valor acumulado no mês</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={dados.semanas}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,106,55,0.12)" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Valor (MT)"
                  fill="rgba(16,106,55,0.18)"
                  stroke="#106a37"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="quantidade"
                  name="Quantidade"
                  stroke="#25d366"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Pizza agentes */}
        <article className="dash-chart-card">
          <div className="dash-chart-heading">
            <h3>Distribuição por agente</h3>
            <p className="dash-chart-sub">Pizza — quantidade de apólices</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dados.agentes}
                  dataKey="quantidade"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ nome, percent }) =>
                    `${nome} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dados.agentes.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Histogram semanas */}
        <article className="dash-chart-card">
          <div className="dash-chart-heading">
            <h3>Histograma semanal</h3>
            <p className="dash-chart-sub">Barras — quantidade e valor</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dados.semanas}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,106,55,0.12)" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="quantidade" name="Qtd" fill="#106a37" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="valor" name="Valor" fill="#25d366" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Bombas / pontos de venda */}
        <article className="dash-chart-card dash-chart-card--wide">
          <div className="dash-chart-heading">
            <h3>Pontos de venda (Bombas)</h3>
            <p className="dash-chart-sub">Barras horizontais — valor por posto</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dados.bombas}
                layout="vertical"
                margin={{ left: 12, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,106,55,0.12)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={220}
                  interval={0}
                  tick={<BombaTick />}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" name="Valor" fill="#0d5a2e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Funil top agentes */}
        <article className="dash-chart-card">
          <div className="dash-chart-heading">
            <h3>Funil Top Agentes</h3>
            <p className="dash-chart-sub">Ranking por valor de vendas</p>
          </div>
          <div className="dash-funnel">
            {dados.funil.length === 0 && !carregando && (
              <p className="dash-empty">Sem vendas no período.</p>
            )}
            {dados.funil.map((item, i) => {
              const max = dados.funil[0]?.valor || 1;
              const largura = Math.max(28, Math.round((item.valor / max) * 100));
              return (
                <div key={item.nome} className="dash-funnel-row">
                  <span className="dash-funnel-rank">{i + 1}</span>
                  <div
                    className="dash-funnel-bar"
                    style={{
                      width: `${largura}%`,
                      background: item.fill,
                    }}
                  >
                    <strong>{item.nome}</strong>
                    <em>{dinheiro(item.valor)}</em>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Cascata / waterfall-like */}
        <article className="dash-chart-card">
          <div className="dash-chart-heading">
            <h3>Cascata semanal</h3>
            <p className="dash-chart-sub">Incremento de valor por semana</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dados.cascata}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,106,55,0.12)" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "base" ? [dinheiro(value), "Base"] : [dinheiro(value), "Incremento"]
                  }
                />
                <Bar dataKey="base" stackId="a" fill="transparent" />
                <Bar dataKey="incremento" name="Incremento" stackId="a" fill="#106a37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Circular multi-nível */}
        <article className="dash-chart-card">
          <div className="dash-chart-heading">
            <h3>Circular multi-nível</h3>
            <p className="dash-chart-sub">Radial — quantidade por semana</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="95%"
                data={dados.radial}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="valor"
                  nameKey="nome"
                  cornerRadius={6}
                />
                <Legend
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Combinação agentes valor */}
        <article className="dash-chart-card dash-chart-card--wide">
          <div className="dash-chart-heading">
            <h3>Combinação — agentes (qtd + valor)</h3>
            <p className="dash-chart-sub">Barras + área — desempenho por agente</p>
          </div>
          <div className="dash-chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dados.agentes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,106,55,0.12)" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="quantidade"
                  name="Quantidade"
                  fill="#106a37"
                  radius={[6, 6, 0, 0]}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="valor"
                  name="Valor"
                  fill="rgba(37,211,102,0.2)"
                  stroke="#25d366"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {carregando && <div className="dash-loading">A carregar diagramas…</div>}
    </section>
  );
};

export default DashboardVendasCharts;
