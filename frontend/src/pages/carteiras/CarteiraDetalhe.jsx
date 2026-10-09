import { useContext, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Scale, Wallet } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import LogoCarteira from "../emprestimos/LogoCarteira";
import { Campo, Kpi, MensagemModal, ModalFormulario } from "../comum/ElementosModulo";
import { dataHoraCurta } from "../comum/utilModulo";
import { ChipEstadoCarteira, ChipMovimento, ChipValor } from "./ChipsCarteira";
import { CAMINHO_CAR } from "./iconesCarteira";
import { alertasCarteira, conciliacaoSistema, fluxoCarteira, fluxoDiario, listarMovimentos, obterCarteira, registarFecho } from "../../services/carteirasMicrocredito";
import { formatarMT, saldoDisponivel } from "../../services/emprestimosMicrocredito";
import { hojeIso } from "../../services/pagamentosMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Carteiras.css";

const CarteiraDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [versao, setVersao] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [fecho, setFecho] = useState(null);
  const carteira = useMemo(() => obterCarteira(id), [id, versao]);
  const movimentos = useMemo(() => (carteira ? listarMovimentos(carteira.id).slice(0, 20) : []), [carteira, versao]);
  const fluxo = useMemo(() => (carteira ? fluxoCarteira(carteira.id, `${hojeIso().slice(0, 7)}-01`, hojeIso()) : { entradas: 0, saidas: 0, fluxo: 0 }), [carteira, versao]);
  const serie = useMemo(() => (carteira ? fluxoDiario(14, carteira.id) : []), [carteira, versao]);
  const maxFluxo = Math.max(1, ...serie.flatMap((d) => [d.entradas, d.saidas]));

  if (!carteira) {
    return (
      <div className="cli-page">
        <span className="cli-pill">Carteira não encontrada</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_CAR}/gestao`)}><ArrowLeft size={16} /> Voltar</button>
      </div>
    );
  }

  const conc = conciliacaoSistema(carteira);
  const alertas = alertasCarteira(carteira);

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Wallet size={16} /> {carteira.nome}</span>
          <ChipEstadoCarteira estado={carteira.status} />
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_CAR}/gestao`)}><ArrowLeft size={16} /> Voltar</button>
          <button type="button" className="cli-btn-io" onClick={() => setFecho({ tipo: "Fecho de caixa", saldo_contado: String(carteira.saldo), observacoes: "", ajustar: false })}><Scale size={16} /> Fecho de caixa</button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate(`${CAMINHO_CAR}/${carteira.id}/editar`)}><Pencil size={16} /> Editar</button>
        </div>
      </header>

      <div className="pag-kpis">
        <Kpi icone={Wallet} rotulo="Saldo actual" valor={formatarMT(carteira.saldo)} detalhe={`disponível ${formatarMT(saldoDisponivel(carteira))}`} />
        <Kpi icone={Wallet} rotulo="Entradas do mês" valor={formatarMT(fluxo.entradas)} detalhe="créditos" tom="is-azul" atraso={60} />
        <Kpi icone={Wallet} rotulo="Saídas do mês" valor={formatarMT(fluxo.saidas)} detalhe="débitos" tom="is-vermelho" atraso={120} />
        <Kpi icone={Wallet} rotulo="Fluxo do mês" valor={formatarMT(fluxo.fluxo)} detalhe={alertas[0]?.texto || "sem alertas"} tom={fluxo.fluxo < 0 ? "is-amarelo" : ""} atraso={180} />
      </div>

      <section className="cli-section">
        <h2>Últimos 14 dias</h2>
        <div className="car-fluxo">
          {serie.map((d) => <i key={d.dia} title={`${d.dia}: +${d.entradas} / −${d.saidas}`} style={{ height: `${(Math.max(d.entradas, d.saidas) / maxFluxo) * 100}%` }} className={d.saidas > d.entradas ? "is-saida" : ""} />)}
        </div>
      </section>

      <section className="cli-section">
        <div className="mod-cartao-topo">
          <LogoCarteira carteira={carteira} />
          <span>
            <h3>{carteira.codigo} · {carteira.tipo}</h3>
            <small>Saldo inicial {formatarMT(carteira.saldo_inicial)} · conciliação {formatarMT(conc.calculado)}{conc.diferenca ? ` · diferença ${formatarMT(conc.diferenca)}` : ""}</small>
          </span>
        </div>
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table pag-tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {movimentos.map((m) => (
              <tr key={m.id}>
                <td>{dataHoraCurta(m.data_movimento)}</td>
                <td><ChipMovimento tipo={m.tipo_movimento} /></td>
                <td>{m.descricao}</td>
                <td className={`car-linha-sinal ${m.sinal > 0 ? "is-entrada" : "is-saida"}`}>{m.sinal > 0 ? "+" : "−"}{formatarMT(m.valor)}</td>
                <td><ChipValor valor={m.saldo_posterior} tom="is-cinza" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fecho ? (
        <ModalFormulario icone={Scale} titulo={fecho.tipo} onFechar={() => setFecho(null)} accoes={<><button type="button" className="cli-btn ghost" onClick={() => setFecho(null)}>Cancelar</button><button type="button" className="cli-btn-novo" onClick={() => {
          try {
            const f = registarFecho({ wallet_id: carteira.id, ...fecho }, usuario);
            setFecho(null);
            setVersao((v) => v + 1);
            setAviso({ texto: `${f.codigo} registado. Diferença: ${formatarMT(f.diferenca)}.` });
          } catch (e) { setAviso({ erro: true, texto: e.message }); }
        }}>Registar</button></>}>
          <Campo label="Saldo contado / extracto"><input value={fecho.saldo_contado} onChange={(e) => setFecho((a) => ({ ...a, saldo_contado: e.target.value }))} /></Campo>
          <Campo label="Observações"><textarea rows={2} value={fecho.observacoes} onChange={(e) => setFecho((a) => ({ ...a, observacoes: e.target.value }))} /></Campo>
          <label className="cli-field"><input type="checkbox" checked={fecho.ajustar} onChange={(e) => setFecho((a) => ({ ...a, ajustar: e.target.checked }))} /> Ajustar o saldo do sistema se houver diferença</label>
        </ModalFormulario>
      ) : null}
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default CarteiraDetalhe;
