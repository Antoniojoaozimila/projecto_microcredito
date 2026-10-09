import { useContext, useMemo, useState } from "react";
import {
  AlertTriangle, Building2, CalendarDays, CircleDollarSign, FileSpreadsheet, Hash, Info, Landmark, Mail, MapPin, Phone,
  Printer, Save, User, Users, Wallet,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import { PROVINCIAS } from "../../services/clientesMicrocredito";
import { guardarConfig } from "../../services/configuracoesMicrocredito";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import {
  dadosOperadorPadrao, montarReporteBM, operadorParaConfig, periodoDoTrimestre, trimestreSugerido,
} from "../../services/reporteBM";
import { descarregarModeloBM } from "./exportarModeloBM";
import "../clientes/ClienteModulo.css";
import "../comum/Modulo.css";
import "./Relatorios.css";

const soMontante = (valor) => {
  const limpo = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  return resto.length ? `${inteiro}.${resto.join("").slice(0, 2)}` : inteiro;
};
const numero = (valor) => Number(String(valor ?? "").replace(",", ".")) || 0;
const texto = (n) => (Number(n) ? String(n) : "");

const operadorInicial = () => {
  const o = dadosOperadorPadrao();
  return {
    ...o,
    trabalhadores: String(o.trabalhadores ?? ""),
    capital_inicial: texto(o.capital_inicial),
    capital_actual: texto(o.capital_actual),
    capitais_proprios: o.capitais_proprios === "" ? "" : texto(o.capitais_proprios),
    alheios_nacionais: texto(o.alheios_nacionais),
    alheios_estrangeiros: texto(o.alheios_estrangeiros),
  };
};

const operadorNumerico = (o) => ({
  ...o,
  capital_inicial: numero(o.capital_inicial),
  capital_actual: numero(o.capital_actual),
  capitais_proprios: o.capitais_proprios === "" ? "" : numero(o.capitais_proprios),
  alheios_nacionais: numero(o.alheios_nacionais),
  alheios_estrangeiros: numero(o.alheios_estrangeiros),
});

const MANUAIS_VAZIOS = { abatido_capital: "", abatido_juro: "", emprestimos_obtidos: "", donativos: "", aumento_capital: "" };

const inicioPeriodo = () => {
  const { ano, trimestre } = trimestreSugerido();
  return { ano: String(ano), trimestre: String(trimestre), ...periodoDoTrimestre(ano, trimestre) };
};

const Tabela = ({ colunas, linhas, destaque }) => (
  <div className="cli-card cli-table-wrap">
    <table className="cli-table bm-tabela">
      <thead>
        <tr>{colunas.map((c, i) => <th key={c} className={i ? "bm-num" : ""}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={linha[0]} className={destaque?.includes(linha[0]) ? "bm-total" : ""}>
            {linha.map((celula, i) => <td key={`${linha[0]}-${i}`} className={i ? "bm-num" : ""}>{celula}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Bloco = ({ titulo, children }) => (
  <div className="bm-bloco">
    <h3>{titulo}</h3>
    {children}
  </div>
);

const ModeloBM = () => {
  const { usuario } = useContext(AuthContext);
  const [periodo, setPeriodo] = useState(inicioPeriodo);
  const [operador, setOperador] = useState(operadorInicial);
  const [manuais, setManuais] = useState(MANUAIS_VAZIOS);
  const [aviso, setAviso] = useState(null);
  const [aGerar, setAGerar] = useState(false);

  const setOp = (campo) => (valor) => setOperador((o) => ({ ...o, [campo]: valor }));
  const setMan = (campo) => (valor) => setManuais((m) => ({ ...m, [campo]: soMontante(valor) }));
  const dinheiro = (campo) => (e) => setOp(campo)(soMontante(e.target.value));

  const periodoValido = Boolean(periodo.de && periodo.ate && periodo.ate >= periodo.de);

  const dados = useMemo(() => {
    if (!periodoValido) return null;
    return montarReporteBM({
      de: periodo.de,
      ate: periodo.ate,
      operador: operadorNumerico(operador),
      manuais: Object.fromEntries(Object.entries(manuais).map(([k, v]) => [k, numero(v)])),
    });
  }, [periodo.de, periodo.ate, periodoValido, operador, manuais]);

  const escolherTrimestre = (ano, trimestre) => {
    if (!trimestre) {
      setPeriodo((p) => ({ ...p, ano, trimestre: "" }));
      return;
    }
    setPeriodo({ ano, trimestre, ...periodoDoTrimestre(ano, trimestre) });
  };

  const anos = useMemo(() => {
    const actual = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => String(actual + 1 - i));
  }, []);

  const guardarOperador = () => {
    try {
      guardarConfig(operadorParaConfig(operadorNumerico(operador)), usuario);
      setAviso({ texto: "Dados do operador guardados.", detalhe: "Vão ser usados automaticamente nos próximos reportes." });
    } catch (e) {
      setAviso({ erro: true, texto: e.message || "Não foi possível guardar os dados." });
    }
  };

  const descarregar = async () => {
    if (!dados) {
      setAviso({ erro: true, texto: "Defina um período válido. A data final tem de ser posterior à inicial." });
      return;
    }
    setAGerar(true);
    try {
      await descarregarModeloBM(dados);
      setAviso({ texto: "Reporte BM gerado com sucesso!", detalhe: "O ficheiro Excel foi descarregado com o logótipo e os dados do sistema." });
    } catch (e) {
      setAviso({ erro: true, texto: e.message || "Não foi possível gerar o reporte." });
    } finally {
      setAGerar(false);
    }
  };

  const m = formatarMT;
  const v = dados?.volume;

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Landmark size={16} /> Modelo BM</span>
          <span className="cli-pill"><CalendarDays size={16} /> {dados ? dados.periodo.texto : "Período inválido"}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-novo" disabled={aGerar || !dados} onClick={descarregar}>
            <FileSpreadsheet size={16} /> {aGerar ? "A gerar..." : "Descarregar Excel (BM)"}
          </button>
        </div>
      </header>

      <section className="cli-section">
        <h2><CalendarDays size={16} /> Período de reporte</h2>
        <div className="cli-grid">
          <Campo icon={CalendarDays} label="Ano">
            <MenuSuspenso valor={periodo.ano} onChange={(ano) => escolherTrimestre(ano, periodo.trimestre)} opcoes={anos.map((a) => ({ id: a, label: a }))} />
          </Campo>
          <Campo icon={CalendarDays} label="Trimestre">
            <MenuSuspenso
              valor={periodo.trimestre}
              onChange={(t) => escolherTrimestre(periodo.ano, t)}
              opcoes={[{ id: "1", label: "1.º trimestre (Jan–Mar)" }, { id: "2", label: "2.º trimestre (Abr–Jun)" }, { id: "3", label: "3.º trimestre (Jul–Set)" }, { id: "4", label: "4.º trimestre (Out–Dez)" }, { id: "", label: "Personalizado" }]}
            />
          </Campo>
          <Campo icon={CalendarDays} label="Data início"><input type="date" value={periodo.de} onChange={(e) => setPeriodo((p) => ({ ...p, de: e.target.value, trimestre: "" }))} /></Campo>
          <Campo icon={CalendarDays} label="Data fim" erro={periodoValido ? "" : "A data final tem de ser posterior à inicial."}><input type="date" value={periodo.ate} onChange={(e) => setPeriodo((p) => ({ ...p, ate: e.target.value, trimestre: "" }))} /></Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2><Building2 size={16} /> Operador de microcrédito</h2>
        <div className="cli-grid">
          <Campo icon={Building2} label="Denominação" full><input value={operador.denominacao} maxLength={200} onChange={(e) => setOp("denominacao")(e.target.value)} /></Campo>
          <Campo icon={MapPin} label="Endereço" full><input value={operador.endereco} maxLength={250} onChange={(e) => setOp("endereco")(e.target.value)} /></Campo>
          <Campo icon={MapPin} label="Província">
            <MenuSuspenso valor={operador.provincia} onChange={setOp("provincia")} placeholder="Seleccione" opcoes={[{ id: "", label: "Seleccione" }, ...PROVINCIAS.map((p) => ({ id: p, label: p }))]} />
          </Campo>
          <Campo icon={Phone} label="Telefone"><input value={operador.telefone} maxLength={40} onChange={(e) => setOp("telefone")(e.target.value)} /></Campo>
          <Campo icon={Phone} label="Fax"><input value={operador.fax} maxLength={40} onChange={(e) => setOp("fax")(e.target.value)} /></Campo>
          <Campo icon={Mail} label="Email"><input value={operador.email} maxLength={150} onChange={(e) => setOp("email")(e.target.value)} /></Campo>
          <Campo icon={Users} label="Nº de trabalhadores"><input inputMode="numeric" value={operador.trabalhadores} onChange={(e) => setOp("trabalhadores")(e.target.value.replace(/\D/g, "").slice(0, 5))} /></Campo>
          <Campo icon={CalendarDays} label="Início de actividades"><input type="month" value={/^\d{4}-\d{2}$/.test(operador.inicio_actividades) ? operador.inicio_actividades : ""} onChange={(e) => setOp("inicio_actividades")(e.target.value)} /></Campo>
          <Campo icon={User} label="Nome do operador" full><input value={operador.nome_operador} maxLength={200} onChange={(e) => setOp("nome_operador")(e.target.value)} /></Campo>
        </div>
        <h2 className="bm-subtitulo"><Wallet size={16} /> Capital e fontes de financiamento</h2>
        <div className="cli-grid">
          <Campo icon={CircleDollarSign} label="Capital inicial (MZN)"><input inputMode="decimal" value={operador.capital_inicial} onChange={dinheiro("capital_inicial")} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Capital actual (MZN)"><input inputMode="decimal" value={operador.capital_actual} onChange={dinheiro("capital_actual")} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Capitais próprios (MZN)"><input inputMode="decimal" value={operador.capitais_proprios} onChange={dinheiro("capitais_proprios")} placeholder="Igual ao capital actual" /></Campo>
          <Campo icon={CircleDollarSign} label="Capitais alheios nacionais (MZN)"><input inputMode="decimal" value={operador.alheios_nacionais} onChange={dinheiro("alheios_nacionais")} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Capitais alheios estrangeiros (MZN)"><input inputMode="decimal" value={operador.alheios_estrangeiros} onChange={dinheiro("alheios_estrangeiros")} placeholder="0.00" /></Campo>
        </div>
        <div className="cli-form-accoes">
          <button type="button" className="cli-btn" onClick={guardarOperador}><Save size={16} /> Guardar dados do operador</button>
        </div>
      </section>

      <section className="cli-section">
        <h2><Hash size={16} /> Dados do período que o sistema não regista</h2>
        <div className="cli-grid">
          <Campo icon={CircleDollarSign} label="Créditos abatidos — capital (MZN)"><input inputMode="decimal" value={manuais.abatido_capital} onChange={(e) => setMan("abatido_capital")(e.target.value)} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Créditos abatidos — juro (MZN)"><input inputMode="decimal" value={manuais.abatido_juro} onChange={(e) => setMan("abatido_juro")(e.target.value)} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Empréstimos obtidos no período (MZN)"><input inputMode="decimal" value={manuais.emprestimos_obtidos} onChange={(e) => setMan("emprestimos_obtidos")(e.target.value)} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Donativos obtidos no período (MZN)"><input inputMode="decimal" value={manuais.donativos} onChange={(e) => setMan("donativos")(e.target.value)} placeholder="0.00" /></Campo>
          <Campo icon={CircleDollarSign} label="Aumento do capital social (MZN)"><input inputMode="decimal" value={manuais.aumento_capital} onChange={(e) => setMan("aumento_capital")(e.target.value)} placeholder="0.00" /></Campo>
        </div>
      </section>

      {dados ? (
        <section className="cli-section">
          <h2><Printer size={16} /> Pré-visualização do reporte</h2>
          <p className="bm-nota"><Info size={15} /> Os valores abaixo são exactamente os que vão para o Excel. Os totais seguem como fórmulas, por isso pode ajustar qualquer valor no ficheiro.</p>
          {dados.notas.semSector ? (
            <p className="bm-nota bm-aviso"><AlertTriangle size={15} /> {dados.notas.semSector} de {dados.notas.contratos} contrato(s) concedido(s) no período não têm sector de actividade e foram contados em &quot;Outros&quot;. Indique o sector ao criar novos empréstimos.</p>
          ) : null}

          <Bloco titulo="2.1.1. Volume de créditos em MZN">
            <Tabela
              colunas={["", "Capital", "Juro", "Total"]}
              linhas={[
                ["Montante de créditos concedidos no período", m(v.concedidos.capital), m(v.concedidos.juro), m(v.concedidos.capital + v.concedidos.juro)],
                ["Montante de créditos reembolsados no período", m(v.reembolsados.capital), m(v.reembolsados.juro), m(v.reembolsados.capital + v.reembolsados.juro)],
                ["Montante de créditos abatidos no período", m(v.abatidos.capital), m(v.abatidos.juro), m(v.abatidos.capital + v.abatidos.juro)],
                ["Montante da carteira de crédito activa/vigente", m(v.activa.capital), m(v.activa.juro), m(v.activa.capital + v.activa.juro)],
                ["Montante da carteira em risco", m(v.risco.capital), m(v.risco.juro), m(v.risco.capital + v.risco.juro)],
              ]}
            />
          </Bloco>

          <div className="bm-duas">
            <Bloco titulo="2.1.2. Número de créditos">
              <Tabela colunas={["", "Número"]} linhas={[["Concedidos no período", dados.numero.concedidos], ["Reembolsados no período", dados.numero.reembolsados]]} />
            </Bloco>
            <Bloco titulo="2.1.4. Carteira de clientes">
              <Tabela
                colunas={["Descrição", "Nr. de clientes activos"]}
                destaque={["Total"]}
                linhas={[["Homens", dados.clientes.homens], ["Mulheres", dados.clientes.mulheres], ["Outros", dados.clientes.outros], ["Total", dados.clientes.total]]}
              />
            </Bloco>
          </div>

          <Bloco titulo="2.1.3. Créditos concedidos por sector de actividade/finalidade">
            <Tabela colunas={["Actividade/Finalidade", "Montante dos créditos concedidos no período", "Contratos"]} linhas={dados.sectores.map((s) => [s.nome, m(s.montante), s.n])} />
          </Bloco>

          <Bloco titulo="2.1.5. Estrutura da carteira em risco">
            <Tabela colunas={["Classe de risco", "Capital", "Juros", "Total"]} linhas={dados.classes.map((c) => [c.nome, m(c.capital), m(c.juros), m(c.capital + c.juros)])} />
          </Bloco>

          <div className="bm-duas">
            <Bloco titulo="2.2. Taxas de juro e prazos de vencimento">
              <Tabela
                colunas={["Descrição", "Mínimo", "Máximo"]}
                linhas={[
                  ["Taxa de juro mensal", `${dados.taxas.juroMin.toLocaleString("pt-PT")}%`, `${dados.taxas.juroMax.toLocaleString("pt-PT")}%`],
                  ["Prazo (meses)", dados.taxas.prazoMin.toLocaleString("pt-PT"), dados.taxas.prazoMax.toLocaleString("pt-PT")],
                ]}
              />
            </Bloco>
            <Bloco titulo="2.5. Capital">
              <Tabela colunas={["", "Valor"]} linhas={[["Inicial", m(dados.capital.inicial)], ["Actual", m(dados.capital.actual)]]} />
            </Bloco>
          </div>

          <div className="bm-duas">
            <Bloco titulo="2.3. Fontes de financiamento">
              <Tabela
                colunas={["", "Valor"]}
                destaque={["Total"]}
                linhas={[["Capitais próprios", m(dados.fontes.proprios)], ["Capitais alheios", m(dados.fontes.alheios)], ["   Nacionais", m(dados.fontes.nacionais)], ["   Estrangeiros", m(dados.fontes.estrangeiros)], ["Total", m(dados.fontes.total)]]}
              />
            </Bloco>
            <Bloco titulo="2.4. Financiamentos do período">
              <Tabela
                colunas={["", "Valor"]}
                destaque={["Total"]}
                linhas={[["Empréstimos obtidos no período", m(dados.financiamentos.emprestimos)], ["Donativos obtidos no período", m(dados.financiamentos.donativos)], ["Aumento do capital social com recursos próprios", m(dados.financiamentos.aumentoCapital)], ["Total", m(dados.financiamentos.total)]]}
              />
            </Bloco>
          </div>

          <Bloco titulo="3. Situação financeira do operador">
            <Tabela
              colunas={["", ...dados.situacao.map((s, i) => (s ? s.rotulo : `Mês ${i + 1}`))]}
              destaque={["Total"]}
              linhas={[
                ["Caixa", ...dados.situacao.map((s) => (s ? m(s.caixa) : "—"))],
                ["Bancos", ...dados.situacao.map((s) => (s ? m(s.bancos) : "—"))],
                ["Outros Activos", ...dados.situacao.map((s) => (s ? m(s.outros) : "—"))],
                ["Total", ...dados.situacao.map((s) => (s ? m(s.total) : "—"))],
              ]}
            />
          </Bloco>

          <div className="bm-criterios">
            <strong>Como o sistema calcula cada secção</strong>
            <ul>
              <li><b>Concedidos:</b> empréstimos aprovados e desembolsados dentro do período (capital e juros contratuais).</li>
              <li><b>Reembolsados:</b> capital e juros dos pagamentos confirmados no período (multas ficam de fora).</li>
              <li><b>Carteira activa:</b> capital e juros ainda por receber dos empréstimos em curso. <b>Em risco:</b> a totalidade dos empréstimos com pelo menos uma prestação vencida, por classe de dias de atraso.</li>
              <li><b>Taxa mensal:</b> a taxa de cada contrato convertida para o mês; <b>prazo</b> medido da data de início ao último vencimento.</li>
              <li><b>Situação financeira:</b> saldo das carteiras no último dia de cada mês — Caixa, Bancos (carteiras do tipo Banco) e Outros activos (M-Pesa, E-Mola e restantes).</li>
            </ul>
          </div>
        </section>
      ) : null}

      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ModeloBM;
